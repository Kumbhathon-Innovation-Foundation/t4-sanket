import requests
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_return_and_multi_temple():
    print("\n--- TEST 1: Multi-Temple Pilgrimage with Parents ---")
    multi_payload = {
        "user_id": "pilgrim_parents",
        "message": "with my parents i want to visit prominent temples in nashik create itinerary",
        "mode": "nl"
    }
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/plan", json=multi_payload)
    print(f"Plan response status: {res.status_code} in {time.time() - t0:.2f}s")
    assert res.status_code == 200, f"Plan failed: {res.text}"

    data = res.json()
    trip_id = data["trip_id"]
    stops = data["stops"]
    summary = data["summary_text"]
    print(f"Trip ID: {trip_id}")
    print(f"Summary: {summary}")
    print(f"Total stops: {len(stops)}")

    for s in stops:
        print(f"  Order {s.get('order')}: [{s.get('type')}] - {s.get('name') or (s.get('from', '') + ' -> ' + s.get('to', ''))}")

    # Verify multiple visits
    visits = [s for s in stops if s.get("type") == "visit"]
    assert len(visits) >= 2, f"Expected at least 2 temple visits, got {len(visits)}"
    visit_names = [v.get("name", "") for v in visits]
    print(f"Visits planned: {visit_names}")
    assert any("Kalaram" in n for n in visit_names), "Should include Kalaram Temple"
    assert any("Ramkund" in n for n in visit_names), "Should include Ramkund"

    print("\n--- TEST 2: Return to Parking Intent (/patch) ---")
    return_payload = {
        "trip_id": trip_id,
        "message": "way back to my parking",
        "intent": "return_to_parking",
        "location": {"lat": 20.0077, "lng": 73.7926}
    }
    t1 = time.time()
    res_ret = requests.post(f"{BASE_URL}/patch", json=return_payload)
    print(f"Patch return status: {res_ret.status_code} in {time.time() - t1:.2f}s")
    assert res_ret.status_code == 200, f"Return patch failed: {res_ret.text}"

    data_ret = res_ret.json()
    ret_stops = data_ret["stops"]
    print(f"Return summary: {data_ret['summary_text']}")
    print(f"Return stops count: {len(ret_stops)}")
    for s in ret_stops:
        print(f"  Order {s.get('order')}: [{s.get('type')}] - {s.get('name') or (s.get('from', '') + ' -> ' + s.get('to', ''))}")

    # Verify return stops lead back to parking
    last_stop = ret_stops[-1]
    assert last_stop["type"] == "parking", f"Last return stop should be parking, got {last_stop['type']}"
    assert len(last_stop.get("name", "")) > 0, "Last return stop must have a name"

    print("\n[SUCCESS] MULTI-TEMPLE & RETURN-TO-PARKING TESTS PASSED!")

if __name__ == "__main__":
    test_return_and_multi_temple()
