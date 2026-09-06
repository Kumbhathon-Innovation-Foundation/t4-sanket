# ANUBHAV — AI Agent Architecture & Build Plan

This doc covers: (1) the system prompt to actually build the agent, (2) what the agent must functionally do, (3) the data contract between PRAVAH (admin/dashboard) and ANUBHAV, (4) the components you need, and (5) how to wire it into Flutter — all assuming **no real backend/DB yet**, just mocked data shaped like the real thing will be.

---

## 1. The core idea: ANUBHAV is not a chatbot, it's a planning agent with tools

A chatbot answers questions. ANUBHAV needs to:
- Parse intent + entities from free text (Hinglish, Hindi, English)
- Call "tools" (functions) to fetch live data (crowd, parking, routes, restrictions, POIs, food/utility spots)
- Run a planning/optimization step over that data
- Emit a structured itinerary (JSON) that the Flutter app renders as map + timeline
- Keep a "trip state" alive so it can react to new events (VIP movement, crowd spike) and re-plan
- Support incremental edits ("remove Kalaram", "I want food now") without regenerating from scratch

This is the standard **agentic tool-use loop**: LLM ↔ Tool calls ↔ Your backend data ↔ LLM ↔ Structured output. You are not asking the LLM to "know" Nashik — you're asking it to reason over data your backend hands it.

---

## 2. System Prompt (for the LLM powering ANUBHAV)

Use this as the system prompt for whichever model you call (Claude/GPT via API) inside your agent orchestration layer — not shown to the user.

```
You are ANUBHAV, the AI trip-planning agent inside a Kumbh Mela pilgrim assistance app.
Your job is to convert a pilgrim's natural-language request (Hindi/Hinglish/English) into
a structured, executable pilgrimage itinerary, using ONLY the live data provided to you
via tool calls. You never invent locations, distances, crowd levels, or restrictions —
you only use what tools return.

RESPONSIBILITIES:
1. Extract structured intent from the user's message:
   - origin, arrival_time, mode_of_transport, purposes (snan/heritage/food/shopping),
     preferences (avoid_crowd, prefer_safety, minimize_walking), duration, party_size.
   Ask a clarifying question ONLY if a required field is missing AND cannot be defaulted
   sensibly (e.g. missing arrival time can default to "now").

2. Call tools in this order when building a fresh plan:
   get_parking_options -> get_route(mode=walking/driving) -> get_crowd_levels(nearby POIs)
   -> get_restrictions_and_advisories -> get_pois(category=heritage/food/utility)
   -> optimize_plan(all of the above + user intent)

   If the chosen parking lot's zone_type is "outer", you MUST call
   get_transit_options for that lot and insert a transit_segment stop between
   the parking stop and the first walk_segment — outer-zone lots are far
   enough from the ghats that pilgrims take a government shuttle/vehicle to an
   inner drop point first, and only walk from there. Never route a pilgrim on
   foot directly from an outer-zone lot to the ghat. If the lot's zone_type is
   "inner", skip the transit_segment entirely and walk directly.

3. Never produce a plan without checking live restrictions/advisories first. If an active
   restriction affects a candidate route, choose an alternative and say so explicitly.

4. Output a plan as a strict JSON object matching the ITINERARY_SCHEMA (given to you in
   the tool definitions), plus a short natural-language summary in the user's language/style
   (match Hinglish if user wrote Hinglish).

5. For in-trip modification requests ("remove X", "I want food now", "too much walking"),
   do NOT regenerate the whole plan. Call the relevant tool(s), patch only the affected
   itinerary segment(s), and return an ITINERARY_PATCH object plus a one-line explanation.

6. For "find me food/toilet/water near me" mid-trip: call get_nearby(category, user_location),
   then call rank_by_experience(candidates, factors=[distance, current_crowd, queue_wait,
   rating]) and return the top 3, ranked, with your reasoning stated briefly (e.g. "closer
   but higher queue" vs "slightly further, no wait").

7. When a live advisory (VIP movement, road closure, crowd surge) is pushed to an ACTIVE
   trip, proactively re-run get_route + get_crowd_levels for the affected segment only,
   and emit an ITINERARY_PATCH + a short alert message. Do this without being asked.

8. Always ground timing estimates in tool data (walking speed, queue wait, distance) —
   never guess durations.

9. Be safety-first: if a route/tool result includes an active CRITICAL restriction, that
   route is disqualified, no exceptions, regardless of user preference.

10. Respond in the same language style as the user (Hindi/Hinglish/English), keep the
    conversational reply short (3-6 lines) — the detail lives in the structured itinerary,
    not in prose.

You have no knowledge of Nashik/Kumbh geography beyond what tools return in this session.
Do not hallucinate temple names, distances, or crowd numbers.
```

---

## 3. Tool definitions (what the LLM can call)

These are the functions you expose to the model (function-calling / tool-use). For the hackathon, each of these is backed by **mock JSON**, not a real DB — but define them exactly as if they hit a real service, so swapping in a real backend later is a non-event.

| Tool | Purpose | Key inputs | Key outputs |
|---|---|---|---|
| `get_parking_options` | Nearest parking to destination given vehicle type | origin, destination_zone, vehicle_type | list of {id, name, zone_type: inner/outer, distance_from_dest, capacity_left, fare_estimate, walk_time_to_ghat, transit_required} |
| `get_route` | Route between two points, driving or walking | from, to, mode | {polyline/waypoints, distance, eta, steps[]} |
| `get_crowd_levels` | Current + predicted crowd at POIs | poi_ids[] or zone | {poi_id, level: low/med/high, wait_minutes, updated_at} |
| `get_restrictions_and_advisories` | Active PRAVAH alerts affecting a zone/route | zone or route_id | list of {id, type: VIP/road_closure/crowd_surge, severity, affected_segment, active_from, active_to} |
| `get_pois` | Heritage/food/utility points along or near a route | category, route_id or zone | list of {id, name, category, lat/lng, description, avg_visit_minutes, images[]} |
| `get_nearby` | Ad-hoc "find X near me" | category, user_location, radius | list of candidate POIs with distance |
| `rank_by_experience` | Score candidates by crowd/queue/distance/rating | candidates[], factors[] | ranked list with short reason per item |
| `optimize_plan` | Sequence stops given all constraints | stops[], preferences, time_budget | ordered itinerary with timings |
| `get_transit_options` | Shuttle/govt vehicle between an outer parking lot and an inner drop point | parking_id | {vehicle_type, from, to, fare_estimate, duration_min, frequency_min} |

Each tool returns data conforming to a fixed schema — this schema **is** your mock database shape. Build the mock JSON files to exactly match these output shapes, and later you literally just point the tool implementation at a real DB/API instead of a JSON file. The agent code doesn't change.

---

## 4. The Itinerary Schema (what the agent must emit)

```json
{
  "trip_id": "trip_001",
  "status": "active",
  "summary_text": "Ram, maine aapke liye poora plan bana diya hai...",
  "stops": [
    {
      "order": 1,
      "type": "parking",
      "name": "Idgaha Maidan (outer zone)",
      "eta": "07:15",
      "duration_min": 5,
      "fare_estimate": 20,
      "capacity_status": "available",
      "zone_type": "outer",
      "transit_required": true
    },
    {
      "order": 2,
      "type": "transit_segment",
      "vehicle_type": "govt_shuttle",
      "from": "Idgaha Maidan",
      "to": "Panchavati Drop Point",
      "eta": "07:22",
      "duration_min": 12,
      "fare_estimate": 15,
      "note": "Only needed when the chosen parking is an outer-zone lot — skip this stop entirely for inner-zone parking."
    },
    {
      "order": 3,
      "type": "walk_segment",
      "from": "Panchavati Drop Point",
      "to": "Kalaram Temple",
      "eta": "07:25",
      "duration_min": 10,
      "polyline": [...],
      "pois_along_route": [
        {
          "poi_id": "kalaram_temple",
          "name": "Kalaram Temple",
          "side": "left",
          "trigger_distance_m": 50,
          "short_description": "...",
          "detail_available": true
        }
      ]
    },
    {
      "order": 4,
      "type": "visit",
      "poi_id": "kalaram_temple",
      "eta": "07:35",
      "suggested_duration_min": 15
    }
  ],
  "active_advisories": [
    {"id": "adv_12", "type": "VIP", "affected_segment": "ramkund_road", "severity": "critical"}
  ],
  "last_updated": "2026-09-06T07:10:00+05:30"
}
```

This is the object your Flutter map/timeline UI renders directly. Patches (`ITINERARY_PATCH`) are the same shape but scoped to only the changed stops, with a `patch_reason` field.

---

## 5. What data must come from the dashboard (PRAVAH / admin side)

Since PRAVAH is the admin publishing side, these are the tables/feeds it must produce (mocked as JSON for now, real DB later):

1. **Parking lots**: id, name, geo-location, total capacity, live occupied count, fare structure, walking distance to key ghats
2. **POIs (temples/heritage/food/utility)**: id, category, geo-location, name, description, images, avg visit duration, opening hours
3. **Crowd data per zone/POI**: current level, historical pattern (for prediction), queue wait time, last updated timestamp
4. **Roads/routes**: segment ids, geometry, walking vs vehicle allowed, current status (open/restricted)
5. **Advisories**: id, type (VIP movement / road closure / crowd surge / emergency), affected segment id(s), severity, active window, publish/expire timestamps
6. **Facilities**: toilets, drinking water, medical, help centers — geo-located, with a status flag (operational/down)

Design these mock JSON files now with the exact fields above — that's your "database" for the demo, and it's also your real schema draft for later.

---

## 6. Components you need to build

**Flutter app side:**
- Chat/voice input widget ("Ask ANUBHAV")
- Structured Trip Planner form (writes the same intent object the NL parser produces)
- Map view (Google Maps / Mapbox Flutter SDK) that can draw polylines + drop markers
- POI popup component (triggered by proximity along the route)
- Active Trip card (home screen) + timeline view
- Push/in-app alert component for proactive re-plan notifications
- Local trip-state store (so the UI can patch instead of re-render everything)

**Agent/orchestration layer (this is the "backend" for now, can be a simple Node/Python service or even a Flutter-callable serverless function):**
- Intent parser (LLM call #1, or combined with planning call using tool-use)
- Tool-call executor (reads your mock JSON "DB", returns tool results to the LLM)
- Plan optimizer (can literally be a rules-based scorer for the hackathon — sort by distance + crowd penalty — doesn't need to be ML)
- Trip state manager (holds active trip, applies patches, detects when new advisories affect an active trip)
- Advisory watcher (polls or subscribes to PRAVAH's "publish advisory" action, checks against active trips, triggers re-plan)

**Mock data layer:**
- JSON files per section 5, served via a tiny local API (even a static JSON server or Firebase/Supabase seeded with mock rows) so it behaves like a real DB from day one

---

## 7. Integration steps into Flutter

1. **Stand up the agent as an HTTP service** (even a single Python/Node file with one `/plan` and one `/message` endpoint is enough). Flutter should never call the LLM directly — always through this service, so tool access + mock DB stay server-side.
2. **Seed mock data** matching section 5's schema, loaded by the tool-executor.
3. **Build `/plan` endpoint**: accepts `{user_id, message, mode: "nl" | "structured", form_data?}` → runs the agent loop → returns the Itinerary Schema JSON.
4. **Build `/patch` endpoint**: accepts `{trip_id, message}` for in-trip edits → returns an ITINERARY_PATCH.
5. **Build `/advisory-check` mechanism**: PRAVAH's "publish" action calls this (or a scheduled poll) → agent checks active trips against new advisory → if affected, auto-generates a patch and pushes it (via websocket, Firebase Cloud Messaging, or simple polling from the app).
6. **Flutter: on `/plan` response**, render:
   - Draw `polyline` per walk/drive segment on the map
   - Drop markers for each `poi_along_route`; on marker tap or proximity trigger (compare live GPS or simulated position to `trigger_distance_m`), show the popup
   - Render the `stops` array as a vertical timeline below/beside the map
7. **Flutter: "Visit this temple?" button on popup** → sends a `/patch` request with the user's choice → backend re-runs `get_route` from current point to the POI and back to the original next stop → returns updated polyline + timeline, app redraws only the affected segment.
8. **Flutter: in-trip food/utility search** → send `/patch` with `{intent: "find_nearby", category: "food", location}` → backend calls `get_nearby` + `rank_by_experience` → return ranked list → show as a bottom-sheet card list (not necessarily a full replan) with a "Add to my route" button per option.
9. **Flutter: advisory push** → listen on a socket/topic per active `trip_id` → on message, show the "Your itinerary has been updated" banner + auto-refresh the map/timeline from the patch payload.

---

## 8. Handling your exact demo scenario

**Ram: "coming from Dhule, snan at Nashik, full journey plan"**

- `/plan` called with `mode: "nl"`
- Agent extracts intent → calls `get_parking_options` (returns P1, capacity, ₹20 fare) → `get_route` (drive to P1, walk P1→Ramkund) → `get_pois` along that walk (Kalaram, Kapaleshwar) → `get_crowd_levels` for Ramkund (suggests a low-crowd snan window) → `get_restrictions_and_advisories` (checks nothing blocks the route) → `optimize_plan` sequences it → returns Itinerary JSON
- Flutter renders map + timeline exactly like your mockup

**Mid-route popup + reroute:**
- App compares live/simulated GPS to each `poi_along_route.trigger_distance_m` → shows popup ("Kalaram Temple, on your left")
- Tap "Visit" → `/patch` → backend inserts a `visit` stop + recomputes the next walk segment → app updates only that part of the map/timeline

**Mid-trip food search:**
- User: "bhookh lagi hai" / taps "Find Food" → `/patch` with `intent: find_nearby, category: food` → `get_nearby` returns candidates → `rank_by_experience` scores by distance, current crowd, queue wait, rating → top 3 shown with a one-line reason each ("closest, but 15 min queue" vs "5 min further, no wait")

**Live advisory disrupts active trip:**
- PRAVAH publishes VIP movement on Ramkund Road → advisory-check sees Ram's active trip includes that segment → agent recalculates the walking route, checks Ramkund crowd/timing still works for the snan window → pushes an ITINERARY_PATCH + alert → Flutter shows the "Your itinerary has been updated" banner and redraws the route

---

## 9. Build order (practical, for a hackathon timeline)

1. Mock data JSON files (parking, POIs, crowd, advisories, facilities) — do this first, it's the foundation everything else reads from
2. Tool-executor functions that read these JSON files and return schema-correct responses
3. Agent loop wired to an LLM with tool-use (system prompt above) — test with just the `/plan` endpoint via curl/Postman before touching Flutter
4. Flutter: static map + hardcoded itinerary render (prove the UI works before it's dynamic)
5. Connect Flutter to `/plan` — replace hardcoded itinerary with live agent output
6. Add proximity popups + `/patch` for visit/reroute
7. Add food/utility ranked search
8. Add the advisory-push demo (this is your closing "wow" moment)