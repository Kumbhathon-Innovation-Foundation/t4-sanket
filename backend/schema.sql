-- ==============================================================================
-- ANUBHAV: Supabase Schema Migration (Stage 0)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/olpmcnhpvxfuurbnsxvk/sql/new
-- ==============================================================================

-- 1. POIs: Temples
CREATE TABLE IF NOT EXISTS public.pois_temples (
    id TEXT PRIMARY KEY,
    category TEXT,
    name TEXT,
    type TEXT,
    zone TEXT,
    lng DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    address TEXT,
    rating TEXT,
    review_count TEXT,
    opening_hours TEXT,
    phone TEXT,
    avg_visit_minutes INTEGER,
    maps_link TEXT
);

-- 2. POIs: Ghats
CREATE TABLE IF NOT EXISTS public.pois_ghats (
    id TEXT PRIMARY KEY,
    category TEXT,
    name TEXT,
    lng DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    source TEXT,
    avg_visit_minutes INTEGER
);

-- 3. Parking Zones
CREATE TABLE IF NOT EXISTS public.parking_zones (
    id TEXT PRIMARY KEY,
    name TEXT,
    zone_type TEXT,
    lng DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    "capacity_total_SYNTH" INTEGER,
    "capacity_occupied_SYNTH" INTEGER,
    "fare_estimate_inr_SYNTH" INTEGER
);

-- 4. Facilities (Medical, Police, Help centers, etc.)
CREATE TABLE IF NOT EXISTS public.facilities (
    id TEXT PRIMARY KEY,
    category TEXT,
    name TEXT,
    lng DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    facility_type TEXT,
    address TEXT,
    phone TEXT,
    registered_beds TEXT
);

-- 5. Food & Utility
CREATE TABLE IF NOT EXISTS public.food_utility (
    id TEXT PRIMARY KEY,
    category TEXT,
    name TEXT,
    lng DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    rating TEXT,
    address TEXT,
    "current_crowd_level_SYNTH" TEXT,
    "queue_wait_minutes_SYNTH" INTEGER
);

-- 6. Advisory Corridors (Roads, VIP corridors, holding/congestion zones)
CREATE TABLE IF NOT EXISTS public.advisory_corridors (
    id TEXT PRIMARY KEY,
    type TEXT,
    name TEXT,
    geometry_type TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    path JSONB,
    polygon JSONB,
    "status_SYNTH" TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    severity TEXT
);

-- 7. Trips
CREATE TABLE IF NOT EXISTS public.trips (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    itinerary JSONB,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Trip Patches
CREATE TABLE IF NOT EXISTS public.trip_patches (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    trip_id TEXT REFERENCES public.trips(id) ON DELETE CASCADE,
    patch JSONB NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.pois_temples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois_ghats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_utility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_patches ENABLE ROW LEVEL SECURITY;

-- Allow anon public SELECT-only policies on Reference/POI tables
DROP POLICY IF EXISTS "Anon public read pois_temples" ON public.pois_temples;
CREATE POLICY "Anon public read pois_temples" ON public.pois_temples FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon public read pois_ghats" ON public.pois_ghats;
CREATE POLICY "Anon public read pois_ghats" ON public.pois_ghats FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon public read parking_zones" ON public.parking_zones;
CREATE POLICY "Anon public read parking_zones" ON public.parking_zones FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon public read facilities" ON public.facilities;
CREATE POLICY "Anon public read facilities" ON public.facilities FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon public read food_utility" ON public.food_utility;
CREATE POLICY "Anon public read food_utility" ON public.food_utility FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anon public read advisory_corridors" ON public.advisory_corridors;
CREATE POLICY "Anon public read advisory_corridors" ON public.advisory_corridors FOR SELECT TO anon USING (true);

-- Operational tables (trips, trip_patches) get NO anon access:
-- Only backend service_role key has read/write access (service_role bypasses RLS).

-- ==============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ==============================================================================
ALTER TABLE public.advisory_corridors REPLICA IDENTITY FULL;
ALTER TABLE public.trip_patches REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'advisory_corridors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.advisory_corridors;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'trip_patches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_patches;
  END IF;
END $$;
