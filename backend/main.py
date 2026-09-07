"""
ANUBHAV Backend FastAPI Service
Endpoints:
- POST /plan: Creates full itinerary matching ITINERARY_SCHEMA & persists to trips table
- POST /patch: Incremental itinerary modifications & persists to trip_patches + trips
- POST /admin/publish-advisory: PRAVAH admin action to activate/deactivate advisory corridors
- GET /trips/{trip_id}: Returns current trip state
- GET /health: Health check
"""

import logging
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend directory is in sys.path
backend_dir = str(Path(__file__).parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import tool_executor as te
from agent import run_agent_loop
from schemas import (
    PlanRequest,
    PatchRequest,
    PublishAdvisoryRequest,
    NearbySearchRequest,
    ItinerarySchema,
    ItineraryPatch
)
from supabase_client import get_supabase_admin

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("anubhav.api")

IST = timezone(timedelta(hours=5, minutes=30))

app = FastAPI(
    title="ANUBHAV — Kumbh Mela AI Pilgrimage Agent",
    description="Agentic planning service with tool execution grounded in official Nashik mobility geo-data.",
    version="1.0.0"
)

# Enable CORS for Flutter mobile / web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = get_supabase_admin()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ANUBHAV AI Agent",
        "timestamp": datetime.now(IST).isoformat(),
        "database": "connected" if supabase else "local_fallback"
    }

@app.post("/plan", response_model=Dict[str, Any])
def create_plan(req: PlanRequest):
    """
    Generates a full pilgrimage plan grounded strictly in tool data.
    Writes the resulting itinerary into the 'trips' table in Supabase.
    """
    logger.info(f"[/plan] User: {req.user_id}, Mode: {req.mode}, Message: {req.message}")

    # Build prompt
    prompt = req.message
    if req.mode == "structured" and req.form_data:
        prompt = f"Plan trip for pilgrim: {req.message}. Details: {req.form_data}"

    # Run agent loop with form_data for group-aware planning (Stage 12)
    itinerary = run_agent_loop(user_message=prompt, form_data=req.form_data)

    trip_id = itinerary.get("trip_id") or f"trip_{uuid.uuid4().hex[:8]}"
    itinerary["trip_id"] = trip_id

    # Persist or update in Supabase 'trips' table
    if supabase:
        try:
            supabase.table("trips").upsert({
                "id": trip_id,
                "user_id": req.user_id,
                "status": "active",
                "itinerary": itinerary,
                "last_updated": datetime.now(IST).isoformat()
            }).execute()
            logger.info(f"[/plan] Successfully saved trip {trip_id} to Supabase 'trips'")
        except Exception as e:
            logger.warning(f"[/plan] Failed to write trip to Supabase (check if table exists): {e}")

    return itinerary

def _recompute_affected_segment_for_visit(
    existing_trip: Dict[str, Any],
    poi_name: str,
    poi_id: str,
    poi_lat: float,
    poi_lng: float,
    curr_location: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    now = datetime.now(IST)
    old_stops = existing_trip.get("stops", [])
    if not old_stops:
        return run_agent_loop(f"Visit {poi_name} at Ramkund", existing_itinerary=existing_trip)

    start_lat = curr_location.get("lat", 20.007) if curr_location else 20.007
    start_lng = curr_location.get("lng", 73.792) if curr_location else 73.792

    # Find the next original target stop (e.g. Ramkund)
    target_stop = None
    for s in reversed(old_stops):
        if s.get("type") == "visit":
            target_stop = s
            break
    if not target_stop:
        target_stop = old_stops[-1]

    dest_name = target_stop.get("name", "Ramkund Sacred Ghat")
    dest_lat = 20.0077
    dest_lng = 73.7926
    for s in old_stops:
        if s.get("polyline") and len(s["polyline"]) > 0:
            dest_lng, dest_lat = s["polyline"][-1][0], s["polyline"][-1][1]

    # Recompute ONLY affected segments via OSRM
    route_to_poi = te.get_route(
        from_lat=start_lat,
        from_lng=start_lng,
        to_lat=poi_lat,
        to_lng=poi_lng,
        mode="walking"
    )
    route_from_poi_to_dest = te.get_route(
        from_lat=poi_lat,
        from_lng=poi_lng,
        to_lat=dest_lat,
        to_lng=dest_lng,
        mode="walking"
    )

    new_stops = []
    order = 1

    for s in old_stops:
        if s.get("type") in ["parking", "transit_segment"]:
            copied = dict(s)
            copied["order"] = order
            new_stops.append(copied)
            order += 1

    walk1_min = route_to_poi.get("eta_min", 8)
    eta_walk_1 = (now + timedelta(minutes=5)).strftime("%H:%M")
    new_stops.append({
        "order": order,
        "type": "walk_segment",
        "from": "Current Location",
        "to": poi_name,
        "eta": eta_walk_1,
        "duration_min": walk1_min,
        "polyline": route_to_poi.get("polyline", []),
        "crowd_color": "green",
        "pois_along_route": []
    })
    order += 1

    eta_visit_poi = (now + timedelta(minutes=5 + walk1_min)).strftime("%H:%M")
    new_stops.append({
        "order": order,
        "type": "visit",
        "name": poi_name,
        "poi_id": poi_id,
        "eta": eta_visit_poi,
        "suggested_duration_min": 20,
        "crowd_color": "green"
    })
    order += 1

    walk2_min = route_from_poi_to_dest.get("eta_min", 12)
    eta_walk_2 = (now + timedelta(minutes=25 + walk1_min)).strftime("%H:%M")
    new_stops.append({
        "order": order,
        "type": "walk_segment",
        "from": poi_name,
        "to": dest_name,
        "eta": eta_walk_2,
        "duration_min": walk2_min,
        "polyline": route_from_poi_to_dest.get("polyline", []),
        "crowd_color": "yellow",
        "pois_along_route": []
    })
    order += 1

    eta_final_dest = (now + timedelta(minutes=25 + walk1_min + walk2_min)).strftime("%H:%M")
    final_visit = dict(target_stop)
    final_visit["order"] = order
    final_visit["eta"] = eta_final_dest
    new_stops.append(final_visit)

    summary = f"Updated route to visit {poi_name}. Recomputed walking connection to {dest_name}."
    if existing_trip.get("detected_language") == "mr" or existing_trip.get("language_code") == "mr-IN":
        summary = f"मार्ग अद्ययावत केला: {poi_name} येथे दर्शन घेऊन {dest_name} कडे मार्ग पुनर्निर्देशित केला आहे."
    elif existing_trip.get("detected_language") == "hi" or existing_trip.get("language_code") == "hi-IN":
        summary = f"यात्रा मार्ग अपडेट किया: {poi_name} के दर्शन के बाद {dest_name} के लिए पैदल मार्ग पुनः निर्धारित किया गया।"

    return {
        "trip_id": existing_trip.get("trip_id") or f"trip_{uuid.uuid4().hex[:8]}",
        "status": "active",
        "summary_text": summary,
        "language_code": existing_trip.get("language_code", "en-IN"),
        "detected_language": existing_trip.get("detected_language", "en"),
        "stops": new_stops,
        "active_advisories": existing_trip.get("active_advisories", []),
        "last_updated": now.isoformat()
    }

def _generate_return_to_parking_itinerary(
    existing_trip: Dict[str, Any],
    curr_location: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    now = datetime.now(IST)
    old_stops = existing_trip.get("stops", [])

    # Find the parking stop from existing trip
    parking_stop = None
    for s in old_stops:
        if s.get("type") == "parking":
            parking_stop = s
            break
    if not parking_stop:
        parking_stop = {
            "name": "Panjarpol Outer Parking",
            "zone_type": "outer",
            "transit_required": True,
            "fare_estimate": 20,
            "lat": 20.0490,
            "lng": 73.8046
        }

    is_outer = (parking_stop.get("zone_type") == "outer" or parking_stop.get("transit_required") is True)
    parking_name = parking_stop.get("name", "Parking Zone")

    start_lat = curr_location.get("lat", 20.0077) if curr_location else 20.0077
    start_lng = curr_location.get("lng", 73.7926) if curr_location else 73.7926

    stops = []
    order = 1
    cur_time = now

    if is_outer:
        # Walk from destination/current pos to Panchavati Drop Point (shuttle boarding station)
        drop_lat = 20.0050
        drop_lng = 73.7910
        drop_name = "Panchavati Drop Point"
        walk_route = te.get_route(
            from_lat=start_lat,
            from_lng=start_lng,
            to_lat=drop_lat,
            to_lng=drop_lng,
            mode="walking"
        )
        walk_min = walk_route.get("eta_min", 4)
        stops.append({
            "order": order,
            "type": "walk_segment",
            "from": "Ramkund Sacred Area",
            "to": drop_name,
            "eta": cur_time.strftime("%H:%M"),
            "duration_min": walk_min,
            "polyline": walk_route.get("polyline", []),
            "crowd_color": "green",
            "pois_along_route": []
        })
        order += 1
        cur_time += timedelta(minutes=walk_min)

        # Shuttle leg back to outer parking
        stops.append({
            "order": order,
            "type": "transit_segment",
            "vehicle_type": "govt_shuttle",
            "from": drop_name,
            "to": parking_name,
            "eta": cur_time.strftime("%H:%M"),
            "duration_min": 12,
            "fare_estimate": 15,
            "note": f"Return feeder shuttle from {drop_name} directly to {parking_name}."
        })
        order += 1
        cur_time += timedelta(minutes=12)

        # Reached Parking
        stops.append({
            "order": order,
            "type": "parking",
            "name": parking_name,
            "eta": cur_time.strftime("%H:%M"),
            "note": "Arrived at your parked car. Journey completed peacefully!"
        })
    else:
        # Inner parking: walk directly back
        p_lat = parking_stop.get("lat", 19.9950)
        p_lng = parking_stop.get("lng", 73.7800)
        walk_route = te.get_route(
            from_lat=start_lat,
            from_lng=start_lng,
            to_lat=p_lat,
            to_lng=p_lng,
            mode="walking"
        )
        walk_min = walk_route.get("eta_min", 15)
        stops.append({
            "order": order,
            "type": "walk_segment",
            "from": "Ramkund Sacred Area",
            "to": parking_name,
            "eta": cur_time.strftime("%H:%M"),
            "duration_min": walk_min,
            "polyline": walk_route.get("polyline", []),
            "crowd_color": "green",
            "pois_along_route": []
        })
        order += 1
        cur_time += timedelta(minutes=walk_min)

        stops.append({
            "order": order,
            "type": "parking",
            "name": parking_name,
            "eta": cur_time.strftime("%H:%M"),
            "note": "Arrived at your parked car. Journey completed peacefully!"
        })

    summary = f"Return journey to {parking_name} initiated. Walk to Panchavati Drop Point to board the return government shuttle back to your parked car."
    if existing_trip.get("detected_language") == "mr" or existing_trip.get("language_code") == "mr-IN":
        summary = f"{parking_name} कडे परतीचा प्रवास सुरू! पंचावती ड्रॉप पॉईंटकडे पायी जाऊन परतीच्या शासकीय शटलने आपल्या गाडीकडे पोहोचा."
    elif existing_trip.get("detected_language") == "hi" or existing_trip.get("language_code") == "hi-IN":
        summary = f"{parking_name} वापसी यात्रा शुरू! पंचावती ड्रॉप पॉइंट तक पैदल चलें और वहां से अपनी गाड़ी के लिए सरकारी शटल लें।"

    return {
        "trip_id": existing_trip.get("trip_id") or f"trip_{uuid.uuid4().hex[:8]}",
        "status": "active",
        "summary_text": summary,
        "language_code": existing_trip.get("language_code", "en-IN"),
        "detected_language": existing_trip.get("detected_language", "en"),
        "stops": stops,
        "active_advisories": existing_trip.get("active_advisories", []),
        "last_updated": now.isoformat()
    }

@app.post("/patch", response_model=Dict[str, Any])
def patch_plan(req: PatchRequest):
    """
    Applies in-trip modifications ('remove X', 'find food near me', 'visit temple', 'return to parking').
    Patches affected segment, writes to 'trip_patches', and updates 'trips'.
    """
    logger.info(f"[/patch] Trip: {req.trip_id}, Intent: {req.intent}, Message: {req.message}")

    existing_trip = None
    if supabase:
        try:
            res = supabase.table("trips").select("*").eq("id", req.trip_id).execute()
            if res.data:
                existing_trip = res.data[0].get("itinerary")
        except Exception as e:
            logger.warning(f"[/patch] Failed to fetch trip from Supabase: {e}")

    # 0. Special handling: Return to parking
    if req.intent in ["return_to_parking", "way_back", "return"] or any(k in req.message.lower() for k in ["return to parking", "way back", "return", "वापस", "परत"]):
        patched_itinerary = _generate_return_to_parking_itinerary(
            existing_trip=existing_trip or {},
            curr_location=req.location
        )
    # 1. Special handling: Surgical stop insertion for "visit" or "add_to_route"
    elif req.intent in ["visit", "add_to_route", "insert_stop"] or req.poi_data is not None or ("visit" in req.message.lower() and existing_trip):
        poi_data = req.poi_data or {}
        poi_name = poi_data.get("name") or req.message.replace("Visit", "").replace("Add", "").replace("visit stop to", "").strip() or "Sacred Site"
        poi_id = poi_data.get("id") or f"poi_{uuid.uuid4().hex[:6]}"
        poi_lat = float(poi_data.get("lat") or (req.location.get("lat") if req.location else 20.007))
        poi_lng = float(poi_data.get("lng") or (req.location.get("lng") if req.location else 73.792))

        patched_itinerary = _recompute_affected_segment_for_visit(
            existing_trip=existing_trip or {},
            poi_name=poi_name,
            poi_id=poi_id,
            poi_lat=poi_lat,
            poi_lng=poi_lng,
            curr_location=req.location
        )
    # 2. Special handling: "find_nearby" ad-hoc search
    elif req.intent == "find_nearby" or "food" in req.message.lower() or "toilet" in req.message.lower():
        cat = req.category or ("food" if "food" in req.message.lower() or "bhookh" in req.message.lower() else "toilet")
        lat = req.location.get("lat", 20.007) if req.location else 20.007
        lng = req.location.get("lng", 73.792) if req.location else 73.792

        candidates = te.get_nearby(category=cat, lat=lat, lng=lng, radius_m=1000)
        ranked = te.rank_by_experience(candidates)
        top3 = ranked[:3]

        patch_obj = {
            "trip_id": req.trip_id,
            "patch_reason": f"Nearby {cat} search requested by pilgrim",
            "nearby_results": top3,
            "stops": existing_trip.get("stops", []) if existing_trip else [],
            "last_updated": datetime.now(IST).isoformat()
        }
        return patch_obj
    else:
        # General in-trip agent patch via LLM
        prompt = f"Pilgrim requested modification to active trip {req.trip_id}: {req.message}"
        patched_itinerary = run_agent_loop(user_message=prompt, existing_itinerary=existing_trip)

    patch_id = f"patch_{uuid.uuid4().hex[:8]}"
    patch_reason = req.message

    # Persist patch and update trip in Supabase
    if supabase:
        try:
            supabase.table("trip_patches").insert({
                "id": patch_id,
                "trip_id": req.trip_id,
                "patch": patched_itinerary,
                "reason": patch_reason,
                "created_at": datetime.now(IST).isoformat()
            }).execute()

            supabase.table("trips").update({
                "itinerary": patched_itinerary,
                "last_updated": datetime.now(IST).isoformat()
            }).eq("id", req.trip_id).execute()

            logger.info(f"[/patch] Saved patch {patch_id} and updated trip {req.trip_id}")
        except Exception as e:
            logger.warning(f"[/patch] Failed to record patch in Supabase: {e}")

    return {
        "trip_id": req.trip_id,
        "patch_reason": patch_reason,
        "summary_text": patched_itinerary.get("summary_text", ""),
        "language_code": patched_itinerary.get("language_code", "en-IN"),
        "stops": patched_itinerary.get("stops", []),
        "active_advisories": patched_itinerary.get("active_advisories", []),
        "last_updated": datetime.now(IST).isoformat()
    }

def check_active_trips_against_advisory(advisory_id: str, severity: str, active: bool):
    """
    Background worker: checks all active trips in Supabase against newly activated advisory.
    If route overlaps, regenerates the impacted segment, writes to trip_patches, and updates trips.
    """
    if not supabase or not active:
        return

    try:
        # Fetch active trips
        res = supabase.table("trips").select("*").eq("status", "active").execute()
        active_trips = res.data or []
        logger.info(f"[Advisory Watcher] Checking {len(active_trips)} active trips against advisory {advisory_id}...")

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

            if affected:
                logger.info(f"[Advisory Trigger] Trip {trip_id} affected by advisory {advisory_id}! Generating automatic patch...")
                patch_prompt = f"CRITICAL ALERT: Advisory {advisory_id} ({severity}) is now ACTIVE on Ramkund route. Reroute walking segments avoiding this corridor immediately!"
                new_itinerary = run_agent_loop(user_message=patch_prompt, existing_itinerary=itinerary)
                
                # Append active advisory note
                new_itinerary["active_advisories"] = [{"id": advisory_id, "type": "VIP", "severity": severity}]

                # Write patch
                patch_id = f"patch_{uuid.uuid4().hex[:8]}"
                supabase.table("trip_patches").insert({
                    "id": patch_id,
                    "trip_id": trip_id,
                    "patch": new_itinerary,
                    "reason": f"Automatic reroute: Live advisory {advisory_id} activated ({severity})",
                    "created_at": datetime.now(IST).isoformat()
                }).execute()

                supabase.table("trips").update({
                    "itinerary": new_itinerary,
                    "last_updated": datetime.now(IST).isoformat()
                }).eq("id", trip_id).execute()
                logger.info(f"[Advisory Trigger] Trip {trip_id} patched successfully!")

    except Exception as e:
        logger.error(f"[Advisory Watcher Error] {e}")

@app.post("/admin/publish-advisory")
def publish_advisory(req: PublishAdvisoryRequest, bg_tasks: BackgroundTasks):
    """
    PRAVAH admin action: updates advisory_corridors in Supabase.
    Triggers server-side reaction checking all active trips for route overlap.
    """
    logger.info(f"[/admin/publish-advisory] {req.advisory_id}, severity={req.severity}, active={req.active}")

    updated = te.set_advisory_active(advisory_id=req.advisory_id, severity=req.severity, active=req.active)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Advisory corridor '{req.advisory_id}' not found.")

    # Trigger background active trip recalculation
    bg_tasks.add_task(check_active_trips_against_advisory, req.advisory_id, req.severity, req.active)

    return {
        "status": "success",
        "advisory_id": req.advisory_id,
        "severity": req.severity,
        "active": req.active,
        "message": f"Advisory {req.advisory_id} is now {'ACTIVE' if req.active else 'INACTIVE'}. Realtime subscribers notified."
    }

@app.get("/trips/{trip_id}")
def get_trip(trip_id: str):
    """Retrieves current trip itinerary."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")
    res = supabase.table("trips").select("*").eq("id", trip_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found")
    return res.data[0]

# =========================================================================
# STAGE 10: Live Crowd Levels Endpoint
# =========================================================================
@app.get("/crowd-levels")
def get_crowd_levels_endpoint(poi_ids: Optional[str] = None, zone: Optional[str] = None):
    """
    Returns live crowd levels with color coding (green/yellow/red)
    for POIs, ghats, or specified zone. Supports periodic UI refresh.
    """
    ids = [i.strip() for i in poi_ids.split(",") if i.strip()] if poi_ids else None
    levels = te.get_crowd_levels(poi_ids=ids, zone=zone)
    return {
        "status": "success",
        "timestamp": datetime.now(IST).isoformat(),
        "crowd_levels": levels
    }

# =========================================================================
# STAGE 11: One-Tap Utility Search Endpoint (Toilet, Medical, Food, Water)
# =========================================================================
@app.post("/nearby")
def search_nearby_post(req: NearbySearchRequest):
    """
    One-tap utility search: calls get_nearby(category, location) + rank_by_experience().
    Returns ranked candidates with scoring reasoning, queue wait, and crowd_color.
    """
    candidates = te.get_nearby(
        category=req.category,
        lat=req.lat or 20.0077,
        lng=req.lng or 73.7926,
        radius_m=req.radius_m or 1500
    )
    ranked = te.rank_by_experience(candidates)
    return {
        "category": req.category,
        "count": len(ranked),
        "results": ranked
    }

@app.get("/nearby")
def search_nearby_get(
    category: str,
    lat: float = 20.0077,
    lng: float = 73.7926,
    radius_m: int = 1500
):
    """GET variant for quick one-tap utility search."""
    candidates = te.get_nearby(
        category=category,
        lat=lat,
        lng=lng,
        radius_m=radius_m
    )
    ranked = te.rank_by_experience(candidates)
    return {
        "category": category,
        "count": len(ranked),
        "results": ranked
    }

# =========================================================================
# STAGE 12: Ghat Congestion Forecast & Optimal Window Endpoint
# =========================================================================
@app.get("/ghat-forecast")
def get_ghat_forecast(ghat_id: str = "ghat_0020"):
    """
    Returns today's hourly congestion forecast (06 AM to 10 PM)
    and optimal snan window for the specified ghat.
    """
    forecast = te.get_ghat_congestion_forecast(ghat_id=ghat_id)
    return forecast
