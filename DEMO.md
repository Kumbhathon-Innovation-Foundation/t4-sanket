# ANUBHAV — Live Demonstration Guide & Judging Walkthrough

**Tower 4:** Pilgrim Experience  
**Team:** Sanket  
**Event:** Kumbhathon SPRINT 2026  
**System:** ANUBHAV Multimodal Pilgrim Mobility Assistant  
**Live UI:** Flutter Web (`http://localhost:3000` or Chrome port) / Flutter Android Client  
**Backend API:** `http://127.0.0.1:8000` (Swagger UI at `/docs`)

---

## 🎬 3-Minute Live Demonstration Flow

This walkthrough demonstrates how ANUBHAV solves real-world pilgrimage mobility challenges during the Nashik Kumbh Mela 2026.

---

### Scene 1: Multilingual Highway Arrival with Outer-Zone Transit Leg (0:00 - 0:45)
1. **Open the App**: Launch the ANUBHAV Flutter app on Chrome or Android.
2. **Action**: Tap the **Microphone** button or paste this Hindi query:
   > *"धुले से कार से आ रहे हैं, रामकुंड में पवित्र स्नान करना है, पूरी यात्रा की योजना बनाएं।"*
   *(English equivalent: "Coming from Dhule by car, want to perform holy snan at Ramkund, full journey plan please.")*
3. **What ANUBHAV Does**:
   - The Dual LLM Agent uses `get_parking_options` to detect highway arrival from Dhule.
   - Per Kumbh mobility guidelines, it selects **Panjarpol Outer Parking** (zone_type: `outer`).
   - Uses `get_transit_options` to connect the outer lot to the inner pedestrian zone via the **Government Electric Feeder Shuttle** to **Panchavati Drop Point** (₹15, departs every 5 mins).
   - Uses `get_route` (walking mode via OSRM) from Panchavati Drop Point to **Ramkund Ghat**.
   - Spoken Hindi guidance plays aloud: *"आपकी यात्रा योजना तैयार है... पहले पंजरपोल आउटर पार्किंग में वाहन पार्क करें, फिर फीडर शटल से पंचवटी पहुंचें..."*
4. **Click "Start Journey"**: Immediately transitions to the native Map with turn-by-turn route polylines and begins navigation.

---

### Scene 2: Proactive Heritage Audio Alerts & Real Walk Simulation (0:45 - 1:30)
1. **Interactive Simulation**:
   - In the bottom right of the Map, tap the floating **Play** button to begin simulated walking.
   - Adjust speed with the **1x, 5x, 20x** speed chips in the Simulation Toolbar.
2. **Proximity Alert Trigger**:
   - As the simulated pilgrim walks along the pedestrian corridor, the agent detects **Kalaram Sansthan Temple** within 60 meters.
   - A structured **Proximity Popup Card** slides in below the search bar:
     `Nearby: Kalaram Sansthan Temple • On your left (~55m) • Tap for details`
   - Hands-Free audio announces aloud: *"Kalaram Sansthan Temple is on your left, 55 meters away."*
3. **Structured POI Detail Sheet**:
   - Tapping the card opens the structured **Place Detail Page**.
   - Displays live sensor cards: `40% LESS CROWDED`, `8 MIN WALK`, `15 MIN DARSHAN WAIT`.
   - Tapping **"Visit this place"** instantly recalculates the walking polyline to detour via Kalaram and resumes navigation.

---

### Scene 3: In-Journey Sanitation & Food Detour (1:30 - 2:15)
1. **Mid-Journey Need**: While navigating towards Ramkund, the pilgrim urgently needs a public toilet or food.
2. **Action**: Tap the search bar chip **"🚻 Toilets Near Me"** or **"🍜 Food Near Me"**.
3. **What ANUBHAV Does**:
   - Immediately queries live Supabase facilities and displays ranked nearby candidates in the horizontal carousel.
   - Each card displays distance, category, and an orange **"Detour Here"** primary button.
4. **One-Tap Detour**:
   - Tap **"Detour Here"** on *Panchavati Public Toilet Block*.
   - In <0.5 seconds (zero LLM token latency), the backend patches the route with real pedestrian footpath polylines to the toilet and onward to Ramkund.
   - Spoken audio confirms: *"Route updated to detour via Panchavati Public Toilet. Resuming navigation."*

---

### Scene 4: "Way Back to Your Parking" Return Navigation (2:15 - 3:00)
1. **Arrival at Destination**:
   - As the simulation reaches Ramkund Ghat, the app announces:
     *"You have arrived at Ramkund Ghat. Pilgrimage completed peacefully."*
2. **Return Flow**:
   - A prominent banner appears: **"Sacred Snan Completed! 🙏 Return to vehicle via feeder shuttle"**.
   - Alternatively, open the bottom Tactical Timeline and tap **"Way Back to My Parking Lot"**.
3. **Result**:
   - The backend automatically inverts the journey: Ramkund Ghat $\rightarrow$ Panchavati Drop Point $\rightarrow$ return government feeder shuttle $\rightarrow$ parked car at Panjarpol Outer Lot.
   - Reverse navigation and audio guidance immediately commence!

---

## 📸 Key UI Screen Demonstrations

### 1. Home Planning & Journey Ready Screen
- Pill-shaped search bar with voice input in Marathi, Hindi, and English.
- Quick prompt chips for family planning, highway arrival, and ghat snan.
- Quick facility cards (Toilets, Food, Medical) with one-tap **"Go" Direct Navigation**.
- "Journey Ready" card with multilingual summary bubble and prominent **"Start Journey"** CTA.

### 2. Native Live Map Stack
- Floating search bar with real-time hands-free audio mute/unmute toggle.
- Category quick chips: `🍜 Food Near Me`, `🚻 Toilets Near Me`, `🏥 Medical`, `🛕 Temples`.
- Color-coded pins for Ghats (blue), Temples (saffron), Medical (red), Toilets (brown), Parking (indigo).
- Real-world footpath polylines following official Kumbh corridors.

### 3. Tactical Timeline & Telemetry Sheet
- **Optimal Dip Telemetry Card**: Optimal window (e.g. `07:15 AM - 08:30 AM`), queue wait estimates, and corridor status.
- **Segmented Legs**: Outer parking bay, feeder shuttle leg (`SHUTTLE • ₹15`), pedestrian walk legs, and holy visit stops.
- **Hands-Free Active Status**: `🟢 Hands-Free Voice Active (Tap to Hear)`.
- **Return Action**: Dedicated `[Way Back to My Parking Lot]` CTA.

### 4. Structured Place Detail Sheet
- Verified heritage / facility badge.
- Live sensor telemetry (Wait time, meals available, crowd trends).
- On-site amenities (Wheelchair ramps, drinking water, shoe stalls).
- Primary actions: **"Visit this place"** / **"Add to my route"**.

---

## 🧪 Quick Test Matrix for Judges

| Test Goal | Method | Expected Output |
|---|---|---|
| **Highway Arrival** | Ask *"Coming by car from Mumbai"* | Outer parking + Shuttle transit leg + Ramkund walk |
| **Elderly Family Plan** | Ask *"With my parents prominent temples in Nashik"* | Crowd-aware plan: Kalaram (ramp) $\rightarrow$ Kapaleshwar $\rightarrow$ Ramkund |
| **In-Journey Detour** | Tap *"🚻 Toilets Near Me"* $\rightarrow$ *"Detour Here"* | Route dynamically diverts through toilet block in <0.5s |
| **Voice Audio** | Click audio speaker icon in search bar | Spoken TTS audio plays aloud in Hindi/Marathi/English |
| **Way Back** | Tap *"Way Back to My Parking Lot"* | Generates return route via feeder shuttle to parked vehicle |
