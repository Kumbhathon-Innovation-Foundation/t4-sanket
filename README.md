# ANUBHAV — Intelligent Pilgrim Mobility & Planning Platform

**Team:** Sanket  
**Tower:** 4 - Pilgrim Experience  
**Event:** Kumbhathon SPRINT 2026  
**System:** AI-Agent Pilgrimage Planning & Execution System grounded in Real Nashik Kumbh Mobility Network

---

## 👥 Team Members
- [@Gursevaksingh84](https://github.com/Gursevaksingh84)
- [@SakshiZurale](https://github.com/SakshiZurale)
- [@kalpesh-28](https://github.com/kalpesh-28)
- [@warungasenikhil49-byte](https://github.com/warungasenikhil49-byte)
- [@Jaware-Shruti-15](https://github.com/Jaware-Shruti-15)

---

## 🎥 2-3 Minute AI Pitch Video & Live Showcase
🎬 **Watch the Official ANUBHAV AI Pitch Video:** [**Watch `pitch_video.mp4`**](./pitch_video.mp4) | [**Open Walkthrough Guide in DEMO.md**](DEMO.md)

---

## 📌 Executive Summary

During the **Nashik Trimbakeshwar Kumbh Mela 2026**, over 10 million pilgrims arrive daily facing heavy congestion, complex parking regulations, walking restrictions, and shifting crowd densities. 

**ANUBHAV** (*अनुभव*) is a production-grade, multimodal AI mobility assistant that transforms free-form voice and text requests in **Hindi, Marathi, and English** into executable, turn-by-turn pilgrimage itineraries. Grounded in **3,266 real geo-located Kumbh data points** across Nashik and Panchavati, ANUBHAV combines:
1. **Dual-Provider Agent Intelligence** (Google Gemini 3.6 Flash with automated Groq / xAI fallback)
2. **Real-World Pedestrian & Highway Routing** via OSRM (real footpath polylines, not straight-line stubs)
3. **Official Kumbh Traffic Zoning Rules** (routing highway private cars to outer staging lots + government electric feeder shuttles)
4. **Native Cross-Platform Mobile & Web Client** built with Flutter, featuring live GPS tracking, step simulation, proactive proximity heritage alerts, in-journey detours, and return-to-parking routing.

---

## 🚀 Key Innovations & Capabilities

### 1. Multilingual Voice-First Planning (Hindi, Marathi, English)
- Pilgrims can speak naturally:
  - *Hindi*: "धुले से कार से आ रहे हैं, रामकुंड में पवित्र स्नान करना है, पूरी यात्रा की योजना बनाएं।"
  - *Marathi*: "आई-वडिलांसोबत नाशिकमधील प्रमुख मंदिरांचे दर्शन घ्यायचे आहे, एक नियोजन तयार करा."
  - *English*: "Coming from Mumbai by car, want to perform holy snan at Ramkund with my elderly parents."
- The agent accurately speaks back in the user's native language with synchronized visual chat bubbles.

### 2. Outer-Zone Parking & Feeder Shuttle Transit Integration
- Per Kumbh Mela traffic guidelines, private vehicles arriving from highways (Dhule, Mumbai, Pune) are directed to **outer parking staging zones** (e.g. Panjarpol Outer Lot, Valdevi Staging).
- Generates a 4-leg tactical sequence:
  1. `parking`: Park private vehicle at designated outer lot (₹20).
  2. `transit_segment`: Government electric feeder shuttle to inner Panchavati Drop Point (₹15, departs every 5 mins).
  3. `walk_segment`: Real footpath routing from drop point to sacred destination.
  4. `visit`: Sacred darshan/snan queue with live wait telemetry.

### 3. Crowd-Aware Sequencing for Families & Elders
- If Ramkund ghat congestion is high, ANUBHAV automatically prioritizes less-crowded, step-free prominent temples first (**Kalaram Sansthan Temple** with wheelchair ramp $\rightarrow$ **Kapaleshwar Temple** $\rightarrow$ **Ramkund Ghat**), explaining the reasoning aloud.

### 4. Interactive Live Map with Real Walk Simulation & Proximity Audio
- Native Flutter map overlay with turn-by-turn route polylines.
- Built-in **Walk Simulator (1x, 5x, 20x)** allowing pilgrims and judges to experience walking through the sacred corridor.
- **Proximity Audio Alerts**: As pilgrims walk past prominent heritage shrines, ANUBHAV proactively speaks alerts aloud (*"Kalaram Temple is on your left, 60 meters away. Tap to visit."*).

### 5. In-Journey Detours & Quick Facility Search
- Pilgrims can search for **Toilets, Annakshetra Food, Medical, or Temples** mid-journey.
- Tapping **"Detour Here"** triggers surgical, sub-second OSRM rerouting through the amenity and onward to the final destination without LLM latency.
- Home page includes one-tap **"Go" Direct Navigation** to immediate facilities.

### 6. "Way Back to Your Parking" Return Navigation
- Upon reaching the sacred dip at Ramkund, ANUBHAV announces darshan completion and activates a prominent **"Way Back to Parking"** flow.
- Generates the return journey (Ramkund $\rightarrow$ Panchavati Drop Point $\rightarrow$ return feeder shuttle to outer parking $\rightarrow$ parked vehicle).

### 7. STAGE 10 — Colour-Coded Crowd Navigation
- Every `walk_segment` and POI marker carries a dynamic `crowd_color` (`green` = low, `yellow` = medium, `red` = high) computed in real-time from `get_crowd_levels`.
- The Live Map renders each walking stretch as an independent, segmented polyline in its specific crowd color rather than a single uniform route color.
- Ghat and POI pins are tinted with matching crowd halo borders and glowing indicator dots.
- Background polling refreshes segment and marker crowd colors every 30 seconds as crowd density changes.

### 8. STAGE 11 — One-Tap Utility Search (Zero Typing)
- 4 prominent one-tap utility buttons on the Home screen for urgent pilgrim needs:
  - 🚻 **Toilet** (Sanitized municipal facilities)
  - 🏥 **Medical** (Emergency first aid & triage)
  - 🍲 **Food** (Satvik Annakshetra meals)
  - 💧 **Water** (Continuous 4-stage RO chilled Jal Seva)
- Tapping any button immediately pipes `get_nearby` through `rank_by_experience` without typing a single word into the search box.
- Opens the Stage 8 structured detail sheet for the **#1 Top Pick** (with live sensor status, wait time, crowd trend, why recommended, and amenities), while displaying other ranked candidates (#2, #3, etc.) below with rank badges and one-tap "Select" / "Add to my route".

### 9. STAGE 12 — Dedicated Travel Planner with Group-Aware Planning
- Dedicated **"Plan"** tab in the app navigation shell (`Ask ANUBHAV`, `Plan`, `Live Map`, `Explore`).
- **Today's Overview**: Real-time Ghat Congestion Forecast with color-coded hourly bar chart across the day (green/orange/red) for Ramkund vs Talkuteshwar Ghat, plus an **Optimal Darshan Window** callout (*"07:15–08:30 AM, target wait <15 min"*).
- **"Plan for Today" Intake Form**: Captures party size, elderly members count (60+), children count (under 12), arrival time, and transport mode.
- **Rule 1a Vulnerable Group Substitution**: If elderly or children are present, the agent automatically recommends **Talkuteshwar Ghat** over Ramkund, displaying visible reasoning:
  > *"Ramkund currently experiencing heavy congestion (45+ min queue, high density). Recommended Talkuteshwar Ghat — 12 min away, lower crowd, dedicated senior assistance, safe for families."*
- **Two Clear Action Paths**:
  - **"Start Journey"**: Accepts the recommendation, generates the route to Talkuteshwar, and switches directly to Live Map.
  - **"Plan for Ramkund instead"**: Honors explicit user override, generates a route to Ramkund with an active crowd safety advisory, and flags the nearest medical post.

---

## 🏛️ System Architecture

```
                          ┌────────────────────────────────────────┐
                          │     Flutter App (Android / Web / Win)  │
                          │   Home / Live Map / Explore / Audio    │
                          └───────┬────────────────────────┬───────┘
                                  │                        │
                         HTTP     │                        │ Supabase Realtime
               (/plan, /patch)    │                        │ (Live Corridor Alerts
                                  │                        │  & Trip Patches)
                                  ▼                        ▼
                      ┌──────────────────────┐     ┌──────────────────────┐
                      │   FastAPI Backend    │     │   Supabase Postgres  │
                      │  (tool_executor.py,  │────▶│ (3,266 Kumbh POIs,   │
                      │   agent.py, OSRM)    │◀────│  Trips, Trip Patches)│
                      └──────────┬───────────┘     └──────────────────────┘
                                 │
                        Dual LLM Provider
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
       Google Gemini 3.6 Flash               Groq / xAI Fallback
       (Native Tool-Use Loop)                (On 429 / Quota Limits)
```

### 8 Canonical Domain Tools Grounded in Real Kumbh Data:
1. `get_parking_options(vehicle_type, dest_lat, dest_lng)` — Filters outer vs. inner lots by origin and highway corridor.
2. `get_transit_options(parking_id, target_ghat_id)` — Connects outer parking to inner pedestrian zones via feeder shuttles.
3. `get_route(from_lat, from_lng, to_lat, to_lng, mode)` — Real road/footpath routing via OSRM.
4. `get_snan_window(ghat_id, target_time)` — Live ghat queue times and crowd telemetry.
5. `get_restrictions_and_advisories(corridor_ids)` — Police crowd controls and corridor diversions.
6. `find_nearby(lat, lng, category, max_dist_m)` — Nearest toilets, water, medical, food.
7. `rank_by_experience(candidates, target_type)` — Ranks options by queue time, wait, and accessibility.
8. `get_poi_details(poi_id)` — Rich historical and cultural heritage context.

---

## 📦 Repository Structure

```
.
├── backend/
│   ├── agent.py                 # Core AI Pilgrim Agent with Gemini & Groq fallback
│   ├── llm_client.py            # Dual-provider LLM client (Gemini 3.6 + Groq)
│   ├── main.py                  # FastAPI server (/plan, /patch, /admin)
│   ├── realtime_watcher.py      # Background daemon monitoring police advisories
│   ├── requirements.txt         # Python dependencies
│   ├── schema.sql               # Supabase database schema & RLS policies
│   ├── schemas.py               # ITINERARY_SCHEMA and Pydantic models
│   ├── seed_supabase.py         # Automated loader for 3,266 records
│   ├── supabase_client.py       # Supabase service-role client
│   ├── test_return_and_multi.py # Verification for multi-temple & return-to-parking
│   ├── test_stage9.py           # Verification for outer transit & start journey
│   ├── test_stage10_11_12.py    # Verification for Stages 10, 11 & 12
│   └── tool_executor.py         # Real OSRM routing and Supabase tool execution
├── data/                        # 3,266 Master Kumbh Geo-Datasets
│   ├── advisory_corridors.json  # 215 corridor segments
│   ├── facilities.json          # 1,045 sanitation & health posts
│   ├── food_utility.json        # 860 Annakshetra kitchens & drinking water
│   ├── parking_zones.json       # 52 outer and inner parking bays
│   ├── pois_ghats.json          # 20 sacred ghats
│   └── pois_temples.json        # 1,074 heritage temples & shrines
├── docs/
│   └── anubhav-ai-agent-architecture.md  # Comprehensive system design specification
├── flutter_app/                 # Flutter Cross-Platform Client
│   ├── lib/
│   │   ├── config.dart          # Supabase & backend configuration constants
│   │   ├── main.dart            # Navigation shell (Ask ANUBHAV, Plan, Live Map, Explore)
│   │   ├── models/              # Itinerary, POI, Place, and GroupPlanning models
│   │   ├── screens/
│   │   │   ├── home_screen.dart        # Voice/Text input & One-Tap Utility Grid
│   │   │   ├── daily_plan_screen.dart  # Dedicated Plan screen with Ghat Forecast & Group Intake
│   │   │   ├── map_screen.dart         # Colour-coded segmented polylines & 30s live crowd polling
│   │   │   ├── explore_screen.dart     # Directory of 3,266 sites
│   │   │   └── place_detail_screen.dart# Structured telemetry cards & ranked alternatives
│   │   ├── services/
│   │   │   ├── api_service.dart        # FastAPI HTTP client
│   │   │   ├── location_service.dart   # GPS & bearing calculation
│   │   │   ├── supabase_service.dart   # Live Supabase client
│   │   │   └── voice_service.dart      # Web/Mobile TTS & STT engine
│   │   └── widgets/             # Markers, timeline, simulation toolbar, voice sheet
│   ├── test/                    # 11 unit & widget test suites
│   └── pubspec.yaml             # Flutter dependencies
├── .env.example                 # Sanitized environment template
├── .gitignore                   # Comprehensive root gitignore
├── DEMO.md                      # Live demonstration guide, steps & testing scenarios
├── README.md                    # This documentation file
└── SUBMISSION.md                # SPRINT judging checklist
```

---

## ⚡ Quick Start: How to Run

### Prerequisites
- **Python 3.10+**
- **Flutter SDK 3.22+** (with Chrome or Android device)
- Git

---

### Step 1: Clone Repository & Setup Environment

```bash
git clone https://github.com/Kumbhathon-Innovation-Foundation/t4-sanket.git
cd t4-sanket
```

Copy the environment template:
```bash
cp .env.example .env
cp .env.example backend/.env
```
*(Pre-configured with active Supabase test keys for immediate judging).*

---

### Step 2: Launch the FastAPI Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

- API Server runs at: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

---

### Step 3: Launch the Flutter Application

In a separate terminal:
```bash
cd flutter_app
flutter pub get
flutter run -d chrome
```
*(Or run on Android: `flutter run -d <android-device-id>` or Windows Desktop: `flutter run -d windows`)*.

---

## 🧪 Deterministic Test Commands for Judges

Run these automated verification suites anytime to validate system correctness:

### 1. Backend Stage 10, 11 & 12 Test Suite (Crowd Color, One-Tap, Group Plan)
```bash
python backend/test_stage10_11_12.py
```
*Validates:*
- **Stage 10**: Dynamic `crowd_color` on walk segments and POIs (`green`, `yellow`, `red`) and `/crowd-levels` periodic polling.
- **Stage 11**: One-tap utility search for Toilet, Medical, Food, and Water piped through `rank_by_experience`.
- **Stage 12**: Ghat congestion hourly forecast bar chart, optimal window callout, Rule 1a vulnerable group substitution to Talkuteshwar, and override handling.

### 2. Backend Multi-Temple & Return-to-Parking Test
```bash
python backend/test_return_and_multi.py
```
*Validates 7-stop family itinerary, outer shuttle transit, and sub-second return journey patching.*

### 3. Backend Outer-Zone Transit & Multilingual Schema Test
```bash
python backend/test_stage9.py
```
*Validates highway vehicle detection, Panjarpol outer staging lot, electric feeder shuttle, and Hindi summary synthesis.*

### 4. Flutter Static Analysis
```bash
cd flutter_app
flutter analyze
```
*Expected: 0 issues found (No issues found!).*

### 5. Flutter Unit & Widget Test Suite
```bash
cd flutter_app
flutter test
```
*Executes unit and widget tests covering detours, timeline, detail sheets, and navigation.*

---

## 📋 Sample Test Queries for Judges

| Mode | Language | Query Input | What ANUBHAV Does |
|---|---|---|---|
| **Voice / Text** | **Hindi** | *"धुले से कार से आ रहे हैं, रामकुंड में पवित्र स्नान करना है, पूरी यात्रा योजना दीजिए।"* | Identifies Dhule highway arrival $\rightarrow$ assigns **Panjarpol Outer Parking** $\rightarrow$ connects **Govt Feeder Shuttle** to Panchavati $\rightarrow$ walks to Ramkund. Spoken in Hindi. |
| **Voice / Text** | **Marathi** | *"आई-वडिलांसोबत नाशिकमधील प्रमुख मंदिरांचे दर्शन घ्यायचे आहे, नियोजन करा."* | Crowd-aware check: avoids high-crowd ghat first $\rightarrow$ sequences **Kalaram Temple (wheelchair ramp)** $\rightarrow$ **Kapaleshwar Temple** $\rightarrow$ **Ramkund Ghat**. Spoken in Marathi. |
| **One-Tap Utility** | **Any** | Tap **"Toilet"**, **"Medical"**, **"Food"**, or **"Water"** on Home | Instant ranked retrieval without typing $\rightarrow$ opens Stage 8 structured detail sheet for #1 pick $\rightarrow$ lists alternatives (#2, #3...) below $\rightarrow$ 1-tap "Add to my route". |
| **Travel Planner** | **Any** | Open **"Plan"** tab $\rightarrow$ Set Party Size: 4, Elderly: 2 | Rule 1a substitution triggered: recommends **Talkuteshwar Ghat** with visible safety reasoning $\rightarrow$ provides **"Start Journey"** or **"Plan for Ramkund instead"** override. |
| **In-Journey Detour** | **Any** | Tap **"🚻 Toilets Near Me"** or **"🍜 Food Near Me"** $\rightarrow$ Tap **"Detour Here"** | Reroutes current route through the selected amenity in <0.5s and continues to Ramkund with voice announcement. |
| **Return Flow** | **Any** | Reach Ramkund in Simulation $\rightarrow$ Tap **"Way Back"** | Automatically generates the return leg back to the parked vehicle via Panchavati feeder shuttle. |

---

## 🛡️ Judging & Evaluation Notes

1. **Active Online Supabase Instance Preloaded**: All 3,266 Kumbh records are hosted and immediately queried.
2. **Dual-LLM High Availability**: If Google Gemini encounters rate limits (HTTP 429), ANUBHAV automatically fails over to Groq without crashing or stalling.
3. **True OSRM Geometries & Colour-Coded Navigation**: All polyline coordinates trace real walkable roads and pedestrian corridors in Nashik, dynamically color-coded by real-time crowd density.
4. **Hands-Free Accessibility**: Spoken audio operates out of the box with an accessible mute toggle for crowds.
5. **Group-Aware Safety**: Explicit Rule 1a protects seniors and young children by substituting congested ghats with calmer alternatives while honoring user overrides.
