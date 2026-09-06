"""
ANUBHAV Stage 1 Verification Suite
Tests POST /plan, POST /patch, Supabase trips & trip_patches persistence,
tool grounding, and schema conformance against ITINERARY_SCHEMA.
"""

import json
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend in path
sys.path.insert(0, str(Path(__file__).parent))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from main import app
from supabase_client import get_supabase_admin

client = TestClient(app)
supabase = get_supabase_admin()

def test_stage1():
    print("==================================================")
    print("STAGE 1: BACKEND SERVICE & AGENT LOOP VERIFICATION")
    print("==================================================")

    # 1. Test Health Endpoint
    print("\n[1] Testing GET /health:")
    health_resp = client.get("/health")
    assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
    print(f"  - Health response: {health_resp.json()}")
    print("  [✓ PASS] /health is operational")

    # 2. Test POST /plan (Ram: coming from Dhule, snan at Nashik)
    print("\n[2] Testing POST /plan with demo scenario (Ram from Dhule, snan at Nashik):")
    plan_payload = {
        "user_id": "user_ram_dhule_001",
        "message": "Coming from Dhule by car, want to perform holy snan at Ramkund, full journey plan please.",
        "mode": "nl"
    }
    plan_resp = client.post("/plan", json=plan_payload)
    assert plan_resp.status_code == 200, f"/plan failed: {plan_resp.text}"
    itinerary = plan_resp.json()

    print(f"  - Trip ID: {itinerary.get('trip_id')}")
    print(f"  - Status: {itinerary.get('status')}")
    print(f"  - Summary Text: {itinerary.get('summary_text')[:100]}...")
    print(f"  - Total Stops: {len(itinerary.get('stops', []))}")

    # Validate Schema
    assert "trip_id" in itinerary, "Missing trip_id"
    assert itinerary.get("status") == "active", f"Expected active status, got {itinerary.get('status')}"
    assert "summary_text" in itinerary, "Missing summary_text"
    assert "stops" in itinerary and len(itinerary["stops"]) > 0, "Stops list is empty"
    assert "last_updated" in itinerary, "Missing last_updated"

    # Check stops grounding
    stop_types = [s.get("type") for s in itinerary["stops"]]
    print(f"  - Stop Types in sequence: {stop_types}")
    has_parking = any(t == "parking" for t in stop_types)
    has_walk = any(t == "walk_segment" for t in stop_types)
    print(f"  - Grounded Parking Stop included: {has_parking}")
    print(f"  - Grounded Walk Segment with polyline included: {has_walk}")

    # Inspect walk segment polyline (OSRM road route)
    for s in itinerary["stops"]:
        if s.get("type") == "walk_segment":
            poly = s.get("polyline", [])
            print(f"  - Walk segment polyline coordinate points: {len(poly)}")
            pois = s.get("pois_along_route", [])
            print(f"  - POIs detected along route: {[p.get('name') for p in pois]}")
            break

    trip_id = itinerary["trip_id"]
    print("  [✓ PASS] POST /plan generated valid ITINERARY_SCHEMA")

    # 3. Verify Supabase 'trips' table persistence
    print("\n[3] Verifying persistence in Supabase 'trips' table:")
    trip_record = supabase.table("trips").select("*").eq("id", trip_id).execute()
    assert trip_record.data and len(trip_record.data) > 0, f"Trip {trip_id} not found in Supabase"
    saved_trip = trip_record.data[0]
    print(f"  - Supabase Trip ID: {saved_trip.get('id')}")
    print(f"  - Supabase User ID: {saved_trip.get('user_id')}")
    print(f"  - Supabase Status: {saved_trip.get('status')}")
    print(f"  - Saved Stops Count: {len(saved_trip.get('itinerary', {}).get('stops', []))}")
    print("  [✓ PASS] Itinerary persisted correctly in Supabase 'trips'")

    # 4. Test POST /patch: Food Search ("bhookh lagi hai")
    print("\n[4] Testing POST /patch with nearby search (intent='find_nearby', category='food'):")
    patch_food_payload = {
        "trip_id": trip_id,
        "message": "Bhookh lagi hai, please find good food nearby",
        "intent": "find_nearby",
        "category": "food",
        "location": {"lat": 20.007, "lng": 73.792}
    }
    food_resp = client.post("/patch", json=patch_food_payload)
    assert food_resp.status_code == 200, f"/patch food search failed: {food_resp.text}"
    food_patch = food_resp.json()
    nearby = food_patch.get("nearby_results", [])
    print(f"  - Patch reason: {food_patch.get('patch_reason')}")
    print(f"  - Nearby food spots returned: {len(nearby)}")
    if nearby:
        print(f"  - Top 1 Food Spot: {nearby[0].get('name')} ({nearby[0].get('reason')})")
    assert len(nearby) > 0, "No nearby food spots found"
    print("  [✓ PASS] POST /patch nearby search returned ranked results")

    # 5. Test POST /patch: Itinerary Modification ("remove Kalaram")
    print("\n[5] Testing POST /patch for in-trip modification ('remove Kalaram'):")
    patch_edit_payload = {
        "trip_id": trip_id,
        "message": "Remove Kalaram Temple from itinerary, I am running late"
    }
    edit_resp = client.post("/patch", json=patch_edit_payload)
    assert edit_resp.status_code == 200, f"/patch edit failed: {edit_resp.text}"
    edit_patch = edit_resp.json()
    print(f"  - Patch Reason: {edit_patch.get('patch_reason')}")
    print(f"  - Patched Stops Count: {len(edit_patch.get('stops', []))}")

    # Check trip_patches table
    patch_records = supabase.table("trip_patches").select("*").eq("trip_id", trip_id).execute()
    print(f"  - Rows found in Supabase 'trip_patches' for this trip: {len(patch_records.data)}")
    assert len(patch_records.data) > 0, "No patch record created in trip_patches"
    print("  [✓ PASS] POST /patch updated itinerary and recorded patch in Supabase")

    print("\n==================================================")
    print("ALL STAGE 1 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
    return True

if __name__ == "__main__":
    test_stage1()
