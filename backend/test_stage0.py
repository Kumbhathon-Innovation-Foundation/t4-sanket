"""
ANUBHAV Stage 0 Verification Script
Tests database tables, row counts, RLS permissions, and schema constraints.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from supabase_client import get_supabase_admin, get_supabase_anon

def test_stage0():
    admin = get_supabase_admin()
    anon = get_supabase_anon()

    print("==================================================")
    print("STAGE 0: SUPABASE VERIFICATION")
    print("==================================================")

    expected_tables = {
        "pois_ghats": 20,
        "parking_zones": 52,
        "advisory_corridors": 215,
        "food_utility": 860,
        "facilities": 1045,
        "pois_temples": 1074,
    }

    # 1. Check table existence and row counts via admin
    print("\n[1] Checking Reference Table Counts (Admin Client):")
    all_passed = True
    for table, expected_count in expected_tables.items():
        try:
            res = admin.table(table).select("id", count="exact").limit(1).execute()
            count = res.count
            status = "✓ PASS" if count == expected_count else f"⚠ COUNT MISMATCH (got {count}, expected {expected_count})"
            print(f"  - {table:<22}: {count} rows [{status}]")
            if count != expected_count:
                all_passed = False
        except Exception as e:
            print(f"  - {table:<22}: ERROR ({e})")
            all_passed = False

    # 2. Check advisory_corridors columns
    print("\n[2] Checking advisory_corridors 'status' and 'severity' columns:")
    try:
        sample = admin.table("advisory_corridors").select("id, name, status, severity").limit(1).execute()
        if sample.data:
            row = sample.data[0]
            print(f"  - status column: {row.get('status')} (Expected 'inactive' or string)")
            print(f"  - severity column: {row.get('severity')} (Nullable)")
            print("  [✓ PASS] Columns present and accessible")
        else:
            print("  [!] No rows found in advisory_corridors")
    except Exception as e:
        print(f"  [-] Failed to query advisory_corridors columns: {e}")
        all_passed = False

    # 3. Test RLS for Anon Client (Public Read on Reference Tables)
    print("\n[3] Testing Row Level Security (RLS) with Anon Client:")
    if anon:
        try:
            # Anon can read pois_temples
            anon_temples = anon.table("pois_temples").select("id, name").limit(2).execute()
            if anon_temples.data and len(anon_temples.data) > 0:
                print(f"  - Anon SELECT on pois_temples: [✓ PASS] (Retrieved {len(anon_temples.data)} items)")
            else:
                print("  - Anon SELECT on pois_temples: [!] Returned 0 rows")

            # Anon CANNOT read trips
            anon_trips = anon.table("trips").select("id").limit(1).execute()
            if len(anon_trips.data) == 0:
                print("  - Anon SELECT on trips: [✓ PASS] (Blocked by RLS, 0 rows visible)")
            else:
                print(f"  - Anon SELECT on trips: [FAIL] (Anon should not see trips: {anon_trips.data})")
                all_passed = False

            # Anon CANNOT insert into trips
            try:
                anon.table("trips").insert({"id": "anon_test", "user_id": "anon", "status": "active"}).execute()
                print("  - Anon INSERT on trips: [FAIL] (Anon insert was allowed!)")
                all_passed = False
            except Exception:
                print("  - Anon INSERT on trips: [✓ PASS] (Blocked by RLS)")

        except Exception as e:
            print(f"  [-] Error testing anon RLS: {e}")
            all_passed = False
    else:
        print("  [-] Anon client not configured.")

    # 4. Test Service Role CRUD on trips and trip_patches
    print("\n[4] Testing Service Role CRUD on trips & trip_patches:")
    test_trip_id = "test_trip_stage0_verification"
    try:
        # Clean up any leftover
        admin.table("trip_patches").delete().eq("trip_id", test_trip_id).execute()
        admin.table("trips").delete().eq("id", test_trip_id).execute()

        # Insert trip
        admin.table("trips").insert({
            "id": test_trip_id,
            "user_id": "test_user_stage0",
            "status": "active",
            "itinerary": {"stops": [], "trip_id": test_trip_id}
        }).execute()
        print("  - Service Role INSERT trips: [✓ PASS]")

        # Insert patch
        admin.table("trip_patches").insert({
            "trip_id": test_trip_id,
            "patch": {"stops": [{"type": "parking"}]},
            "reason": "Stage 0 verification test patch"
        }).execute()
        print("  - Service Role INSERT trip_patches: [✓ PASS]")

        # Clean up
        admin.table("trip_patches").delete().eq("trip_id", test_trip_id).execute()
        admin.table("trips").delete().eq("id", test_trip_id).execute()
        print("  - Service Role DELETE cleanup: [✓ PASS]")
    except Exception as e:
        print(f"  [-] Error testing operational tables: {e}")
        all_passed = False

    print("\n==================================================")
    if all_passed:
        print("ALL STAGE 0 TESTS PASSED SUCCESSFULLY! Ready for Stage 1.")
    else:
        print("SOME TESTS FAILED OR TABLES NEED INITIALIZATION.")
    print("==================================================")
    return all_passed

if __name__ == "__main__":
    test_stage0()
