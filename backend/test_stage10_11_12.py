"""
ANUBHAV Automated Test Suite: STAGE 10, STAGE 11, and STAGE 12
Validates:
- STAGE 10: Colour-coded crowd navigation (crowd_color on all walk_segments and POIs, /crowd-levels endpoint)
- STAGE 11: One-tap utility search (Toilet, Medical, Food, Water via /nearby with rank_by_experience)
- STAGE 12: Daily/Travel Planner (Ghat Congestion Forecast, vulnerable group-aware ghat selection, override flow)
"""

import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Add backend directory to path
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_stage10_colour_coded_crowd_navigation():
    print("\n========================================================")
    print("STAGE 10: Colour-Coded Crowd Navigation Tests")
    print("========================================================")

    # 1. Standard plan request
    plan_payload = {
        "user_id": "test_pilgrim_stage10",
        "message": "Coming from Dhule by car, full journey plan to Ramkund",
        "mode": "nl"
    }
    res = client.post("/plan", json=plan_payload)
    assert res.status_code == 200, f"/plan failed: {res.text}"
    plan_data = res.json()
    stops = plan_data.get("stops", [])
    assert len(stops) > 0, "No stops returned in itinerary"

    # Verify every walk_segment carries crowd_color (green, yellow, red)
    walk_segments = [s for s in stops if s.get("type") == "walk_segment"]
    assert len(walk_segments) >= 1, "Expected at least one walk_segment"

    for ws in walk_segments:
        c_color = ws.get("crowd_color")
        print(f"  [Walk Segment] {ws.get('from')} -> {ws.get('to')}: crowd_color={c_color}")
        assert c_color in ("green", "yellow", "red"), f"Invalid crowd_color on walk_segment: {c_color}"

        # Verify pois_along_route carry crowd_color
        pois = ws.get("pois_along_route", [])
        for p in pois:
            p_color = p.get("crowd_color")
            print(f"    [POI along route] {p.get('name')}: crowd_color={p_color}")
            assert p_color in ("green", "yellow", "red"), f"Invalid crowd_color on POI {p.get('name')}: {p_color}"

    # 2. Multi-temple sequential walks test
    multi_payload = {
        "user_id": "test_multi_stage10",
        "message": "Visit prominent temples Kalaram and Kapaleshwar in Nashik",
        "mode": "nl"
    }
    res_multi = client.post("/plan", json=multi_payload)
    assert res_multi.status_code == 200
    multi_stops = res_multi.json().get("stops", [])
    multi_walks = [s for s in multi_stops if s.get("type") == "walk_segment"]
    assert len(multi_walks) >= 2, "Expected multiple walk segments for multi-temple route"
    for mw in multi_walks:
        assert mw.get("crowd_color") in ("green", "yellow", "red"), f"Missing crowd_color: {mw}"

    # 3. Live crowd levels refresh endpoint
    res_crowd = client.get("/crowd-levels?poi_ids=ghat_0020,ghat_0014,temple_0002")
    assert res_crowd.status_code == 200
    crowd_res = res_crowd.json()
    assert crowd_res["status"] == "success"
    levels = crowd_res["crowd_levels"]
    assert len(levels) == 3
    for cl in levels:
        print(f"  [Live Crowd Refresh] {cl['name']} ({cl['poi_id']}): level={cl['level']}, color={cl['crowd_color']}, wait={cl['wait_minutes']}m")
        assert cl["level"] in ("low", "medium", "high")
        assert cl["crowd_color"] in ("green", "yellow", "red")

    print("[SUCCESS] STAGE 10 TESTS PASSED!")

def test_stage11_one_tap_utility_search():
    print("\n========================================================")
    print("STAGE 11: One-Tap Utility Search Tests")
    print("========================================================")

    # Categories: Toilet, Medical, Food, Water
    categories = ["toilet", "medical", "food", "water"]

    for cat in categories:
        res = client.get(f"/nearby?category={cat}&lat=20.0077&lng=73.7926&radius_m=1500")
        assert res.status_code == 200, f"/nearby GET failed for {cat}: {res.text}"
        data = res.json()
        results = data.get("results", [])
        assert len(results) > 0, f"No nearby results returned for category: {cat}"

        top_pick = results[0]
        print(f"  [{cat.upper()} TOP PICK]: {top_pick.get('name')}")
        print(f"    Distance: {top_pick.get('distance_m')}m | Wait: {top_pick.get('queue_wait_minutes')} min | Crowd: {top_pick.get('current_crowd_level')} ({top_pick.get('crowd_color')})")
        print(f"    Rank Score: {top_pick.get('score')} | Reason: {top_pick.get('reason')}")

        assert "distance_m" in top_pick
        assert "queue_wait_minutes" in top_pick
        assert top_pick.get("crowd_color") in ("green", "yellow", "red")
        assert "reason" in top_pick

    # Test POST variant
    post_payload = {"category": "toilet", "lat": 20.0077, "lng": 73.7926, "radius_m": 1200}
    post_res = client.post("/nearby", json=post_payload)
    assert post_res.status_code == 200
    assert len(post_res.json().get("results", [])) > 0

    print("[SUCCESS] STAGE 11 TESTS PASSED!")

def test_stage12_travel_planner_and_group_planning():
    print("\n========================================================")
    print("STAGE 12: Travel Planner & Group-Aware Planning Tests")
    print("========================================================")

    # 1. Test Ghat Congestion Forecast for Ramkund
    res_fc = client.get("/ghat-forecast?ghat_id=ghat_0020")
    assert res_fc.status_code == 200, f"/ghat-forecast failed: {res_fc.text}"
    fc_data = res_fc.json()
    assert "hourly_forecast" in fc_data
    assert len(fc_data["hourly_forecast"]) >= 6
    assert "optimal_window" in fc_data
    print(f"  [Ramkund Forecast] Optimal Window: {fc_data['optimal_window']}")
    print(f"  [Hourly Bars Count]: {len(fc_data['hourly_forecast'])}")
    for bar in fc_data["hourly_forecast"][:3]:
        print(f"    {bar['hour']}: {bar['level'].upper()} ({bar['crowd_color']}), ~{bar['wait_min']} min wait")
        assert bar["crowd_color"] in ("green", "yellow", "red")

    # 2. Test Ghat Congestion Forecast for Alternative (Talkuteshwar)
    res_fc2 = client.get("/ghat-forecast?ghat_id=ghat_0014")
    assert res_fc2.status_code == 200
    fc_data2 = res_fc2.json()
    assert "Talkuteshwar" in fc_data2["ghat_name"]
    print(f"  [Talkuteshwar Forecast] Optimal Window: {fc_data2['optimal_window']}")

    # 3. Test Vulnerable Group Intake: elderly_count=2, children_count=1 (Rule 1a Substitution)
    group_payload = {
        "user_id": "test_group_vulnerable",
        "message": "Travelling with family, holy snan plan please",
        "mode": "structured",
        "form_data": {
            "origin": "Dhule",
            "mode_of_transport": "car",
            "party_size": 5,
            "elderly_count": 2,
            "children_count": 1
        }
    }
    res_grp = client.post("/plan", json=group_payload)
    assert res_grp.status_code == 200, f"Group /plan failed: {res_grp.text}"
    grp_data = res_grp.json()

    # Verify group_planning structure
    gp = grp_data.get("group_planning")
    assert gp is not None, "Missing group_planning in itinerary"
    assert gp.get("is_substituted") is True, f"Expected is_substituted=True, got {gp}"
    assert "Talkuteshwar" in gp.get("suggested_ghat", ""), f"Expected Talkuteshwar Ghat, got {gp.get('suggested_ghat')}"
    assert gp.get("elderly_count") == 2
    assert gp.get("children_count") == 1
    assert "elderly" in gp.get("reasoning", "").lower() or "senior" in gp.get("reasoning", "").lower()
    print(f"  [Vulnerable Substitution Triggered]:")
    print(f"    Suggested: {gp.get('suggested_ghat')} (Original: {gp.get('original_ghat')})")
    print(f"    Reasoning Line: {gp.get('reasoning')}")

    # Verify destination stop is indeed the alternative ghat
    stops = grp_data.get("stops", [])
    visit_stop = next(s for s in reversed(stops) if s.get("type") == "visit")
    assert "Talkuteshwar" in visit_stop.get("name", ""), f"Expected destination to be Talkuteshwar, got {visit_stop.get('name')}"

    # 4. Test Vulnerable Group Explicit Override ("Plan for Ramkund instead")
    override_payload = {
        "user_id": "test_group_override",
        "message": "Plan for Ramkund instead, mujhe Ramkund hi jaana hai",
        "mode": "structured",
        "form_data": {
            "origin": "Dhule",
            "mode_of_transport": "car",
            "party_size": 5,
            "elderly_count": 2,
            "children_count": 1,
            "override": True,
            "pinned_ghat": "Ramkund Ghat"
        }
    }
    res_ovr = client.post("/plan", json=override_payload)
    assert res_ovr.status_code == 200
    ovr_data = res_ovr.json()
    gp_ovr = ovr_data.get("group_planning")
    assert gp_ovr is not None
    assert gp_ovr.get("override_active") is True, f"Expected override_active=True, got {gp_ovr}"
    assert "Ramkund" in gp_ovr.get("suggested_ghat", "")
    assert "safety_note" in gp_ovr
    print(f"  [Override Flow Honored]:")
    print(f"    Destination: {gp_ovr.get('suggested_ghat')}")
    print(f"    Safety Alert: {gp_ovr.get('safety_note')}")

    # Verify visit stop is Ramkund
    ovr_stops = ovr_data.get("stops", [])
    ovr_visit = next(s for s in reversed(ovr_stops) if s.get("type") == "visit")
    assert "Ramkund" in ovr_visit.get("name", "")

    print("[SUCCESS] STAGE 12 TESTS PASSED!")

if __name__ == "__main__":
    test_stage10_colour_coded_crowd_navigation()
    test_stage11_one_tap_utility_search()
    test_stage12_travel_planner_and_group_planning()
    print("SUCCESS: ALL STAGE 10, 11 & 12 TESTS PASSED SUCCESSFULLY!")
    print("========================================================")
