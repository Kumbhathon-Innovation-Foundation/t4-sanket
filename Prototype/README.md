# Kumbh Saathi — Real Multi-Service Architecture

Four independently deployable applications backed by a real Supabase Postgres database and secured backend API for the Nashik Kumbh Mela 2026.

---

## 1. Monorepo Architecture

```
apps/pilgrim-app   → Deployed independently (Vercel/Netlify), PWA for pilgrims, calls services/api
apps/admin         → Deployed independently (Vercel/Netlify), PRAVAH police console with login gate
apps/kiosk         → Deployed independently (Vercel/Netlify), fullscreen kiosk UI for stations & ghats
services/api       → Deployed independently (Render/Railway), Node/Express API with auth & 7 agent tools
packages/shared    → Shared design tokens, TierBadge, Supabase Realtime helper, i18n dictionaries
database/          → Supabase Postgres schema.sql & seed.sql with real Nashik coordinates
```

---

## 2. Environment Variables & Ports

| App / Service | Default Port | Required `.env` Variables | Purpose |
|---|---|---|---|
| `services/api` | `4000` | `PORT=4000`<br/>`SUPABASE_URL`<br/>`SUPABASE_SERVICE_ROLE_KEY`<br/>`JWT_SECRET`<br/>`ALLOWED_ORIGINS` | Owns all writes, 7 tool endpoints, agent query, and password authentication |
| `apps/pilgrim-app` | `5173` | `VITE_API_URL=http://localhost:4000`<br/>`VITE_SUPABASE_URL`<br/>`VITE_SUPABASE_ANON_KEY` | PWA with route navigation, voice guidance, and detour updates |
| `apps/admin` | `5174` | `VITE_API_URL=http://localhost:4000`<br/>`VITE_SUPABASE_URL`<br/>`VITE_SUPABASE_ANON_KEY` | Officer dispatch desk with login gate (`admin` / `pravah2026`) |
| `apps/kiosk` | `5175` | `VITE_API_URL=http://localhost:4000`<br/>`VITE_SUPABASE_URL`<br/>`VITE_SUPABASE_ANON_KEY` | High-contrast touch and voice terminal for public displays |

> **Note**: `packages/shared` is imported by all three frontends. Frontends only hold the public `anon` key for read-only subscriptions. The private `service_role` key is strictly held server-side by `services/api`.

---

## 3. Local Startup Order (End-to-End Testing)

Always start `services/api` first, as all three frontends depend on its live endpoints.

### Quick Start (All in One Command)
```bash
npm install
npm run dev
```

### Or Start Individually in Order:
1. **Start the API Backend**:
   ```bash
   npm run dev:api
   # API running at http://localhost:4000
   ```
2. **Start the Pilgrim App**:
   ```bash
   npm run dev:pilgrim
   # Pilgrim PWA running at http://localhost:5173
   ```
3. **Start the Admin Console**:
   ```bash
   npm run dev:admin
   # PRAVAH Admin Console running at http://localhost:5174
   ```
4. **Start the Kiosk Display**:
   ```bash
   npm run dev:kiosk
   # Station Kiosk running at http://localhost:5175
   ```

---

## 4. Database Setup (Supabase)

1. In your Supabase SQL Editor, run `database/schema.sql` to create all 6 tables and enable Realtime publication on `route_status`.
2. Run `database/seed.sql` to populate real Nashik coordinates, initial route statuses, parking, facilities, food, and the admin user.
3. Verify with `database/verify_schema.sql` that every table has records.

---

## 5. Smoke Test ("Definition of Done")

1. Open the Pilgrim App at `http://localhost:5173` — ask for 4 AM route. It returns direct Riverside road (R17).
2. Open the PRAVAH Admin Console at `http://localhost:5174`.
3. Log in with `admin` / `pravah2026`.
4. Click **Force Close R17 (VIP Procession Emergency Override)**.
5. Watch both Pilgrim App (`:5173`) and Kiosk (`:5175`) instantly receive the alert siren and update live to the Panchavati Ghat (R21) police detour without page refresh!
