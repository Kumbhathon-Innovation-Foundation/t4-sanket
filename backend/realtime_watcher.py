"""
ANUBHAV Stage 3: Realtime Advisory Watcher
Monitors Supabase for advisory corridor activations (e.g. from direct Supabase Studio edits
or PRAVAH admin action). When an advisory goes active, checks all active trips, reroutes
affected segments, inserts into trip_patches, and updates trips.
"""

import asyncio
import logging
import os
import sys
import time
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add backend directory to sys.path
backend_dir = str(Path(__file__).parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import tool_executor as te
from agent import run_agent_loop
from supabase_client import get_supabase_admin

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("anubhav.realtime_watcher")

IST = timezone(timedelta(hours=5, minutes=30))
supabase = get_supabase_admin()

def check_and_patch_affected_trips(advisory_id: str, severity: str = "critical") -> int:
    """
    Checks all trips with status='active' for route overlap with the activated advisory.
    Regenerates affected segment, writes to trip_patches, and updates trips.
    Returns number of affected trips patched.
    """
    if not supabase:
        return 0

    try:
        res = supabase.table("trips").select("*").eq("status", "active").execute()
        active_trips = res.data or []
        logger.info(f"[Advisory Watcher] Checking {len(active_trips)} active trips against advisory {advisory_id}")

        patched_count = 0
        for trip_row in active_trips:
            trip_id = trip_row["id"]
            itinerary = trip_row.get("itinerary") or {}
            stops = itinerary.get("stops", [])

            # Check each segment's polyline
            affected = False
            for s in stops:
                poly = s.get("polyline")
                if poly and len(poly) > 1:
                    hits = te.get_restrictions_and_advisories(path_lnglat=poly, only_active=True)
                    if any(h.get("id") == advisory_id for h in hits):
                        affected = True
                        break

            # If no polyline overlap found, also check if trip destination is near corridor
            if not affected and stops:
                last_stop = stops[-1]
                lat = last_stop.get("lat") or 20.007
                lng = last_stop.get("lng") or 73.792
                hits = te.get_restrictions_and_advisories(near_lat=lat, near_lng=lng, only_active=True)
                if any(h.get("id") == advisory_id for h in hits):
                    affected = True

            if affected:
                logger.info(f"[Advisory Match] Trip {trip_id} overlaps with active advisory {advisory_id}! Generating patch...")
                patch_prompt = f"CRITICAL RESTRICTION ACTIVE: Advisory {advisory_id} ({severity}) is in effect on Ramkund corridor. Reroute walking path immediately avoiding this corridor."
                new_itinerary = run_agent_loop(user_message=patch_prompt, existing_itinerary=itinerary)
                
                new_itinerary["active_advisories"] = [{
                    "id": advisory_id,
                    "type": "VIP",
                    "severity": severity
                }]

                patch_id = f"patch_{uuid.uuid4().hex[:8]}"
                supabase.table("trip_patches").insert({
                    "id": patch_id,
                    "trip_id": trip_id,
                    "patch": new_itinerary,
                    "reason": f"Live advisory {advisory_id} activated ({severity})",
                    "created_at": datetime.now(IST).isoformat()
                }).execute()

                supabase.table("trips").update({
                    "itinerary": new_itinerary,
                    "last_updated": datetime.now(IST).isoformat()
                }).eq("id", trip_id).execute()

                patched_count += 1
                logger.info(f"[Advisory Match] Trip {trip_id} successfully patched!")

        return patched_count

    except Exception as e:
        logger.error(f"[Advisory Watcher Error] {e}")
        return 0

def poll_advisories_loop(poll_interval_seconds: int = 5):
    """
    Continuous background watcher: polls advisory_corridors for status changes
    and triggers trip patches.
    """
    logger.info(f"Starting Advisory Watcher loop (polling every {poll_interval_seconds}s)...")
    known_active = set()

    # Initial snapshot
    try:
        res = supabase.table("advisory_corridors").select("id, status, severity").eq("status", "active").execute()
        for row in res.data or []:
            known_active.add(row["id"])
    except Exception as e:
        logger.warning(f"Failed to fetch initial active advisories: {e}")

    while True:
        try:
            res = supabase.table("advisory_corridors").select("id, status, severity").eq("status", "active").execute()
            current_active = {r["id"]: r.get("severity", "critical") for r in (res.data or [])}

            newly_active = set(current_active.keys()) - known_active
            if newly_active:
                logger.info(f"[Advisory Watcher] Detected newly activated advisories: {newly_active}")
                for adv_id in newly_active:
                    severity = current_active[adv_id]
                    te.set_advisory_active(adv_id, severity=severity, active=True)
                    check_and_patch_affected_trips(adv_id, severity)

            known_active = set(current_active.keys())
        except Exception as e:
            logger.warning(f"Error in advisory polling tick: {e}")

        time.sleep(poll_interval_seconds)

if __name__ == "__main__":
    poll_advisories_loop()
