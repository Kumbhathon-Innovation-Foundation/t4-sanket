# PRAVAH (Anubhav) — DATA_MODE Developer Guide

This document explains the multi-mode data foundation in PRAVAH, how switching between **DEMO** and **SUPABASE** modes works, and how to configure local development and staging environments.

---

## 1. Overview of Data Modes

PRAVAH supports two distinct operating modes configured via the environment variable `VITE_DATA_MODE`:

| Mode | Configuration | Backend | Use Case |
|---|---|---|---|
| **DEMO** (Default) | `VITE_DATA_MODE=demo` | In-memory reactive store (`src/services/mock/store.ts`) | Offline demos, presentations, rapid prototyping, local UI iteration with instant reset and surge triggers |
| **SUPABASE** | `VITE_DATA_MODE=supabase` | PostgreSQL + PostGIS database + Supabase Realtime | Live pilot, shared operational data across Admin, Pilgrim App, KISKO, and future AI Agent |

---

## 2. Decoupled Architecture

The UI never knows whether data is sourced from mock memory or a live database.

```text
React Pages & UI Components
           │
     Domain Services (src/services/index.ts)
           │
    Repository Layer (src/repositories/index.ts)
           │
  ┌────────┴────────┐
  ▼                 ▼
Demo Repos      Supabase Repos
(in-memory)     (@supabase/supabase-js)
```

1. **Domain Services** expose business methods such as `getCrowdZones()`, `updateKitchenStock()`, `findNearbyParking()`, `findBestJourney()`.
2. **Repository Factory** reads `DATA_MODE` and provides the appropriate repository implementation (`DemoCrowdRepository` vs `SupabaseCrowdRepository`).
3. **Graceful Fallback**: If `VITE_DATA_MODE=supabase` is set but credentials are missing, the client issues a warning and prevents fatal crashes.

---

## 3. How to Run in DEMO Mode

DEMO mode is active by default. No database or external services are needed.

1. Ensure `.env` contains:
   ```env
   VITE_DATA_MODE=demo
   ```
2. Start the development server:
   ```bash
   cd app/admin
   npm run dev
   ```
3. In DEMO mode:
   - All 8 zones, 14 kitchens, 6 parking lots, and routes load immediately.
   - All mutations update the in-memory store reactively.
   - Simulated network latency (120ms - 240ms) provides real loading states.
   - You can simulate parking surges, crowd spikes, and food deficit flags without touching any real database.
   - Resetting the store in `/admin/settings` restores the initial mock state.

---

## 4. How to Run in SUPABASE Mode

SUPABASE mode connects to a live PostgreSQL database equipped with PostGIS.

### Step 1: Set Up Supabase
Either use a hosted Supabase project at [supabase.com](https://supabase.com) or run a local instance:
```bash
# Local Supabase (optional)
supabase start
```

### Step 2: Run Database Migrations and Seed
Execute the initial schema migration and seed script located in the `supabase/` directory:
```bash
# Apply initial schema & PostGIS extensions
supabase migration up
# Seed the deterministic PRAVAH dataset
supabase db seed
```
Or execute `supabase/migrations/20260906000001_initial_schema.sql` and `supabase/seed.sql` directly in your Supabase SQL Editor.

### Step 3: Configure Environment Variables
In `app/admin/.env`:
```env
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 4: Run the Application
```bash
cd app/admin
npm run dev
```
The Admin Control Room will now read and write directly to your Supabase instance, with Realtime updates broadcast across all connected clients.

---

## 5. Runtime Programmatic Switching

For automated end-to-end testing, you can dynamically inspect or change data mode at runtime via the repository registry:

```typescript
import { getDataMode, setDataMode } from "@/repositories";

console.log(getDataMode()); // "demo"

// Switch to Supabase mode programmatically
setDataMode("supabase");
```
