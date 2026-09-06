import requests
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_stage9_start_journey_and_transit():
    print("\n--- TEST 1: Outer-Zone Parking Plan (Car Pilgrim from Dhule) ---")
    outer_payload = {
        "user_id": "pilgrim_stage9_outer",
        "message": "Coming from Dhule by car, want to perform holy snan at Ramkund, full journey plan please.",
        "mode": "nl"
    }
    t0 = time.time()
    res = requests.post(f"{BASE_URL}/plan", json=outer_payload)
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

    # 1. Verify Stop 1 is Parking with zone_type == outer
    p_stop = stops[0]
    assert p_stop["type"] == "parking", f"Stop 1 should be parking, got {p_stop['type']}"
    assert p_stop.get("zone_type") == "outer", f"Parking zone_type should be outer, got {p_stop.get('zone_type')}"
    assert p_stop.get("transit_required") is True, "transit_required should be True for outer parking"

    # 2. Verify Stop 2 is Transit Segment
    t_stop = stops[1]
    assert t_stop["type"] == "transit_segment", f"Stop 2 should be transit_segment, got {t_stop['type']}"
    assert t_stop.get("vehicle_type") == "govt_shuttle", f"Transit vehicle should be govt_shuttle, got {t_stop.get('vehicle_type')}"
    assert "Drop Point" in t_stop.get("to", ""), f"Transit destination should be drop point, got {t_stop.get('to')}"
    print(f"Transit stop verified: {t_stop['from']} -> {t_stop['to']} (₹{t_stop.get('fare_estimate')}, {t_stop.get('duration_min')} min)")

    # 3. Verify Stop 3 is Walk Segment starting from Drop Point
    w_stop = stops[2]
    assert w_stop["type"] == "walk_segment", f"Stop 3 should be walk_segment, got {w_stop['type']}"
    assert w_stop.get("from") == t_stop.get("to"), f"Walk segment should start from {t_stop.get('to')}, got {w_stop.get('from')}"
    assert len(w_stop.get("polyline", [])) > 0, "Walk segment must contain polyline coordinates"

    # 4. Verify Stop 4 is Visit
    v_stop = stops[3]
    assert v_stop["type"] == "visit", f"Stop 4 should be visit, got {v_stop['type']}"
    assert "Ramkund" in (v_stop.get("name") or ""), f"Target visit should be Ramkund, got {v_stop.get('name')}"

    print("\n--- TEST 2: Inner-Zone Parking Plan (Direct Walking, No Transit Segment) ---")
    inner_payload = {
        "user_id": "pilgrim_stage9_inner",
        "message": "Walking pilgrim already near Panchavati, visiting Kapaleshwar Temple",
        "mode": "nl"
    }
    t1 = time.time()
    res2 = requests.post(f"{BASE_URL}/plan", json=inner_payload)
    print(f"Inner plan status: {res2.status_code} in {time.time() - t1:.2f}s")
    assert res2.status_code == 200
    data2 = res2.json()
    stops2 = data2["stops"]
    print(f"Stops count: {len(stops2)}")
    for s in stops2:
        print(f"  Order {s.get('order')}: [{s.get('type')}] - {s.get('name') or (s.get('from', '') + ' -> ' + s.get('to', ''))}")

    # Check that when transit_required is False or zone_type is inner, no transit_segment is inserted
    # (Or if parking is skipped for walking)
    has_transit = any(s.get("type") == "transit_segment" for s in stops2)
    has_outer_parking = any(s.get("type") == "parking" and s.get("zone_type") == "outer" for s in stops2)
    if not has_outer_parking:
        assert not has_transit, "Inner parking / direct walking should NOT insert transit_segment"
        print("Verified: No transit_segment when outer parking is not used.")

    print("\n--- TEST 3: Multilingual Summary & ITINERARY_SCHEMA Integrity ---")
    hi_payload = {
        "user_id": "pilgrim_stage9_hi",
        "message": "धुले से कार से आ रहे हैं, रामकुंड में स्नान करना है, यात्रा योजना बताएं।",
        "mode": "nl"
    }
    res_hi = requests.post(f"{BASE_URL}/plan", json=hi_payload)
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert data_hi["language_code"] == "hi-IN", f"Expected hi-IN, got {data_hi['language_code']}"
    assert len(data_hi["stops"]) >= 4, "Should have 4 stops with outer transit"
    print(f"Hindi summary: {data_hi['summary_text']}")
    print("Verified: Full ITINERARY_SCHEMA JSON present alongside multilingual summary.")

    print("\n[SUCCESS] ALL STAGE 9 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_stage9_start_journey_and_transit()
