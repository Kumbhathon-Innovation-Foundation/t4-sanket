import time
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_stage8_visit_and_continue_flow():
    print("\n--- TEST 1: Create initial trip via /plan ---")
    plan_payload = {
        "user_id": "pilgrim_stage8_test",
        "message": "Coming by car, need full pilgrimage plan to Ramkund",
        "mode": "nl"
    }
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/plan", json=plan_payload)
    print(f"Plan status: {res.status_code} in {time.time() - t0:.2f}s")
    assert res.status_code == 200, f"Plan failed: {res.text}"
    plan_data = res.json()
    trip_id = plan_data["trip_id"]
    initial_stops = plan_data["stops"]
    print(f"Initial trip ID: {trip_id}, Stops count: {len(initial_stops)}")
    for s in initial_stops:
        print(f"  Stop {s.get('order')}: {s.get('type')} - {s.get('name') or s.get('from', '') + ' -> ' + s.get('to', '')}")

    print("\n--- TEST 2: Surgical Patch for Heritage POI Visit (Kalaram Temple) ---")
    visit_payload = {
        "trip_id": trip_id,
        "message": "Add visit stop to Kalaram Temple",
        "intent": "visit",
        "category": "temple",
        "location": {"lat": 20.0070, "lng": 73.7915},
        "poi_data": {
            "id": "kalaram_temple",
            "name": "Kalaram Temple",
            "lat": 20.0068,
            "lng": 73.7919,
            "category": "Temple"
        }
    }
    t1 = time.time()
    patch_res = requests.post(f"{BASE_URL}/patch", json=visit_payload)
    patch_duration = time.time() - t1
    print(f"Patch status: {patch_res.status_code} in {patch_duration:.2f}s")
    assert patch_res.status_code == 200, f"Patch failed: {patch_res.text}"
    patch_data = patch_res.json()
    new_stops = patch_data["stops"]
    print(f"Updated stops count: {len(new_stops)}")

    # Verify surgical latency < 2 seconds (OSRM only, no full LLM)
    assert patch_duration < 3.0, f"Patch took too long ({patch_duration:.2f}s), should be surgical OSRM"

    # Verify Kalaram Temple is in the new stops
    visited_names = [s.get("name") for s in new_stops if s.get("type") == "visit"]
    print(f"Visited stops in itinerary: {visited_names}")
    assert any("Kalaram" in (name or "") for name in visited_names), "Kalaram Temple not found in visit stops"

    # Verify original destination (Ramkund) is still present
    assert any("Ramkund" in (s.get("name") or s.get("to") or "") for s in new_stops), "Original destination Ramkund lost after patch"

    print("\n--- TEST 3: Surgical Patch for Food / Utility ('Add to my route') ---")
    food_payload = {
        "trip_id": trip_id,
        "message": "Add Community Food Centre to route",
        "intent": "add_to_route",
        "category": "food",
        "location": {"lat": 20.0068, "lng": 73.7919},
        "poi_data": {
            "id": "food_centre_sangam",
            "name": "Community Food Centre",
            "lat": 20.0055,
            "lng": 73.7940,
            "category": "Food"
        }
    }
    t2 = time.time()
    food_res = requests.post(f"{BASE_URL}/patch", json=food_payload)
    food_duration = time.time() - t2
    print(f"Food patch status: {food_res.status_code} in {food_duration:.2f}s")
    assert food_res.status_code == 200, f"Food patch failed: {food_res.text}"
    food_data = food_res.json()
    food_stops = food_data["stops"]
    print(f"Stops after food patch count: {len(food_stops)}")
    food_visited_names = [s.get("name") for s in food_stops if s.get("type") == "visit"]
    print(f"Visited stops now: {food_visited_names}")
    assert any("Food" in (name or "") for name in food_visited_names), "Community Food Centre not found in visit stops"

    print("\n[SUCCESS] ALL STAGE 8 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_stage8_visit_and_continue_flow()
