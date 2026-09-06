# PRAVAH (Anubhav) — Supabase Database Architecture

## 1. Executive Architecture Overview

PRAVAH is designed to serve three interfaces (**Admin Control Room**, **Pilgrim Mobile / Web**, **KISKO Public Kiosk**) and a future **AI Agent** using a single source of truth.

```text
Admin Control Room / Pilgrim App / KISKO / AI Agent Tools
                          │
                   Domain Services
                          │
                  Repository Layer
               (Abstract Interfaces)
                 /                 \
       [DATA_MODE=demo]       [DATA_MODE=supabase]
       Demo Repositories      Supabase Repositories
              │                         │
       In-Memory Store              Supabase
                             (PostgreSQL + PostGIS + Realtime)
```

> [!IMPORTANT]
> **AI Agent Isolation Rule**: The AI Agent and its domain tools must **never** query Supabase directly. All database access is channeled strictly through Domain Services → Repository Layer → Supabase.

---

## 2. Core Architectural Principles

### 2.1 Master / Static Data vs. Operational Observations
Operational conditions at Kumbh (crowd density, parking spaces, food queue, toilet status) change continuously. 

To prevent continuous row overwrites and preserve historical auditability, PRAVAH strictly separates:
- **Master Records** (`zones`, `kitchens`, `parking`, `facilities`, `routes`, `places`, `events`, `advisories`):
  - Store structural, geographic, and permanent attributes.
  - Represented with UUID primary keys and canonical human-readable codes (`Z01`, `K08`, `P09`, `T12`, `R18`).
- **Operational Observations** (`crowd_observations`, `food_observations`, `parking_observations`, `facility_observations`, `route_observations`):
  - Immutable or append-only time-series observations.
  - Contain auditing & trust attributes: `observed_at`, `source`, `verified`, `created_at`.
  - Allow calculating data freshness ("Updated 42 sec ago", "Stale report > 30 min").

---

## 3. Database Schema Design

### 3.1 Master Tables
| Table | Key Columns | PostGIS Geometry | Description |
|---|---|---|---|
| `public.zones` | `id`, `code`, `name`, `area` | `geometry GEOMETRY(Polygon, 4326)` | Operational zone boundaries |
| `public.kitchens` | `id`, `code`, `name`, `zone_id`, `operator`, `capacity` | `location GEOMETRY(Point, 4326)` | Community Annakshetras & Bhojanalayas |
| `public.parking` | `id`, `code`, `name`, `zone_id`, `capacity`, `nearest_ghat` | `location GEOMETRY(Point, 4326)` | Pilgrim vehicle staging lots |
| `public.facilities` | `id`, `code`, `name`, `zone_id`, `type`, `capacity` | `location GEOMETRY(Point, 4326)` | Toilets, water points, medical, help booths |
| `public.routes` | `id`, `code`, `name`, `from_zone_id`, `to_zone_id`, `distance_km` | `geometry GEOMETRY(LineString, 4326)` | Connecting pedestrian routes & links |
| `public.places` | `id`, `code`, `name`, `category`, `zone_id` | `location GEOMETRY(Point, 4326)` | Ghats, temples, Akharas, cultural stories |
| `public.events` | `id`, `code`, `name`, `date`, `start_time`, `peak_time` | N/A | Shahi Snan, Parva Snan, Maha Aarti |
| `public.advisories` | `id`, `code`, `title`, `message`, `severity`, `state` | N/A | Operational & emergency broadcasts |

### 3.2 Operational Observation Tables
| Table | Observation Scope | Trust & Source Attributes |
|---|---|---|
| `public.crowd_observations` | `crowd_level`, `density_score`, `estimated_people`, `trend` | `observed_at`, `source`, `verified`, `confidence` |
| `public.food_observations` | `meals_available`, `estimated_demand`, `queue_minutes`, `status`, `reference_price`, `observed_price` | `observed_at`, `source`, `verified` |
| `public.parking_observations` | `available_spaces`, `occupied_spaces`, `occupancy_percent`, `trend`, `status`, `queue_minutes` | `observed_at`, `source`, `verified` |
| `public.facility_observations` | `status`, `queue_level`, `wait_minutes`, `working_status` | `observed_at`, `source`, `verified` |
| `public.route_observations` | `status`, `crowd_level`, `walking_minutes` | `observed_at`, `source`, `verified` |

---

## 4. PostGIS Spatial Architecture & RPC Functions

All spatial coordinates use WGS84 (`SRID 4326`). GiST spatial indexes are defined on `geometry` and `location` columns for sub-millisecond proximity lookups.

### 4.1 Stored Procedures (RPC)
The migration defines 5 optimized PostGIS helper functions:

1. **`find_nearby_facilities(p_lat, p_lng, p_radius_meters, p_type)`**:
   - Queries facilities within radius using `ST_DWithin` on geography.
   - Joins the latest observation for real-time queue length and operational status.
2. **`find_nearby_parking(p_lat, p_lng, p_radius_meters)`**:
   - Locates parking within radius.
   - Computes distance in meters and returns current occupancy percent and space availability.
3. **`find_nearby_food(p_lat, p_lng, p_radius_meters)`**:
   - Locates community kitchens within radius.
   - Returns remaining meal counts, queue minutes, and price comparison (reference vs. observed).
4. **`find_nearby_places(p_lat, p_lng, p_radius_meters, p_category)`**:
   - Returns cultural places, Ghats, and 60-second stories within walking distance.
5. **`get_zone_for_point(p_lat, p_lng)`**:
   - Performs point-in-polygon containment (`ST_Contains(z.geometry, point)`) to instantly determine the active operational zone and its crowd condition.

---

## 5. Row Level Security (RLS) Matrix

RLS is enabled on every table in `public`:

| Persona | Master Tables | Observations | Shortages & Donations | Audit Log |
|---|---|---|---|---|
| **Public / Anonymous / Pilgrim / KISKO** | SELECT (published/active) | SELECT | SELECT (Shortages), INSERT (Donations) | No Access |
| **Authenticated / Operator / Coordinator** | ALL (CRUD) | ALL (CRUD) | ALL (CRUD) | SELECT & INSERT |
| **Service Role (Backend / Automation)** | Full Access | Full Access | Full Access | Full Access |

---

## 6. Supabase Realtime Publications

The following tables are registered in the `supabase_realtime` publication:
- `public.crowd_observations`
- `public.food_observations`
- `public.parking_observations`
- `public.facility_observations`
- `public.route_observations`
- `public.shortages`
- `public.advisories`

When operators flag a food deficit, update parking occupancy, or post a high-crowd warning in the Admin Control Room, Realtime WebSocket events broadcast immediately to connected Pilgrim and KISKO clients.

---

## 7. Migration & Seeding Instructions

### Reproducing the Database from Scratch

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```
2. **Initialize / Start Local Supabase**:
   ```bash
   supabase start
   ```
3. **Apply Migrations**:
   ```bash
   supabase db reset
   # or
   supabase migration up
   ```
4. **Seed the Deterministic PRAVAH Dataset**:
   ```bash
   supabase db seed
   ```

The database is reproducible from:
- `supabase/migrations/20260906000001_initial_schema.sql`
- `supabase/seed.sql`
