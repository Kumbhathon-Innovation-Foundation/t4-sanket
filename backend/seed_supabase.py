"""
ANUBHAV Stage 0: Supabase Bulk Seeder
Reads all data/*.json files and bulk-inserts them into Supabase tables using the service_role key.
"""

import json
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(Path(__file__).parent))

from supabase_client import get_supabase_admin

DATA_DIR = BASE_DIR / "data"

def chunk_list(lst, chunk_size=100):
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i + chunk_size]

def seed_table(client, table_name, file_name, transform_fn=None):
    file_path = DATA_DIR / file_name
    if not file_path.exists():
        print(f"[-] File not found: {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    if transform_fn:
        records = [transform_fn(r) for r in records]

    total = len(records)
    print(f"[+] Seeding '{table_name}' with {total} records from {file_name}...")

    inserted = 0
    for chunk in chunk_list(records, chunk_size=100):
        try:
            client.table(table_name).upsert(chunk).execute()
            inserted += len(chunk)
            print(f"    Inserted {inserted}/{total} rows...", end="\r")
        except Exception as e:
            print(f"\n[-] Error seeding chunk into {table_name}: {e}")
            raise e

    print(f"\n[✓] Successfully seeded {inserted}/{total} rows into '{table_name}'.")

def transform_temple(r):
    return {
        "id": str(r.get("id")),
        "category": r.get("category"),
        "name": r.get("name"),
        "type": r.get("type"),
        "zone": r.get("zone"),
        "lng": float(r["lng"]) if r.get("lng") is not None else None,
        "lat": float(r["lat"]) if r.get("lat") is not None else None,
        "address": r.get("address"),
        "rating": str(r.get("rating")) if r.get("rating") is not None else None,
        "review_count": str(r.get("review_count")) if r.get("review_count") is not None else None,
        "opening_hours": r.get("opening_hours"),
        "phone": str(r.get("phone")) if r.get("phone") is not None else None,
        "avg_visit_minutes": int(r["avg_visit_minutes"]) if r.get("avg_visit_minutes") is not None else None,
        "maps_link": r.get("maps_link")
    }

def transform_ghat(r):
    return {
        "id": str(r.get("id")),
        "category": r.get("category"),
        "name": r.get("name"),
        "lng": float(r["lng"]) if r.get("lng") is not None else None,
        "lat": float(r["lat"]) if r.get("lat") is not None else None,
        "source": r.get("source"),
        "avg_visit_minutes": int(r["avg_visit_minutes"]) if r.get("avg_visit_minutes") is not None else None
    }

def transform_parking(r):
    return {
        "id": str(r.get("id")),
        "name": r.get("name"),
        "zone_type": r.get("zone_type"),
        "lng": float(r["lng"]) if r.get("lng") is not None else None,
        "lat": float(r["lat"]) if r.get("lat") is not None else None,
        "capacity_total_SYNTH": int(r["capacity_total_SYNTH"]) if r.get("capacity_total_SYNTH") is not None else None,
        "capacity_occupied_SYNTH": int(r["capacity_occupied_SYNTH"]) if r.get("capacity_occupied_SYNTH") is not None else None,
        "fare_estimate_inr_SYNTH": int(r["fare_estimate_inr_SYNTH"]) if r.get("fare_estimate_inr_SYNTH") is not None else None
    }

def transform_facility(r):
    return {
        "id": str(r.get("id")),
        "category": r.get("category"),
        "name": r.get("name"),
        "lng": float(r["lng"]) if r.get("lng") is not None else None,
        "lat": float(r["lat"]) if r.get("lat") is not None else None,
        "facility_type": r.get("facility_type"),
        "address": r.get("address"),
        "phone": str(r.get("phone")) if r.get("phone") is not None else None,
        "registered_beds": str(r.get("registered_beds")) if r.get("registered_beds") is not None else None
    }

def transform_food(r):
    return {
        "id": str(r.get("id")),
        "category": r.get("category"),
        "name": r.get("name"),
        "lng": float(r["lng"]) if r.get("lng") is not None else None,
        "lat": float(r["lat"]) if r.get("lat") is not None else None,
        "rating": str(r.get("rating")) if r.get("rating") is not None else None,
        "address": r.get("address"),
        "current_crowd_level_SYNTH": r.get("current_crowd_level_SYNTH"),
        "queue_wait_minutes_SYNTH": int(r["queue_wait_minutes_SYNTH"]) if r.get("queue_wait_minutes_SYNTH") is not None else None
    }

def transform_corridor(r):
    status_synth = r.get("status_SYNTH", "inactive")
    return {
        "id": str(r.get("id")),
        "type": r.get("type"),
        "name": r.get("name"),
        "geometry_type": r.get("geometry_type"),
        "lat": float(r["lat"]) if r.get("lat") is not None else None,
        "lng": float(r["lng"]) if r.get("lng") is not None else None,
        "path": r.get("path"),
        "polygon": r.get("polygon"),
        "status_SYNTH": status_synth,
        "status": status_synth if status_synth in ("active", "inactive") else "inactive",
        "severity": r.get("severity", None)
    }

def main():
    client = get_supabase_admin()
    print("Starting ANUBHAV Stage 0 Data Seeding...")

    seed_table(client, "pois_ghats", "pois_ghats.json", transform_ghat)
    seed_table(client, "parking_zones", "parking_zones.json", transform_parking)
    seed_table(client, "advisory_corridors", "advisory_corridors.json", transform_corridor)
    seed_table(client, "food_utility", "food_utility.json", transform_food)
    seed_table(client, "facilities", "facilities.json", transform_facility)
    seed_table(client, "pois_temples", "pois_temples.json", transform_temple)

    print("\n[✓] All tables seeded successfully!")

if __name__ == "__main__":
    main()
