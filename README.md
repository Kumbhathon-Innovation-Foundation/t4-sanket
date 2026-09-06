# ANUBHAV — Intelligent Pilgrim Experience Platform

**Team:** Sanket  
**Tower:** 4 - Pilgrim Experience  
**Event:** Kumbhathon SPRINT  
**Owning System:** Pilgrim-facing intelligence layer of Kumbh Saathi 2.0 (Powered by PRAVAH Decision Engine)

---

## 👥 Team Members
- [@Gursevaksingh84](https://github.com/Gursevaksingh84)
- [@SakshiZurale](https://github.com/SakshiZurale)
- [@kalpesh-28](https://github.com/kalpesh-28)
- [@warungasenikhil49-byte](https://github.com/warungasenikhil49-byte)
- [@Jaware-Shruti-15](https://github.com/Jaware-Shruti-15)

---

## 1. Problem

Pilgrims arriving at Kumbh Mela 2026 cannot easily get a single, trustworthy, real-time answer to *"what should I do right now"* — which route is safe, where to park, where to find clean sanitation, where food is available — especially when official restrictions (police emergency orders, VIP processions) override raw crowd sensor telemetry. 

Today that intelligence exists only inside the **PRAVAH** admin control room. Pilgrims have no direct access to it.

---

## 2. Solution: ANUBHAV & PRAVAH

**ANUBHAV** is the pilgrim-facing AI assistant connected to **PRAVAH's** shared Decision Engine. It is not an LLM guessing answers:
- **One Shared Brain:** ANUBHAV consumes the exact same domain services (`services/index.ts`) and Supabase schema as the PRAVAH control room.
- **Strict Legal Authority Priority:** 
  $$\text{Tactical Override (Police Order)} > \text{Verified Advisory} > \text{Automated Guidance (Crowd Sensors)} > \text{Telemetry}$$
- **Instant Realtime Sync:** When an admin in the control room pushes a Tactical Override (e.g. force-closing Route R18), every pilgrim's agent reflects it within seconds via Supabase Realtime without manual refresh or redeploy.
- **Zero-WiFi Fallback:** Runs seamlessly in `DATA_MODE=demo` offline with zero API latency.

---

## 3. Architecture

```
                 PRAVAH Command Center (Admin)
                              │
                      [1-Click Override]
                              │
                              ▼
            ┌───────────────────────────────────┐
            │   Supabase Realtime & Postgres    │
            │   (Shared Operational Database)   │
            └───────────────────────────────────┘
                              ▲
                              │ Live Tool Calls
                              │
                      /api/agent Endpoint
                              │
                      ANUBHAV PWA (Pilgrim)
              (Tier Badges: 🔴 OVERRIDE | 🔵 ADVISORY | 🟡 AUTOMATED)
```

### The 4 Canonical Domain Tools
1. `get_guidance_board()` — Route and crowd status tiered by legal authority
2. `get_parking_status()` — Live bay availability and occupancy (P09, etc.)
3. `get_food_availability()` — Active kitchens, meals remaining, buffer reserves (K08, etc.)
4. `get_facility_status()` — Sanitation facilities, distance, and verified queue wait times (T12, etc.)

---

## 4. Quick Start: How to Run Locally

### Prerequisites
- Node.js 18+ & npm (or Bun)
- Git

### Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/Kumbhathon-Innovation-Foundation/t4-sanket.git
cd t4-sanket

# 2. Install dependencies
cd app/admin
npm install

# 3. Start development server
npm run dev
```

The application will start at **`http://localhost:3000`**.

---

## 5. Main Application Routes

| Route | Description | Target Audience |
|---|---|---|
| **`/pilgrim`** | **ANUBHAV Mobile AI Assistant** — Mobile-first PWA chat, interactive structured cards, tier badges, real-time override alerts. | Pilgrims & Citizens |
| **`/admin/guidance`** | **PRAVAH Guidance Hub & Hero Controller** — 5-tab Decision Engine with 1-click `[⚡ Force-Close Route R18]` projector button. | Police & Command Center |
| **`/admin/crowd`** | Real-time crowd density monitoring across all 6 Kumbh sectors. | Operations Admin |
| **`/admin/parking`** | Parking lot capacity & auto-diversions. | Traffic Police |
| **`/admin/food`** | Annakshetra supply, shortages & crowd meal demand. | Food Coordinators |
| **`/admin/facilities`** | Sanitation queue status and water pressure telemetry. | Municipal Corp |
| **`/kisko`** | **KISKO Citizen Kiosk Simulator** — 55" high-contrast terminal for pilgrims without smartphones. | Public Transit Kiosks |

---

## 6. Supabase Database Setup

### Option A: Supabase Cloud (Fastest, ~3 mins)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase Dashboard.
3. Copy & paste the all-in-one setup file: [`supabase/setup_all.sql`](supabase/setup_all.sql) and click **Run**.
4. Copy your `Project URL` and `anon key` from **Project Settings → API**.
5. Put them in `app/admin/.env`:
   ```ini
   VITE_DATA_MODE=supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
6. Restart dev server: `npm run dev`.

### Option B: Local Demo Mode (Zero Config)
Leave `VITE_DATA_MODE=demo` in `app/admin/.env`. The application runs 100% offline with preloaded deterministic Kumbh Mela data.

---

## 7. Showcase Demo Walkthrough

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) for the exact 5-minute timed presentation script and click sequence.
