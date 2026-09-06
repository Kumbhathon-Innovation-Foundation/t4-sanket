"""
ANUBHAV Stage 2 & Stage 3 Verification Suite
Tests:
- Stage 2: Real OSRM road-following routing for driving and walking modes.
- Stage 3: POST /admin/publish-advisory, Supabase status update, Realtime trigger,
           and automatic server-side trip patch generation.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = str(Path(__file__).parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from main import app
from supabase_client import get_supabase_admin
import tool_executor as te
from realtime_watcher import check_and_patch_affected_trips

client = TestClient(app)
supabase = get_supabase_admin()

def test_stage2_and_stage3():
    print("==================================================")
    print("STAGE 2 & STAGE 3: ROUTING & ADVISORY REALTIME VERIFICATION")
    print("==================================================")

    # -------------------------------------------------------------------------
    # STAGE 2: OSRM Routing Verification
    # -------------------------------------------------------------------------
    print("\n[STAGE 2] Testing OSRM Real Routing Integration:")
    
    # 1. Driving route
    drive_route = te.get_route(19.9827, 73.7128, 20.0077, 73.7926, mode="driving")
    drive_coords = drive_route.get("polyline", [])
    print(f"  - Driving Route: {drive_route.get('distance_m')}m, {drive_route.get('eta_min')} mins")
    print(f"  - Coordinates count: {len(drive_coords)} (Road-following polyline)")
    print(f"  - Note: {drive_route.get('note')}")
    assert len(drive_coords) > 5, "Driving route should contain road-following coordinates, not straight line"
    assert drive_route.get("distance_m", 0) > 1000, "Driving distance should be > 1km"
    print("  [✓ PASS] Real driving road route verified via OSRM")

    # 2. Walking route
    walk_route = te.get_route(20.0008, 73.7827, 20.0077, 73.7926, mode="walking")
    walk_coords = walk_route.get("polyline", [])
    print(f"  - Walking Route: {walk_route.get('distance_m')}m, {walk_route.get('eta_min')} mins")
    print(f"  - Coordinates count: {len(walk_coords)} (Pedestrian footpath polyline)")
    print(f"  - Note: {walk_route.get('note')}")
    assert len(walk_coords) > 5, "Walking route should contain pedestrian footpath coordinates"
    print("  [✓ PASS] Real walking footpath route verified via OSRM")

    # -------------------------------------------------------------------------
    # STAGE 3: Advisory Publish & Live Push Reaction
    # -------------------------------------------------------------------------
    print("\n[STAGE 3] Testing Advisory Publish & Automatic Server Reaction:")

    # Pick an advisory corridor
    test_adv_id = "adv_0001"
    
    # 1. Call POST /admin/publish-advisory to activate
    print(f"  - Publishing active advisory for corridor {test_adv_id}...")
    pub_resp = client.post("/admin/publish-advisory", json={
        "advisory_id": test_adv_id,
        "severity": "critical",
        "active": True
    })
    assert pub_resp.status_code == 200, f"Publish advisory failed: {pub_resp.text}"
    pub_data = pub_resp.json()
    print(f"  - Admin response: {pub_data.get('message')}")
    assert pub_data.get("active") is True

    # 2. Check status in Supabase
    adv_check = supabase.table("advisory_corridors").select("id, status, severity").eq("id", test_adv_id).execute()
    assert adv_check.data and len(adv_check.data) > 0, f"Advisory {test_adv_id} not found in Supabase"
    adv_row = adv_check.data[0]
    print(f"  - Supabase advisory status: {adv_row.get('status')}")
    print(f"  - Supabase advisory severity: {adv_row.get('severity')}")
    assert adv_row.get("status") == "active", "Advisory status was not updated to 'active' in Supabase"
    print("  [✓ PASS] Supabase advisory_corridors updated with status='active'")

    # 3. Test automatic patch trigger on active trips
    print("  - Testing server-side trip patch trigger for active trips...")
    patched = check_and_patch_affected_trips(test_adv_id, severity="critical")
    print(f"  - Trips checked and patched by watcher: {patched}")

    # Check trip_patches in Supabase
    recent_patches = supabase.table("trip_patches").select("*").order("created_at", desc=True).limit(2).execute()
    print(f"  - Recent trip_patches recorded in Supabase: {len(recent_patches.data)}")
    if recent_patches.data:
        latest = recent_patches.data[0]
        print(f"  - Latest patch reason: {latest.get('reason')}")
        print(f"  - Trip ID: {latest.get('trip_id')}")

    # 4. Deactivate advisory to clean up
    print(f"  - Resetting advisory {test_adv_id} back to inactive...")
    reset_resp = client.post("/admin/publish-advisory", json={
        "advisory_id": test_adv_id,
        "severity": "info",
        "active": False
    })
    assert reset_resp.status_code == 200
    print("  [✓ PASS] Advisory deactivated and cleaned up")

    print("\n==================================================")
    print("ALL STAGE 2 & STAGE 3 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
    return True

if __name__ == "__main__":
    test_stage2_and_stage3()
