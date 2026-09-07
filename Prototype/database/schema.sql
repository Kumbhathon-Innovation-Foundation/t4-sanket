-- ========================================================================
-- Kumbh Saathi — Production Supabase Postgres Schema
-- ========================================================================

-- 1. Locations Table (Nashik pilgrim points, ghats, parking, temples)
create table if not exists locations (
  id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  type text not null  -- 'ghat' | 'temple' | 'parking' | 'facility'
);

-- 2. Route Status Table (Corridor status, police overrides, live flow)
create table if not exists route_status (
  route_id text primary key,
  from_location text references locations(id),
  to_location text references locations(id),
  tier integer not null default 4, -- 1: Tactical Override, 2: Verified Advisory, 3: Automated, 4: Normal
  crowd text not null default 'moderate', -- 'low' | 'moderate' | 'high' | 'surge'
  message_hi text,
  message_mr text,
  message_en text,
  updated_by text,
  updated_at timestamptz default now()
);

-- 3. Parking Lots (Referencing locations)
create table if not exists parking (
  id text primary key references locations(id),
  availability_pct integer not null default 100
);

-- 4. Facilities (Clean toilets, sanitation, emergency points)
create table if not exists facilities (
  id text primary key,
  type text not null,          -- 'toilet' | 'water' | 'medical'
  near_location text references locations(id),
  status text not null default 'working', -- 'clean' | 'working' | 'cleaning'
  distance_m integer,
  queue_min integer,
  last_verified_at timestamptz default now()
);

-- 5. Food & Mahaprasad Spots (Langar, subsidized thalis)
create table if not exists food (
  id text primary key,
  near_location text references locations(id),
  distance_m integer,
  queue text,
  reference_price_inr integer
);

-- 6. Admin Users (PRAVAH Police Control Room auth)
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null
);

-- Enable Supabase Realtime for route status broadcasting
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table route_status;
  end if;
end $$;
