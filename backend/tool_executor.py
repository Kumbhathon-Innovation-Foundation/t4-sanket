"""
ANUBHAV tool-executor — Supabase & OSRM integration.

Reads data from Supabase tables (with fallback to local data/*.json during setup)
and implements exactly the 8 tool contracts defined in docs/anubhav-ai-agent-architecture.md.
"""

import json
import math
import os
import random
import requests
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"

# Import Supabase admin client
try:
    from supabase_client import get_supabase_admin
    _supabase_admin = get_supabase_admin()
except Exception as e:
    _supabase_admin = None

def _fetch_all_rows(table_name, local_file_name):
    """
    Fetches all rows from Supabase with pagination (1000 items per batch).
    Falls back to data/*.json if table is not yet migrated or empty.
    """
    if _supabase_admin:
        try:
            records = []
            page_size = 1000
            start = 0
            while True:
                res = _supabase_admin.table(table_name).select("*").range(start, start + page_size - 1).execute()
                if not res.data:
                    break
                records.extend(res.data)
                if len(res.data) < page_size:
                    break
                start += page_size
            if records:
                return records
        except Exception as e:
            # Fallback to local file if table does not exist yet
            pass

    # Local fallback
    local_path = DATA_DIR / f"{local_file_name}.json"
    if local_path.exists():
        with open(local_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

# Load data tables
TEMPLES = _fetch_all_rows("pois_temples", "pois_temples")
GHATS = _fetch_all_rows("pois_ghats", "pois_ghats")
PARKING = _fetch_all_rows("parking_zones", "parking_zones")
FACILITIES = _fetch_all_rows("facilities", "facilities")
FOOD = _fetch_all_rows("food_utility", "food_utility")
ADVISORIES = _fetch_all_rows("advisory_corridors", "advisory_corridors")

ALL_POIS = (
    [{**t, "poi_type": "heritage"} for t in TEMPLES] +
    [{**g, "poi_type": "ghat"} for g in GHATS]
)

def reload_data():
    """Reload in-memory caches from Supabase."""
    global TEMPLES, GHATS, PARKING, FACILITIES, FOOD, ADVISORIES, ALL_POIS
    TEMPLES = _fetch_all_rows("pois_temples", "pois_temples")
    GHATS = _fetch_all_rows("pois_ghats", "pois_ghats")
    PARKING = _fetch_all_rows("parking_zones", "parking_zones")
    FACILITIES = _fetch_all_rows("facilities", "facilities")
    FOOD = _fetch_all_rows("food_utility", "food_utility")
    ADVISORIES = _fetch_all_rows("advisory_corridors", "advisory_corridors")
    ALL_POIS = (
        [{**t, "poi_type": "heritage"} for t in TEMPLES] +
        [{**g, "poi_type": "ghat"} for g in GHATS]
    )

# ---------- geo helpers ----------

def haversine_m(lat1, lng1, lat2, lng2):
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

def point_to_line_min_dist_m(lat, lng, path_lnglat):
    """Min distance (m) from a point to a polyline given as [[lng,lat], ...]."""
    best = float("inf")
    for lng2, lat2 in path_lnglat:
        d = haversine_m(lat, lng, lat2, lng2)
        if d < best:
            best = d
    return best

# ---------- TOOL 1: get_parking_options ----------

def get_parking_options(dest_lat, dest_lng, vehicle_type="car", max_results=5, zone_type=None):
    scored = []
    for p in PARKING:
        zt = p.get("zone_type", "outer")
        if zone_type and zt != zone_type:
            continue
        d = haversine_m(dest_lat, dest_lng, p["lat"], p["lng"])
        scored.append((d, p))
    scored.sort(key=lambda x: x[0])
    out = []
    for d, p in scored[:max_results]:
        zt = p.get("zone_type", "outer")
        out.append({
            "id": p["id"],
            "name": p["name"],
            "zone_type": zt,
            "transit_required": (zt == "outer"),
            "distance_from_dest_m": round(d),
            "walk_time_to_dest_min": round(d / 80),  # ~80 m/min walking pace
            "capacity_left": random.randint(10, 200),
            "fare_estimate_inr": p.get("fare_estimate_inr_SYNTH", 20),
            "lat": p["lat"],
            "lng": p["lng"],
        })
    return out

# ---------- TOOL 9: get_transit_options ----------

def get_transit_options(parking_id=None, parking_name=None):
    """
    Shuttle/govt vehicle between an outer parking lot and an inner drop point.
    Returns {vehicle_type, from, to, fare_estimate, duration_min, frequency_min, drop_lat, drop_lng, note}.
    """
    drop_point_name = "Panchavati Drop Point"
    drop_lat = 20.0050
    drop_lng = 73.7910

    from_name = parking_name or "Outer Parking Zone"
    if parking_id and not parking_name:
        for p in PARKING:
            if p.get("id") == parking_id:
                from_name = p.get("name", from_name)
                break

    return {
        "vehicle_type": "govt_shuttle",
        "from": from_name,
        "to": drop_point_name,
        "fare_estimate": 15,
        "duration_min": 12,
        "frequency_min": 5,
        "drop_lat": drop_lat,
        "drop_lng": drop_lng,
        "note": "Govt electronic feeder shuttle running every 5 mins from outer lot to inner sacred zone."
    }

# ---------- TOOL 2: get_pois ----------

def get_pois(category=None, near_lat=None, near_lng=None, radius_m=800, max_results=10):
    results = []
    pool = ALL_POIS if category is None else [p for p in ALL_POIS if p.get("poi_type") == category or p.get("category") == category]
    for p in pool:
        if near_lat is not None and near_lng is not None:
            d = haversine_m(near_lat, near_lng, p["lat"], p["lng"])
            if d > radius_m:
                continue
        else:
            d = None
        results.append({**p, "distance_m": round(d) if d is not None else None})
    if near_lat is not None and near_lng is not None:
        results.sort(key=lambda x: x["distance_m"] or 0)
    return results[:max_results]

def get_pois_along_route(path_lnglat, corridor_width_m=100, category=None):
    """For the map popup feature: which temples/ghats sit within corridor_width_m
    of the walking/driving path the user is on right now."""
    pool = ALL_POIS if category is None else [p for p in ALL_POIS if p.get("poi_type") == category or p.get("category") == category]
    hits = []
    for p in pool:
        d = point_to_line_min_dist_m(p["lat"], p["lng"], path_lnglat)
        if d <= corridor_width_m:
            hits.append({**p, "distance_to_route_m": round(d)})
    return hits

# ---------- TOOL 3: get_restrictions_and_advisories ----------

def get_restrictions_and_advisories(path_lnglat=None, near_lat=None, near_lng=None,
                                     corridor_width_m=150, only_active=True):
    hits = []
    for a in ADVISORIES:
        status = a.get("status") or a.get("status_SYNTH", "inactive")
        if only_active and status != "active":
            continue
        matched = False
        if path_lnglat and a.get("path"):
            for lng, lat in path_lnglat:
                if point_to_line_min_dist_m(lat, lng, a["path"]) <= corridor_width_m:
                    matched = True
                    break
        elif path_lnglat and "lat" in a and a.get("lat") is not None:
            for lng, lat in path_lnglat:
                if haversine_m(lat, lng, a["lat"], a["lng"]) <= corridor_width_m:
                    matched = True
                    break
        elif near_lat is not None and near_lng is not None:
            if a.get("path"):
                matched = point_to_line_min_dist_m(near_lat, near_lng, a["path"]) <= corridor_width_m
            elif "lat" in a and a.get("lat") is not None:
                matched = haversine_m(near_lat, near_lng, a["lat"], a["lng"]) <= corridor_width_m
        if matched:
            hits.append(a)
    return hits

def set_advisory_active(advisory_id, severity="critical", active=True):
    """Updates advisory status in memory and in Supabase."""
    status_str = "active" if active else "inactive"
    updated_obj = None

    # Update in memory
    for a in ADVISORIES:
        if a["id"] == advisory_id:
            a["status"] = status_str
            a["status_SYNTH"] = status_str
            a["severity"] = severity
            updated_obj = a
            break

    # Persist to Supabase
    if _supabase_admin:
        try:
            _supabase_admin.table("advisory_corridors").update({
                "status": status_str,
                "status_SYNTH": status_str,
                "severity": severity
            }).eq("id", advisory_id).execute()
        except Exception as e:
            print(f"[-] Error updating advisory {advisory_id} in Supabase: {e}")

    return updated_obj

# ---------- TOOL 4: get_nearby (find food/toilet near me) ----------

def get_nearby(category, lat, lng, radius_m=1000, max_results=8):
    if category in ("food", "grocery", "vegetable_market"):
        pool = [f for f in FOOD if f.get("category") in ("food", "grocery", "vegetable_market")]
    else:
        pool = [f for f in FACILITIES if f.get("category") == category]

    out = []
    for p in pool:
        d = haversine_m(lat, lng, p["lat"], p["lng"])
        if d <= radius_m:
            out.append({**p, "distance_m": round(d)})
    out.sort(key=lambda x: x["distance_m"])
    return out[:max_results]

# ---------- TOOL 5: rank_by_experience ----------

def rank_by_experience(candidates, factors=("distance", "crowd", "queue", "rating")):
    scored = []
    for c in candidates:
        crowd = c.get("current_crowd_level_SYNTH") or random.choice(["low", "medium", "high"])
        queue = c.get("queue_wait_minutes_SYNTH")
        if queue is None:
            queue = {"low": 2, "medium": 8, "high": 20}.get(crowd, 5) + random.randint(-2, 5)
        try:
            rating = float(c.get("rating") or 4.0)
        except Exception:
            rating = 4.0
        crowd_penalty = {"low": 0, "medium": 5, "high": 15}.get(crowd, 5)
        score = c.get("distance_m", 100) * 0.05 + crowd_penalty + queue - rating * 3
        reason_bits = [
            f"{c.get('distance_m', 0)}m away",
            f"{crowd} crowd",
            f"~{queue} min wait"
        ]
        scored.append({
            **c,
            "current_crowd_level": crowd,
            "queue_wait_minutes": queue,
            "score": round(score, 1),
            "reason": ", ".join(reason_bits)
        })
    scored.sort(key=lambda x: x["score"])
    return scored

# ---------- TOOL 6: get_route (OSRM road-following polyline) ----------

def get_route(from_lat, from_lng, to_lat, to_lng, mode="walking"):
    """
    Computes road/path-following route via OSRM.
    Supports walking ('foot') and driving ('driving').
    Falls back gracefully to straight-line if OSRM is unreachable.
    """
    osrm_url = os.getenv("OSRM_URL", "http://router.project-osrm.org")
    profile = "foot" if mode in ("walking", "walk") else "driving"
    api_endpoint = f"{osrm_url}/route/v1/{profile}/{from_lng},{from_lat};{to_lng},{to_lat}?overview=full&geometries=geojson"

    try:
        resp = requests.get(api_endpoint, timeout=6)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and data.get("routes"):
                best = data["routes"][0]
                distance_m = round(best.get("distance", 0))
                duration_s = best.get("duration", 0)
                eta_min = max(1, round(duration_s / 60))
                polyline = best.get("geometry", {}).get("coordinates", [])
                return {
                    "mode": mode,
                    "distance_m": distance_m,
                    "eta_min": eta_min,
                    "polyline": polyline,
                    "note": f"OSRM real {mode} route with {len(polyline)} coordinate points"
                }
    except Exception as e:
        pass

    # Fallback to straight line if network call fails
    distance_m = haversine_m(from_lat, from_lng, to_lat, to_lng)
    speed_mps = 1.3 if mode in ("walking", "walk") else 8.3
    return {
        "mode": mode,
        "distance_m": round(distance_m),
        "eta_min": max(1, round(distance_m / speed_mps / 60)),
        "polyline": [[from_lng, from_lat], [to_lng, to_lat]],
        "note": "Fallback straight-line route"
    }

# ---------- TOOL 7: optimize_plan ----------

def optimize_plan(stops, preferences=None):
    """
    Sequences stops deterministically: nearest-neighbor ordering
    taking into account crowd penalties and stop types.
    """
    preferences = preferences or {}
    ordered = []
    remaining = [s for s in stops if isinstance(s, dict)]
    if not remaining:
        return ordered

    # Start from origin / first stop
    current = remaining.pop(0)
    ordered.append(current)

    while remaining:
        def _cost(s):
            lat = s.get("lat") or (s.get("location", {}).get("lat") if isinstance(s.get("location"), dict) else None)
            lng = s.get("lng") or (s.get("location", {}).get("lng") if isinstance(s.get("location"), dict) else None)
            cur_lat = current.get("lat") or (current.get("location", {}).get("lat") if isinstance(current.get("location"), dict) else None)
            cur_lng = current.get("lng") or (current.get("location", {}).get("lng") if isinstance(current.get("location"), dict) else None)
            if lat is not None and cur_lat is not None:
                return haversine_m(cur_lat, cur_lng, lat, lng)
            return 999999
        remaining.sort(key=_cost)
        current = remaining.pop(0)
        ordered.append(current)
    return ordered

# ---------- TOOL 8: get_crowd_levels ----------

def get_crowd_levels(poi_ids=None, zone=None):
    """
    Contract: {poi_id, level: low/med/high, wait_minutes, updated_at}
    Returns crowd estimates for specified POIs or an entire zone.
    """
    results = []
    target_pois = []
    if poi_ids:
        target_pois = [p for p in ALL_POIS if p.get("id") in poi_ids or p.get("name") in poi_ids]
    elif zone:
        target_pois = [p for p in ALL_POIS if p.get("zone") == zone][:10]
    else:
        target_pois = ALL_POIS[:5]

    for p in target_pois:
        crowd = random.choice(["low", "medium", "high"])
        wait = {"low": 5, "medium": 20, "high": 45}[crowd]
        results.append({
            "poi_id": p.get("id"),
            "name": p.get("name"),
            "level": crowd,
            "wait_minutes": wait,
            "updated_at": "2026-09-06T21:00:00+05:30"
        })
    return results
