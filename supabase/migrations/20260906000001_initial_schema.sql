-- ====================================================================
-- PRAVAH (Anubhav) — Initial PostgreSQL + PostGIS Database Schema
-- Migration: 20260906000001_initial_schema.sql
-- Description:
--   1. Extensions: uuid-ossp, postgis
--   2. Master/Static Data: zones, kitchens, parking, facilities, routes, places, events, advisories
--   3. Operational Observations: crowd_observations, food_observations, parking_observations, facility_observations, route_observations
--   4. Specialized Operational Tables: shortages, food_donations, volunteers, audit_entries
--   5. PostGIS Spatial Indexes & B-Tree Indexes
--   6. Spatial RPC Functions: find_nearby_facilities, find_nearby_parking, find_nearby_food, find_nearby_places, get_zone_for_point
--   7. Supabase Realtime Publication Setup
--   8. Row Level Security (RLS) Policies
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ====================================================================
-- 2. MASTER / STATIC DATA TABLES
-- ====================================================================

-- 2.1 Zones Master
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'Z01', 'Z02'
  name VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  description TEXT,
  geometry GEOMETRY(Polygon, 4326),
  center_latitude NUMERIC(10, 6),
  center_longitude NUMERIC(10, 6),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Kitchens / Annakshetras Master
CREATE TABLE IF NOT EXISTS public.kitchens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'K01', 'K08'
  name VARCHAR(150) NOT NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  operator VARCHAR(150) NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  address TEXT,
  capacity INTEGER NOT NULL DEFAULT 5000,
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'STABLE', -- 'STABLE', 'WARNING', 'CRITICAL', 'CLOSED'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Parking Master
CREATE TABLE IF NOT EXISTS public.parking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'P01', 'P09'
  name VARCHAR(150) NOT NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  capacity INTEGER NOT NULL DEFAULT 1000,
  parking_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL', -- 'GENERAL', 'HEAVY_VEHICLE', 'TWO_WHEELER', 'VIP'
  nearest_ghat VARCHAR(100),
  walking_km NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
  walking_minutes INTEGER NOT NULL DEFAULT 15,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'FULL', 'CLOSED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Civic Facilities Master
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'T08', 'W07', 'M03'
  name VARCHAR(150) NOT NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL, -- 'TOILET', 'WATER', 'MEDICAL', 'HELP_POINT', 'REST_AREA'
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  capacity INTEGER NOT NULL DEFAULT 50,
  accessible BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'NEEDS_ATTENTION', 'CLOSED'
  last_inspection TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Routes & Links Master
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'R08', 'R17'
  name VARCHAR(150) NOT NULL,
  from_zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  to_zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  from_name VARCHAR(100) NOT NULL,
  to_name VARCHAR(100) NOT NULL,
  distance_km NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
  walking_minutes INTEGER NOT NULL DEFAULT 15,
  geometry GEOMETRY(LineString, 4326),
  status VARCHAR(30) NOT NULL DEFAULT 'RECOMMENDED', -- 'RECOMMENDED', 'CONGESTED', 'CLOSED', 'DIVERSION'
  alternative_route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Cultural Places & Discovery Master
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'PL01', 'PL08'
  name VARCHAR(150) NOT NULL,
  category VARCHAR(30) NOT NULL, -- 'GHAT', 'TEMPLE', 'HISTORIC', 'AKHARA', 'CULTURAL', 'OTHER'
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  short_description TEXT,
  historical_significance TEXT,
  sixty_second_story TEXT,
  cultural_context TEXT,
  visitor_information TEXT,
  languages TEXT[] NOT NULL DEFAULT ARRAY['en', 'hi', 'mr'],
  published BOOLEAN NOT NULL DEFAULT true,
  verification VARCHAR(20) NOT NULL DEFAULT 'VERIFIED', -- 'VERIFIED', 'PENDING'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Kumbh Events & Shahi Snan Master
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'EV01'
  name VARCHAR(150) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  peak_time TIME NOT NULL,
  end_time TIME NOT NULL,
  expected_crowd INTEGER NOT NULL DEFAULT 50000,
  affected_zones TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  published BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Advisories & Broadcast Alerts
CREATE TABLE IF NOT EXISTS public.advisories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'AL01'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'GENERAL', -- 'CROWD', 'FOOD', 'ROUTE', 'FACILITY', 'GENERAL'
  severity VARCHAR(20) NOT NULL DEFAULT 'INFORMATION', -- 'INFORMATION', 'WARNING', 'HIGH', 'CRITICAL'
  audience TEXT[] NOT NULL DEFAULT ARRAY['PILGRIM', 'VOLUNTEER', 'ADMIN'],
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SCHEDULED', 'SENT', 'EXPIRED', 'DRAFT'
  verified BOOLEAN NOT NULL DEFAULT true,
  verification_source VARCHAR(100) NOT NULL DEFAULT 'CONTROL_ROOM',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 3. OPERATIONAL OBSERVATIONS (TIME-SERIES / NON-DESTRUCTIVE)
-- ====================================================================

-- 3.1 Crowd Observations
CREATE TABLE IF NOT EXISTS public.crowd_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  crowd_level VARCHAR(20) NOT NULL, -- 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', 'CRITICAL', 'PEAK'
  density_score NUMERIC(4, 2) NOT NULL DEFAULT 0.50,
  estimated_people INTEGER NOT NULL DEFAULT 0,
  trend VARCHAR(20) NOT NULL DEFAULT 'STABLE', -- 'INCREASING', 'STABLE', 'DECREASING'
  confidence VARCHAR(20) NOT NULL DEFAULT 'HIGH', -- 'HIGH', 'MEDIUM', 'LOW'
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'DEMO', -- 'DEMO', 'VOLUNTEER', 'OPERATOR', 'SENSOR'
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Food & Kitchen Observations
CREATE TABLE IF NOT EXISTS public.food_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  food_item VARCHAR(100) NOT NULL DEFAULT 'Standard Annakshetra Meal',
  meals_available INTEGER NOT NULL DEFAULT 1000,
  estimated_demand INTEGER NOT NULL DEFAULT 1000,
  availability VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'LIMITED', 'OUT_OF_STOCK'
  reference_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Standard / canonical price (0 for Free Mahaprasad)
  observed_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Voluntary contribution / observed price
  queue_minutes INTEGER NOT NULL DEFAULT 5,
  status VARCHAR(20) NOT NULL DEFAULT 'STABLE', -- 'STABLE', 'WARNING', 'CRITICAL', 'CLOSED'
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'DEMO',
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Parking Observations
CREATE TABLE IF NOT EXISTS public.parking_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_id UUID NOT NULL REFERENCES public.parking(id) ON DELETE CASCADE,
  available_spaces INTEGER NOT NULL,
  occupied_spaces INTEGER NOT NULL,
  occupancy_percent INTEGER NOT NULL,
  queue_minutes INTEGER NOT NULL DEFAULT 2,
  trend VARCHAR(20) NOT NULL DEFAULT 'STABLE', -- 'INCREASING', 'STABLE', 'DECREASING'
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'LIMITED', 'FULL', 'CLOSED'
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'DEMO',
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Facility Observations
CREATE TABLE IF NOT EXISTS public.facility_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'NEEDS_ATTENTION', 'CLOSED'
  queue_level VARCHAR(20) NOT NULL DEFAULT 'LOW', -- 'LOW', 'MODERATE', 'HIGH', 'PEAK'
  wait_minutes INTEGER NOT NULL DEFAULT 2,
  working_status VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL',
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'DEMO',
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 Route Observations
CREATE TABLE IF NOT EXISTS public.route_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'RECOMMENDED', -- 'RECOMMENDED', 'CONGESTED', 'CLOSED', 'DIVERSION'
  crowd_level VARCHAR(20) NOT NULL DEFAULT 'LOW', -- 'LOW', 'MODERATE', 'HIGH', 'PEAK'
  walking_minutes INTEGER NOT NULL DEFAULT 15,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'DEMO',
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 4. SPECIALIZED OPERATIONAL & SHORTAGE TABLES
-- ====================================================================

-- 4.1 Shortages (Verified Food Deficits)
CREATE TABLE IF NOT EXISTS public.shortages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'SH-1021'
  kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  meals_required INTEGER NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'WARNING', -- 'WARNING', 'CRITICAL'
  verification VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'FULFILLED'
  cost_per_meal NUMERIC(10, 2) NOT NULL DEFAULT 35.00,
  funds_raised NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  target_funds NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  verified_by VARCHAR(100),
  verification_notes TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Food Donations & Sponsoring
CREATE TABLE IF NOT EXISTS public.food_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shortage_id UUID NOT NULL REFERENCES public.shortages(id) ON DELETE CASCADE,
  kitchen_id UUID NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  donor_name VARCHAR(150) NOT NULL,
  meals_sponsored INTEGER NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'UPI', -- 'UPI', 'CARD', 'NETBANKING'
  anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 Volunteer Deployments
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'V119', 'V142'
  name VARCHAR(150) NOT NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  languages TEXT[] NOT NULL DEFAULT ARRAY['en', 'hi', 'mr'],
  skills TEXT[] NOT NULL DEFAULT ARRAY['Crowd Management', 'First Aid'],
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'ASSIGNED', 'OFFLINE'
  assignment TEXT,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  location GEOMETRY(Point, 4326),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.4 Audit Entries & Operational Change Log
CREATE TABLE IF NOT EXISTS public.audit_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor VARCHAR(150) NOT NULL,
  role VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  object_id VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  severity VARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
  reason TEXT
);

-- ====================================================================
-- 5. INDEXING & PERFORMANCE
-- ====================================================================

-- 5.1 Business Key Indexes
CREATE INDEX IF NOT EXISTS idx_zones_code ON public.zones(code);
CREATE INDEX IF NOT EXISTS idx_kitchens_code ON public.kitchens(code);
CREATE INDEX IF NOT EXISTS idx_parking_code ON public.parking(code);
CREATE INDEX IF NOT EXISTS idx_facilities_code ON public.facilities(code);
CREATE INDEX IF NOT EXISTS idx_routes_code ON public.routes(code);
CREATE INDEX IF NOT EXISTS idx_places_code ON public.places(code);
CREATE INDEX IF NOT EXISTS idx_events_code ON public.events(code);
CREATE INDEX IF NOT EXISTS idx_advisories_code ON public.advisories(code);

-- 5.2 Foreign Key & Status Indexes
CREATE INDEX IF NOT EXISTS idx_kitchens_zone_id ON public.kitchens(zone_id);
CREATE INDEX IF NOT EXISTS idx_parking_zone_id ON public.parking(zone_id);
CREATE INDEX IF NOT EXISTS idx_facilities_zone_id ON public.facilities(zone_id);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON public.facilities(type);
CREATE INDEX IF NOT EXISTS idx_places_zone_id ON public.places(zone_id);
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_advisories_zone_id ON public.advisories(zone_id);
CREATE INDEX IF NOT EXISTS idx_advisories_state ON public.advisories(state);

-- 5.3 Time-Series Observation Indexes (zone/entity + observed_at desc)
CREATE INDEX IF NOT EXISTS idx_crowd_obs_zone_time ON public.crowd_observations(zone_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_obs_kitchen_time ON public.food_observations(kitchen_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_parking_obs_parking_time ON public.parking_observations(parking_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_facility_obs_facility_time ON public.facility_observations(facility_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_obs_route_time ON public.route_observations(route_id, observed_at DESC);

-- 5.4 Spatial GiST Indexes for Fast Proximity Queries
CREATE INDEX IF NOT EXISTS idx_zones_geometry ON public.zones USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_kitchens_location ON public.kitchens USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_parking_location ON public.parking USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_facilities_location ON public.facilities USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_routes_geometry ON public.routes USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_places_location ON public.places USING GIST (location);

-- ====================================================================
-- 6. SPATIAL HELPER FUNCTIONS (POSTGIS RPC)
-- ====================================================================

-- 6.1 Find Working Facilities within Radius
CREATE OR REPLACE FUNCTION public.find_nearby_facilities(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_meters NUMERIC DEFAULT 1000,
  p_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  type VARCHAR,
  distance_meters NUMERIC,
  status VARCHAR,
  queue_level VARCHAR,
  wait_minutes INTEGER,
  accessible BOOLEAN,
  latitude NUMERIC,
  longitude NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    f.id,
    f.code,
    f.name,
    f.type,
    ROUND(ST_Distance(f.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::NUMERIC, 1) AS distance_meters,
    COALESCE(obs.status, f.status) AS status,
    COALESCE(obs.queue_level, 'LOW') AS queue_level,
    COALESCE(obs.wait_minutes, 2) AS wait_minutes,
    f.accessible,
    f.latitude,
    f.longitude
  FROM public.facilities f
  LEFT JOIN LATERAL (
    SELECT o.status, o.queue_level, o.wait_minutes
    FROM public.facility_observations o
    WHERE o.facility_id = f.id
    ORDER BY o.observed_at DESC
    LIMIT 1
  ) obs ON true
  WHERE (p_type IS NULL OR f.type = p_type)
    AND ST_DWithin(f.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
  ORDER BY distance_meters ASC;
$$;

-- 6.2 Find Available Parking within Radius
CREATE OR REPLACE FUNCTION public.find_nearby_parking(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_meters NUMERIC DEFAULT 2500
)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  distance_meters NUMERIC,
  capacity INTEGER,
  available_spaces INTEGER,
  occupancy_percent INTEGER,
  status VARCHAR,
  nearest_ghat VARCHAR,
  latitude NUMERIC,
  longitude NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.code,
    p.name,
    ROUND(ST_Distance(p.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::NUMERIC, 1) AS distance_meters,
    p.capacity,
    COALESCE(obs.available_spaces, p.capacity) AS available_spaces,
    COALESCE(obs.occupancy_percent, 0) AS occupancy_percent,
    COALESCE(obs.status, p.status) AS status,
    p.nearest_ghat,
    p.latitude,
    p.longitude
  FROM public.parking p
  LEFT JOIN LATERAL (
    SELECT o.available_spaces, o.occupancy_percent, o.status
    FROM public.parking_observations o
    WHERE o.parking_id = p.id
    ORDER BY o.observed_at DESC
    LIMIT 1
  ) obs ON true
  WHERE ST_DWithin(p.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
  ORDER BY distance_meters ASC;
$$;

-- 6.3 Find Nearby Food & Community Kitchens
CREATE OR REPLACE FUNCTION public.find_nearby_food(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_meters NUMERIC DEFAULT 2000
)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  operator VARCHAR,
  distance_meters NUMERIC,
  meals_available INTEGER,
  queue_minutes INTEGER,
  status VARCHAR,
  reference_price NUMERIC,
  observed_price NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    k.id,
    k.code,
    k.name,
    k.operator,
    ROUND(ST_Distance(k.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::NUMERIC, 1) AS distance_meters,
    COALESCE(obs.meals_available, 1000) AS meals_available,
    COALESCE(obs.queue_minutes, 5) AS queue_minutes,
    COALESCE(obs.status, k.status) AS status,
    COALESCE(obs.reference_price, 0.00) AS reference_price,
    COALESCE(obs.observed_price, 0.00) AS observed_price,
    k.latitude,
    k.longitude
  FROM public.kitchens k
  LEFT JOIN LATERAL (
    SELECT o.meals_available, o.queue_minutes, o.status, o.reference_price, o.observed_price
    FROM public.food_observations o
    WHERE o.kitchen_id = k.id
    ORDER BY o.observed_at DESC
    LIMIT 1
  ) obs ON true
  WHERE ST_DWithin(k.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
  ORDER BY distance_meters ASC;
$$;

-- 6.4 Find Nearby Cultural Places
CREATE OR REPLACE FUNCTION public.find_nearby_places(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_meters NUMERIC DEFAULT 3000,
  p_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  category VARCHAR,
  distance_meters NUMERIC,
  short_description TEXT,
  sixty_second_story TEXT,
  latitude NUMERIC,
  longitude NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    pl.id,
    pl.code,
    pl.name,
    pl.category,
    ROUND(ST_Distance(pl.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography)::NUMERIC, 1) AS distance_meters,
    pl.short_description,
    pl.sixty_second_story,
    pl.latitude,
    pl.longitude
  FROM public.places pl
  WHERE pl.published = true
    AND (p_category IS NULL OR pl.category = p_category)
    AND ST_DWithin(pl.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
  ORDER BY distance_meters ASC;
$$;

-- 6.5 Get Zone containing Point
CREATE OR REPLACE FUNCTION public.get_zone_for_point(
  p_lat NUMERIC,
  p_lng NUMERIC
)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  area VARCHAR,
  crowd_level VARCHAR,
  trend VARCHAR
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    z.id,
    z.code,
    z.name,
    z.area,
    COALESCE(obs.crowd_level, 'MODERATE') AS crowd_level,
    COALESCE(obs.trend, 'STABLE') AS trend
  FROM public.zones z
  LEFT JOIN LATERAL (
    SELECT o.crowd_level, o.trend
    FROM public.crowd_observations o
    WHERE o.zone_id = z.id
    ORDER BY o.observed_at DESC
    LIMIT 1
  ) obs ON true
  WHERE ST_Contains(z.geometry, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))
  LIMIT 1;
$$;

-- ====================================================================
-- 7. SUPABASE REALTIME CONFIGURATION
-- ====================================================================

-- Add operational observation tables and active advisories to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.crowd_observations,
  public.food_observations,
  public.parking_observations,
  public.facility_observations,
  public.route_observations,
  public.shortages,
  public.advisories;

-- ====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_entries ENABLE ROW LEVEL SECURITY;

-- 8.1 Public Read Policies (Pilgrim App / KISKO / Anonymous Web)
CREATE POLICY "Public can read zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Public can read kitchens" ON public.kitchens FOR SELECT USING (true);
CREATE POLICY "Public can read parking" ON public.parking FOR SELECT USING (true);
CREATE POLICY "Public can read facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Public can read routes" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Public can read published places" ON public.places FOR SELECT USING (published = true);
CREATE POLICY "Public can read published events" ON public.events FOR SELECT USING (published = true);
CREATE POLICY "Public can read active advisories" ON public.advisories FOR SELECT USING (state = 'ACTIVE');

CREATE POLICY "Public can read crowd observations" ON public.crowd_observations FOR SELECT USING (true);
CREATE POLICY "Public can read food observations" ON public.food_observations FOR SELECT USING (true);
CREATE POLICY "Public can read parking observations" ON public.parking_observations FOR SELECT USING (true);
CREATE POLICY "Public can read facility observations" ON public.facility_observations FOR SELECT USING (true);
CREATE POLICY "Public can read route observations" ON public.route_observations FOR SELECT USING (true);
CREATE POLICY "Public can read shortages" ON public.shortages FOR SELECT USING (true);
CREATE POLICY "Public can read food donations" ON public.food_donations FOR SELECT USING (true);

-- 8.2 Authenticated / Admin / Coordinator Write Policies
CREATE POLICY "Authenticated users can manage crowd observations" ON public.crowd_observations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage food observations" ON public.food_observations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage parking observations" ON public.parking_observations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage facility observations" ON public.facility_observations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage route observations" ON public.route_observations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage shortages" ON public.shortages 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can donate to shortages" ON public.food_donations 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage master tables" ON public.zones 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage kitchens" ON public.kitchens 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage parking" ON public.parking 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage facilities" ON public.facilities 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage routes" ON public.routes 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage places" ON public.places 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage events" ON public.events 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage advisories" ON public.advisories 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view and log audit entries" ON public.audit_entries 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
