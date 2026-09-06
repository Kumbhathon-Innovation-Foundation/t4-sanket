-- ====================================================================
-- PRAVAH (Anubhav) â€” Initial PostgreSQL + PostGIS Database Schema
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
-- ====================================================================
-- PRAVAH (Anubhav) â€” Guidance Engine Migration
-- File: supabase/migrations/20260906000002_guidance_engine.sql
-- Description:
--   Introduces the Automated Guidance Engine database foundation:
--   - guidance_rules: Configurable threshold rules per module
--   - automated_guidance: Engine-generated recommendations
--   - guidance_overrides: Admin/authority tactical overrides
-- ====================================================================

-- 1. GUIDANCE RULES â€” Configurable detection thresholds
CREATE TABLE IF NOT EXISTS public.guidance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  module VARCHAR(50) NOT NULL CHECK (module IN ('CROWD', 'PARKING', 'FACILITY', 'ROUTE', 'FOOD')),
  condition_metric VARCHAR(100) NOT NULL,
  operator VARCHAR(10) NOT NULL CHECK (operator IN ('>', '>=', '<', '<=', '=', '!=')),
  threshold_value NUMERIC(10,2) NOT NULL,
  duration_seconds INT DEFAULT 0,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'RECOMMEND_ALTERNATE',
    'GENERATE_WARNING',
    'DEPRIORITIZE',
    'NEVER_RECOMMEND',
    'ESCALATE_ADMIN'
  )),
  severity VARCHAR(20) DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.guidance_rules IS 'Configurable rules that define when the Guidance Engine should trigger automated recommendations.';

-- 2. AUTOMATED GUIDANCE â€” Engine-generated recommendations
CREATE TABLE IF NOT EXISTS public.automated_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  rule_id UUID REFERENCES public.guidance_rules(id) ON DELETE SET NULL,
  source_module VARCHAR(50) NOT NULL CHECK (source_module IN ('CROWD', 'PARKING', 'FACILITY', 'ROUTE', 'FOOD')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  guidance_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  recommended_action TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'PROMOTED_TO_VERIFIED', 'DISMISSED')),
  confidence VARCHAR(20) DEFAULT 'HIGH' CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  severity VARCHAR(20) DEFAULT 'WARNING' CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
  metric_snapshot JSONB DEFAULT '{}',
  zone_id VARCHAR(10),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_by VARCHAR(100),
  promoted_advisory_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.automated_guidance IS 'System-generated guidance items produced by the Guidance Engine when rules are crossed.';

-- 3. GUIDANCE OVERRIDES â€” Admin/authority tactical directives
CREATE TABLE IF NOT EXISTS public.guidance_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  override_type VARCHAR(50) NOT NULL CHECK (override_type IN (
    'FORCE_CLOSE',
    'FORCE_OPEN',
    'SUPPRESS_AUTO_GUIDANCE',
    'FORCE_RECOMMEND'
  )),
  reason TEXT NOT NULL,
  authorized_by VARCHAR(100) NOT NULL,
  authority_role VARCHAR(100),
  active BOOLEAN DEFAULT true,
  zone_id VARCHAR(10),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.guidance_overrides IS 'Tactical overrides issued by administrators or authorities to force or suppress engine behavior.';

-- 4. INDEXES for query performance
CREATE INDEX IF NOT EXISTS idx_guidance_rules_module ON public.guidance_rules(module);
CREATE INDEX IF NOT EXISTS idx_guidance_rules_enabled ON public.guidance_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_automated_guidance_status ON public.automated_guidance(status);
CREATE INDEX IF NOT EXISTS idx_automated_guidance_module ON public.automated_guidance(source_module);
CREATE INDEX IF NOT EXISTS idx_automated_guidance_entity ON public.automated_guidance(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_automated_guidance_zone ON public.automated_guidance(zone_id);
CREATE INDEX IF NOT EXISTS idx_guidance_overrides_active ON public.guidance_overrides(active);
CREATE INDEX IF NOT EXISTS idx_guidance_overrides_entity ON public.guidance_overrides(entity_type, entity_id);

-- 5. ROW LEVEL SECURITY
ALTER TABLE public.guidance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidance_overrides ENABLE ROW LEVEL SECURITY;

-- Open read policies (admin/service reads)
CREATE POLICY "Allow public read for guidance_rules" ON public.guidance_rules FOR SELECT USING (true);
CREATE POLICY "Allow public read for automated_guidance" ON public.automated_guidance FOR SELECT USING (true);
CREATE POLICY "Allow public read for guidance_overrides" ON public.guidance_overrides FOR SELECT USING (true);

-- Open write policies (controlled by app-level auth in production)
CREATE POLICY "Allow public write for guidance_rules" ON public.guidance_rules FOR ALL USING (true);
CREATE POLICY "Allow public write for automated_guidance" ON public.automated_guidance FOR ALL USING (true);
CREATE POLICY "Allow public write for guidance_overrides" ON public.guidance_overrides FOR ALL USING (true);

-- 6. REALTIME â€” Enable Supabase realtime for live dashboards
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guidance_rules;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.automated_guidance;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.guidance_overrides;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 7. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_guidance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guidance_rules_updated_at
  BEFORE UPDATE ON public.guidance_rules
  FOR EACH ROW EXECUTE FUNCTION update_guidance_updated_at();

CREATE TRIGGER trg_guidance_overrides_updated_at
  BEFORE UPDATE ON public.guidance_overrides
  FOR EACH ROW EXECUTE FUNCTION update_guidance_updated_at();
-- ====================================================================
-- PRAVAH (Anubhav) â€” Deterministic SQL Seed Data
-- File: supabase/seed.sql
-- Description:
--   Concise, proper operational dataset for Kumbh Mela Nashik-Trimbakeshwar.
--   Provides 6 core zones, 6 kitchens, 4 parking hubs, 6 facilities,
--   4 routes, 3 places, 2 events, 3 advisories, and time-series observations.
-- ====================================================================

-- 1. ZONES MASTER (6 Core Kumbh Mela Zones)
INSERT INTO public.zones (id, code, name, area, description, geometry, center_latitude, center_longitude, status)
VALUES
  (
    'a0000001-0000-0000-0000-000000000001',
    'Z01',
    'Zone 01 Â· Ramkund Ghat',
    'Ramkund Riverfront',
    'Primary ritual bathing concourse and spiritual core of the Nashik Kumbh.',
    ST_GeomFromText('POLYGON((73.7850 20.0100, 73.8000 20.0080, 73.7980 19.9980, 73.7830 20.0000, 73.7850 20.0100))', 4326),
    20.0075, 73.7915,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000002',
    'Z02',
    'Zone 02 Â· Kushavarta Kund',
    'Trimbakeshwar Inner Ring',
    'Sacred spring kund where the river Godavari re-emerges; main dip for Dashanami sadhus.',
    ST_GeomFromText('POLYGON((73.7800 19.9950, 73.7950 19.9930, 73.7930 19.9800, 73.7780 19.9820, 73.7800 19.9950))', 4326),
    19.9320, 73.5300,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000003',
    'Z03',
    'Zone 03 Â· Tapovan Staging',
    'Tapovan East Corridor',
    'Vast staging arena, holding ground, and primary ingress hub for incoming pilgrims.',
    ST_GeomFromText('POLYGON((73.8050 20.0150, 73.8300 20.0120, 73.8250 19.9900, 73.8000 19.9950, 73.8050 20.0150))', 4326),
    20.0035, 73.8150,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000004',
    'Z04',
    'Zone 04 Â· Panchavati Temple',
    'Panchavati Historic Belt',
    'Historic temple precinct north of Ramkund featuring Kalaram Mandir and Sita Gufa.',
    ST_GeomFromText('POLYGON((73.7900 20.0200, 73.8100 20.0180, 73.8080 20.0050, 73.7880 20.0070, 73.7900 20.0200))', 4326),
    20.0125, 73.7985,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000005',
    'Z05',
    'Zone 05 Â· Sadhugram Camp',
    'Sadhugram Sector B',
    'Akhara encampments, sadhu residential dormitories, and community bhandaras.',
    ST_GeomFromText('POLYGON((73.7950 20.0020, 73.8200 19.9990, 73.8180 19.9800, 73.7930 19.9830, 73.7950 20.0020))', 4326),
    19.9920, 73.8065,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000006',
    'Z06',
    'Zone 06 Â· Godavari Bridge',
    'Gadge Maharaj Riverwalk',
    'Key pedestrian river crossing connecting northern sacred ghats with southern transit.',
    ST_GeomFromText('POLYGON((73.7750 20.0020, 73.7900 20.0000, 73.7880 19.9880, 73.7730 19.9900, 73.7750 20.0020))', 4326),
    19.9960, 73.7815,
    'ACTIVE'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  area = EXCLUDED.area,
  description = EXCLUDED.description,
  geometry = EXCLUDED.geometry,
  center_latitude = EXCLUDED.center_latitude,
  center_longitude = EXCLUDED.center_longitude;

-- 2. KITCHENS MASTER (6 Key Community Kitchens / Annakshetras)
INSERT INTO public.kitchens (id, code, name, zone_id, operator, latitude, longitude, address, capacity, contact_person, contact_phone, status)
VALUES
  (
    'b0000001-0000-0000-0000-000000000001',
    'K01',
    'Shri Ram Annakshetra',
    'a0000001-0000-0000-0000-000000000001',
    'Ramkund Seva Trust',
    20.0075, 73.7915,
    'Ramkund Steps North, Plot 1',
    5000,
    'Pandit Vasant Shastri',
    '+91 98230 44101',
    'STABLE'
  ),
  (
    'b0000001-0000-0000-0000-000000000002',
    'K02',
    'Kushavarta Seva Bhandara',
    'a0000001-0000-0000-0000-000000000002',
    'Trimbak Devasthan Trust',
    19.9320, 73.5300,
    'Kushavarta South Gate Corridor',
    3500,
    'Ganesh Kulkarni',
    '+91 98230 44102',
    'CRITICAL'
  ),
  (
    'b0000001-0000-0000-0000-000000000003',
    'K03',
    'Tapovan Maha-Prasad',
    'a0000001-0000-0000-0000-000000000003',
    'Tapovan Ashram Samiti',
    20.0035, 73.8150,
    'Tapovan Ashram Road, Hall 2',
    6000,
    'Rameshwar Joshi',
    '+91 98230 44103',
    'STABLE'
  ),
  (
    'b0000001-0000-0000-0000-000000000004',
    'K04',
    'Panchavati Annadan',
    'a0000001-0000-0000-0000-000000000004',
    'Kalaram Sansthan',
    20.0125, 73.7985,
    'Kalaram West Chowk',
    4000,
    'Shrikant Joshi',
    '+91 98230 44104',
    'STABLE'
  ),
  (
    'b0000001-0000-0000-0000-000000000005',
    'K05',
    'Sadhugram Langar Seva',
    'a0000001-0000-0000-0000-000000000005',
    'Akhil Bharatiya Akhara Parishad',
    19.9920, 73.8065,
    'Sadhugram Sector B, Camp 4',
    5500,
    'Swami Nityanand',
    '+91 98230 44105',
    'WARNING'
  ),
  (
    'b0000001-0000-0000-0000-000000000006',
    'K06',
    'Godavari Sangam Kitchen',
    'a0000001-0000-0000-0000-000000000006',
    'Sant Gadge Baba Trust',
    19.9960, 73.7815,
    'Gadge Maharaj Bridge Approach',
    3000,
    'Babanrao Shinde',
    '+91 98230 44106',
    'WARNING'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  operator = EXCLUDED.operator,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  capacity = EXCLUDED.capacity,
  status = EXCLUDED.status;

-- 3. PARKING MASTER (4 Strategic Parking Terminals)
INSERT INTO public.parking (id, code, name, zone_id, latitude, longitude, capacity, parking_type, nearest_ghat, walking_km, walking_minutes, status)
VALUES
  (
    'c0000001-0000-0000-0000-000000000001',
    'P01',
    'Tapovan Outer Terminus',
    'a0000001-0000-0000-0000-000000000003',
    20.0090, 73.8150,
    8000,
    'GENERAL',
    'Tapovan Feeder Ghat',
    1.8,
    24,
    'OPEN'
  ),
  (
    'c0000001-0000-0000-0000-000000000002',
    'P02',
    'Trimbak Highway Staging Ground',
    'a0000001-0000-0000-0000-000000000002',
    19.9350, 73.5350,
    6000,
    'HEAVY_VEHICLE',
    'Kushavarta Ghat',
    1.5,
    20,
    'OPEN'
  ),
  (
    'c0000001-0000-0000-0000-000000000003',
    'P03',
    'Sadhugram North Staging',
    'a0000001-0000-0000-0000-000000000005',
    19.9980, 73.8050,
    5000,
    'GENERAL',
    'Lakshman Ghat',
    2.1,
    28,
    'OPEN'
  ),
  (
    'c0000001-0000-0000-0000-000000000004',
    'P04',
    'Panchavati Feeder Parking',
    'a0000001-0000-0000-0000-000000000004',
    20.0110, 73.7990,
    4000,
    'GENERAL',
    'Ramkund Ghat Access',
    0.9,
    12,
    'OPEN'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity,
  walking_km = EXCLUDED.walking_km,
  walking_minutes = EXCLUDED.walking_minutes,
  status = EXCLUDED.status;

-- 4. CIVIC FACILITIES MASTER (6 Essential Stations)
INSERT INTO public.facilities (id, code, name, zone_id, type, latitude, longitude, capacity, accessible, status)
VALUES
  ('d0000001-0000-0000-0000-000000000001', 'M01', 'Emergency Medical Post M01', 'a0000001-0000-0000-0000-000000000001', 'MEDICAL', 20.0078, 73.7920, 25, true, 'OPEN'),
  ('d0000001-0000-0000-0000-000000000002', 'M02', 'Tapovan Field Hospital M02', 'a0000001-0000-0000-0000-000000000003', 'MEDICAL', 20.0040, 73.8160, 50, true, 'OPEN'),
  ('d0000001-0000-0000-0000-000000000003', 'T01', 'Sanitation Block T01 (Ramkund)', 'a0000001-0000-0000-0000-000000000001', 'TOILET', 20.0070, 73.7910, 50, true, 'NEEDS_ATTENTION'),
  ('d0000001-0000-0000-0000-000000000004', 'T02', 'Sanitation Complex T02 (Kushavarta)', 'a0000001-0000-0000-0000-000000000002', 'TOILET', 19.9325, 73.5310, 40, true, 'OPEN'),
  ('d0000001-0000-0000-0000-000000000005', 'W01', 'Filtered Water Kiosk W01', 'a0000001-0000-0000-0000-000000000004', 'WATER', 20.0120, 73.7980, 30, true, 'OPEN'),
  ('d0000001-0000-0000-0000-000000000006', 'W02', 'High-Capacity Water Point W02', 'a0000001-0000-0000-0000-000000000005', 'WATER', 19.9930, 73.8070, 40, true, 'OPEN')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  capacity = EXCLUDED.capacity,
  accessible = EXCLUDED.accessible,
  status = EXCLUDED.status;

-- 5. ROUTES MASTER (4 Vital Pilgrim Corridors)
INSERT INTO public.routes (id, code, name, from_zone_id, to_zone_id, from_name, to_name, distance_km, walking_minutes, status, geometry)
VALUES
  (
    'e0000001-0000-0000-0000-000000000001',
    'R01',
    'Tapovan to Ramkund Main Concourse',
    'a0000001-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000001',
    'Tapovan Staging',
    'Ramkund Ghat',
    2.1,
    26,
    'RECOMMENDED',
    ST_GeomFromText('LINESTRING(73.8150 20.0035, 73.8050 20.0050, 73.7915 20.0075)', 4326)
  ),
  (
    'e0000001-0000-0000-0000-000000000002',
    'R02',
    'Ramkund to Panchavati Corridor',
    'a0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    'Ramkund Ghat',
    'Panchavati Temple',
    0.9,
    12,
    'CONGESTED',
    ST_GeomFromText('LINESTRING(73.7915 20.0075, 73.7950 20.0100, 73.7985 20.0125)', 4326)
  ),
  (
    'e0000001-0000-0000-0000-000000000003',
    'R03',
    'Godavari Bridge Riverwalk',
    'a0000001-0000-0000-0000-000000000006',
    'a0000001-0000-0000-0000-000000000001',
    'Godavari Bridge',
    'Ramkund Ghat',
    1.2,
    15,
    'RECOMMENDED',
    ST_GeomFromText('LINESTRING(73.7815 19.9960, 73.7860 20.0010, 73.7915 20.0075)', 4326)
  ),
  (
    'e0000001-0000-0000-0000-000000000004',
    'R04',
    'Trimbakeshwar Inner Parikrama',
    'a0000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000002',
    'Kushavarta Kund',
    'Trimbak East Gate',
    1.4,
    18,
    'NORMAL',
    ST_GeomFromText('LINESTRING(73.5300 19.9320, 73.5330 19.9340, 73.5350 19.9350)', 4326)
  ),
  (
    'e0000001-0000-0000-0000-000000000017',
    'R17',
    'R17 Direct Ghat Link',
    'a0000001-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000001',
    'Tapovan Staging',
    'Ramkund Ghat',
    1.6,
    20,
    'CONGESTED',
    ST_GeomFromText('LINESTRING(73.8150 20.0035, 73.8050 20.0050, 73.7915 20.0075)', 4326)
  ),
  (
    'e0000001-0000-0000-0000-000000000018',
    'R18',
    'R18 Bypass Corridor',
    'a0000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    'Ramkund Ghat',
    'Panchavati Temple',
    1.1,
    14,
    'RECOMMENDED',
    ST_GeomFromText('LINESTRING(73.7915 20.0075, 73.7950 20.0100, 73.7985 20.0125)', 4326)
  ),
  (
    'e0000001-0000-0000-0000-000000000021',
    'R21',
    'R21 Godavari Bridge Link',
    'a0000001-0000-0000-0000-000000000006',
    'a0000001-0000-0000-0000-000000000001',
    'Godavari Bridge',
    'Ramkund Ghat',
    1.5,
    19,
    'RECOMMENDED',
    ST_GeomFromText('LINESTRING(73.7815 19.9960, 73.7860 20.0010, 73.7915 20.0075)', 4326)
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  distance_km = EXCLUDED.distance_km,
  walking_minutes = EXCLUDED.walking_minutes,
  status = EXCLUDED.status;

-- 6. CULTURAL PLACES MASTER (3 Historic Places)
INSERT INTO public.places (id, code, name, category, zone_id, latitude, longitude, short_description, historical_significance, sixty_second_story, cultural_context, visitor_information, published)
VALUES
  (
    'f0000001-0000-0000-0000-000000000001',
    'PL-RAMKUND',
    'Ramkund',
    'GHAT',
    'a0000001-0000-0000-0000-000000000001',
    20.0075, 73.7915,
    'Principal bathing kund on the sacred Godavari, the spiritual epicenter of the Nashik Kumbh.',
    'Believed to be where Lord Rama bathed during exile. Pilgrims have offered prayers here for centuries.',
    'At dawn, the Godavari reflects the morning aarti lamps. Devotees offer arghya facing the rising sun.',
    'Asthi Vilay Tirth: Sacred immersion point drawing millions from across Maharashtra and India.',
    'Open 04:00 to 22:00. Peak hours 05:00 - 08:00. Changing rooms on the north terrace.',
    true
  ),
  (
    'f0000001-0000-0000-0000-000000000002',
    'PL-KUSHAVARTA',
    'Kushavarta Kund',
    'GHAT',
    'a0000001-0000-0000-0000-000000000002',
    19.9320, 73.5300,
    'Sacred spring tank at Trimbakeshwar where the holy river Godavari re-emerges.',
    'Associated with Sage Gautama who penned the river with Darbha grass to absolve sin.',
    'Surrounded by stone cloisters where sadhus perform morning meditation before taking the ritual bath.',
    'Starting point of the Trimbakeshwar parikrama and the ritual bath of Dashanami Sanyasis.',
    'Open 04:30 to 21:00. Deep tank, designated bathing enclosures only.',
    true
  ),
  (
    'f0000001-0000-0000-0000-000000000003',
    'PL-KALARAM',
    'Kalaram Mandir',
    'TEMPLE',
    'a0000001-0000-0000-0000-000000000004',
    20.0125, 73.7985,
    'Historic black-stone temple built in 1792, landmark of sacred Panchavati.',
    'Built from Ramshej black basalt. Site of Dr. B.R. Ambedkar historic temple entry satyagraha in 1930.',
    'Eighty-four massive stone pillars support the sabha mandap, interlocking without mortar.',
    'Seat of continuous Rama-nam japa recited daily since the 18th century.',
    'Darshan 05:00 to 22:00. Photography strictly restricted inside the sanctum.',
    true
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  short_description = EXCLUDED.short_description,
  historical_significance = EXCLUDED.historical_significance,
  sixty_second_story = EXCLUDED.sixty_second_story,
  published = EXCLUDED.published;

-- 7. EVENTS MASTER (2 Shahi Snans)
INSERT INTO public.events (id, code, name, date, start_time, peak_time, end_time, expected_crowd, affected_zones, published, notes, status)
VALUES
  (
    '10000001-0000-0000-0000-000000000001',
    'EV-SHAHI-01',
    'First Shahi Snan',
    '2027-08-14',
    '03:30:00',
    '05:45:00',
    '12:00:00',
    1800000,
    ARRAY['Z01', 'Z02', 'Z06'],
    true,
    'Royal procession of Akharas begins 03:00 from Tapovan. Strict perimeter security along feeder roads.',
    'SCHEDULED'
  ),
  (
    '10000001-0000-0000-0000-000000000002',
    'EV-AARTI-01',
    'Maha Godavari Deepotsav & Aarti',
    '2027-08-15',
    '18:30:00',
    '19:15:00',
    '20:30:00',
    350000,
    ARRAY['Z01', 'Z04'],
    true,
    'Evening lamp offering along Ramkund ghats. Deep-dan boat movement suspended between 18:00 and 20:30.',
    'SCHEDULED'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  date = EXCLUDED.date,
  expected_crowd = EXCLUDED.expected_crowd,
  status = EXCLUDED.status;

-- 8. ADVISORIES MASTER (3 Concise, Actionable Advisories)
INSERT INTO public.advisories (id, code, title, message, type, severity, audience, zone_id, state, verified, verification_source)
VALUES
  (
    '20000001-0000-0000-0000-000000000001',
    'ADV-101',
    'Ramkund Ghat Surge Advisory',
    'Ramkund has reached peak capacity. Devotees are advised to divert to Tapovan Ghat or Lakshman Ghat.',
    'CROWD',
    'HIGH',
    ARRAY['PILGRIM', 'VOLUNTEER', 'ADMIN'],
    'a0000001-0000-0000-0000-000000000001',
    'ACTIVE',
    true,
    'Crowd Command Room'
  ),
  (
    '20000001-0000-0000-0000-000000000002',
    'ADV-102',
    'Panchavati Parking P04 at 96% Capacity',
    'P04 is nearly full. Incoming vehicular traffic is being re-routed to Tapovan Outer Terminus P01.',
    'TRAFFIC',
    'WARNING',
    ARRAY['PILGRIM', 'ADMIN'],
    'a0000001-0000-0000-0000-000000000004',
    'ACTIVE',
    true,
    'Traffic Police Control'
  ),
  (
    '20000001-0000-0000-0000-000000000003',
    'ADV-103',
    'Urgent Meal Requisition at Kushavarta K02',
    'Kushavarta Bhandara requires 350 evening meals immediately. Central dispatch team mobilized.',
    'FOOD',
    'CRITICAL',
    ARRAY['VOLUNTEER', 'ADMIN'],
    'a0000001-0000-0000-0000-000000000002',
    'ACTIVE',
    true,
    'Food Supply Cell'
  ),
  (
    '20000001-0000-0000-0000-000000000004',
    'ADV-104',
    'Route R17 Temporarily Restricted â€” Police Notice',
    'High crowd pressure observed. Route R17 is temporarily restricted per Police Order #KM-2026/891. Please use R18 or R21.',
    'ROUTE',
    'HIGH',
    ARRAY['PILGRIM', 'ADMIN'],
    'a0000001-0000-0000-0000-000000000001',
    'ACTIVE',
    true,
    'Superintendent of Police, Nashik'
  )
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  severity = EXCLUDED.severity,
  state = EXCLUDED.state;

-- 9. SHORTAGES MASTER (2 Verified Deficits)
INSERT INTO public.shortages (id, code, kitchen_id, zone_id, meals_required, severity, verification, cost_per_meal, funds_raised, target_funds, verified_by, verification_notes)
VALUES
  (
    '30000001-0000-0000-0000-000000000001',
    'SH-01',
    'b0000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000002',
    350,
    'CRITICAL',
    'VERIFIED',
    35.00,
    5250.00,
    12250.00,
    'Coord. Rajesh More',
    'Afternoon sadhu influx exceeded reserve buffer. Field dispatch in transit.'
  ),
  (
    '30000001-0000-0000-0000-000000000002',
    'SH-02',
    'b0000001-0000-0000-0000-000000000006',
    'a0000001-0000-0000-0000-000000000006',
    120,
    'WARNING',
    'PENDING',
    25.00,
    0.00,
    3000.00,
    'Coord. Nitin Pawar',
    'Reported by bridge runner; volunteer physical count in progress.'
  )
ON CONFLICT (code) DO UPDATE SET
  meals_required = EXCLUDED.meals_required,
  severity = EXCLUDED.severity,
  verification = EXCLUDED.verification,
  funds_raised = EXCLUDED.funds_raised;

-- 10. OPERATIONAL OBSERVATIONS (Time-Series State, source = 'DEMO')

-- 10.1 Crowd Observations
INSERT INTO public.crowd_observations (zone_id, crowd_level, density_score, estimated_people, trend, confidence, observed_at, source, verified)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'PEAK', 0.94, 2850, 'INCREASING', 'HIGH', NOW() - INTERVAL '1 minute', 'DEMO', true),
  ('a0000001-0000-0000-0000-000000000002', 'HIGH', 0.82, 2100, 'INCREASING', 'HIGH', NOW() - INTERVAL '2 minutes', 'DEMO', true),
  ('a0000001-0000-0000-0000-000000000003', 'MODERATE', 0.52, 1650, 'STABLE', 'HIGH', NOW() - INTERVAL '3 minutes', 'DEMO', true),
  ('a0000001-0000-0000-0000-000000000004', 'MODERATE', 0.58, 1420, 'INCREASING', 'HIGH', NOW() - INTERVAL '2 minutes', 'DEMO', true),
  ('a0000001-0000-0000-0000-000000000005', 'MODERATE', 0.48, 1380, 'STABLE', 'MEDIUM', NOW() - INTERVAL '5 minutes', 'DEMO', true),
  ('a0000001-0000-0000-0000-000000000006', 'HIGH', 0.76, 1520, 'STABLE', 'MEDIUM', NOW() - INTERVAL '4 minutes', 'DEMO', true);

-- 10.2 Food Observations
INSERT INTO public.food_observations (kitchen_id, food_item, meals_available, estimated_demand, availability, reference_price, observed_price, queue_minutes, status, observed_at, source, verified)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Maha-Prasad Khichdi', 3400, 3100, 'AVAILABLE', 0.00, 0.00, 4, 'STABLE', NOW() - INTERVAL '3 minutes', 'DEMO', true),
  ('b0000001-0000-0000-0000-000000000002', 'Puri Bhaji / Khichdi', 850, 1200, 'LIMITED', 0.00, 0.00, 22, 'CRITICAL', NOW() - INTERVAL '2 minutes', 'DEMO', true),
  ('b0000001-0000-0000-0000-000000000003', 'Tapovan Bhojan Thali', 4200, 3900, 'AVAILABLE', 30.00, 30.00, 6, 'STABLE', NOW() - INTERVAL '5 minutes', 'DEMO', true),
  ('b0000001-0000-0000-0000-000000000004', 'Annadan Khichdi', 2800, 2500, 'AVAILABLE', 0.00, 0.00, 5, 'STABLE', NOW() - INTERVAL '4 minutes', 'DEMO', true),
  ('b0000001-0000-0000-0000-000000000005', 'Sadhu Langar Thali', 2100, 2500, 'LIMITED', 0.00, 0.00, 14, 'WARNING', NOW() - INTERVAL '6 minutes', 'DEMO', true),
  ('b0000001-0000-0000-0000-000000000006', 'Roti Dal Sabji', 1100, 1400, 'LIMITED', 25.00, 25.00, 12, 'WARNING', NOW() - INTERVAL '8 minutes', 'DEMO', true);

-- 10.3 Parking Observations
INSERT INTO public.parking_observations (parking_id, available_spaces, occupied_spaces, occupancy_percent, queue_minutes, trend, status, observed_at, source, verified)
VALUES
  ('c0000001-0000-0000-0000-000000000001', 3600, 4400, 55, 3, 'STABLE', 'AVAILABLE', NOW() - INTERVAL '3 minutes', 'DEMO', true),
  ('c0000001-0000-0000-0000-000000000002', 2700, 3300, 55, 4, 'STABLE', 'AVAILABLE', NOW() - INTERVAL '4 minutes', 'DEMO', true),
  ('c0000001-0000-0000-0000-000000000003', 1100, 3900, 78, 10, 'INCREASING', 'LIMITED', NOW() - INTERVAL '5 minutes', 'DEMO', true),
  ('c0000001-0000-0000-0000-000000000004', 160, 3840, 96, 18, 'INCREASING', 'LIMITED', NOW() - INTERVAL '1 minute', 'DEMO', true);

-- 10.4 Facility Observations
INSERT INTO public.facility_observations (facility_id, status, queue_level, wait_minutes, working_status, observed_at, source, verified)
VALUES
  ('d0000001-0000-0000-0000-000000000001', 'OPEN', 'LOW', 2, 'OPERATIONAL', NOW() - INTERVAL '2 minutes', 'DEMO', true),
  ('d0000001-0000-0000-0000-000000000002', 'OPEN', 'LOW', 5, 'OPERATIONAL', NOW() - INTERVAL '4 minutes', 'DEMO', true),
  ('d0000001-0000-0000-0000-000000000003', 'NEEDS_ATTENTION', 'HIGH', 10, 'WATER_PRESSURE_LOW', NOW() - INTERVAL '3 minutes', 'DEMO', true),
  ('d0000001-0000-0000-0000-000000000004', 'OPEN', 'LOW', 3, 'OPERATIONAL', NOW() - INTERVAL '5 minutes', 'DEMO', true),
  ('d0000001-0000-0000-0000-000000000005', 'OPEN', 'LOW', 1, 'OPERATIONAL', NOW() - INTERVAL '2 minutes', 'DEMO', true),
  ('d0000001-0000-0000-0000-000000000006', 'OPEN', 'LOW', 2, 'OPERATIONAL', NOW() - INTERVAL '3 minutes', 'DEMO', true);

-- 10.5 Route Observations
INSERT INTO public.route_observations (route_id, status, crowd_level, walking_minutes, observed_at, source, verified)
VALUES
  ('e0000001-0000-0000-0000-000000000001', 'RECOMMENDED', 'MODERATE', 26, NOW() - INTERVAL '3 minutes', 'DEMO', true),
  ('e0000001-0000-0000-0000-000000000002', 'CONGESTED', 'HIGH', 18, NOW() - INTERVAL '2 minutes', 'DEMO', true),
  ('e0000001-0000-0000-0000-000000000003', 'RECOMMENDED', 'MODERATE', 15, NOW() - INTERVAL '4 minutes', 'DEMO', true),
  ('e0000001-0000-0000-0000-000000000004', 'NORMAL', 'HIGH', 18, NOW() - INTERVAL '5 minutes', 'DEMO', true);

-- 11. VOLUNTEERS (3 Active Marshals)
INSERT INTO public.volunteers (code, name, zone_id, status, assignment, latitude, longitude)
VALUES
  ('V01', 'Aarav Deshmukh', 'a0000001-0000-0000-0000-000000000001', 'ASSIGNED', 'Ramkund North Steps Queue Control', 20.0075, 73.7915),
  ('V02', 'Priya Kulkarni', 'a0000001-0000-0000-0000-000000000002', 'ASSIGNED', 'Kushavarta Supply & Shortage Verification', 19.9320, 73.5300),
  ('V03', 'Suresh Gokhale', 'a0000001-0000-0000-0000-000000000003', 'AVAILABLE', 'Tapovan Staging & Ingress Assistance', 20.0035, 73.8150)
ON CONFLICT (code) DO NOTHING;

-- 12. AUDIT TRAIL
INSERT INTO public.audit_entries (actor, role, module, object_id, action, severity, reason)
VALUES
  ('System Seeder', 'Super Admin', 'Database', 'PRAVAH-DB', 'INITIALIZE_SCHEMA', 'INFO', 'Initialized concise PRAVAH operational foundation.'),
  ('Command Center', 'Operations Head', 'Crowd', 'Z01', 'OVERRIDE_STATUS', 'WARNING', 'Zone 01 flagged as PEAK based on entrance turnstiles.'),
  ('Rajesh More', 'Volunteer Coordinator', 'Food', 'SH-01', 'FLAG_SHORTAGE', 'WARNING', 'Flagged critical meal deficit at K02 Kushavarta.');

-- ====================================================================
-- 13. GUIDANCE RULES (5 Standard Thresholds)
-- ====================================================================
INSERT INTO public.guidance_rules (id, code, name, module, condition_metric, operator, threshold_value, duration_seconds, action_type, severity, description, enabled)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'CROWD_HIGH_80', 'Crowd Density > 80%', 'CROWD', 'density_percent', '>', 80.00, 0, 'GENERATE_WARNING', 'WARNING', 'Generate a warning when zone crowd density exceeds 80% capacity.', true),
  ('b0000001-0000-0000-0000-000000000002', 'CROWD_PEAK_90_5M', 'Sustained Peak > 90% for 5 min', 'CROWD', 'density_percent', '>', 90.00, 300, 'RECOMMEND_ALTERNATE', 'HIGH', 'Recommend alternate routes/zones when density exceeds 90% sustained for 5 minutes.', true),
  ('b0000001-0000-0000-0000-000000000003', 'PARKING_SAT_90', 'Parking Occupancy > 90%', 'PARKING', 'occupancy_percent', '>', 90.00, 0, 'RECOMMEND_ALTERNATE', 'WARNING', 'Recommend alternate parking when lot exceeds 90% occupancy.', true),
  ('b0000001-0000-0000-0000-000000000004', 'TOILET_QUEUE_10M', 'Toilet Queue Wait > 10 min', 'FACILITY', 'wait_minutes', '>', 10.00, 0, 'RECOMMEND_ALTERNATE', 'WARNING', 'Recommend alternate sanitation facilities when queue wait exceeds 10 minutes.', true),
  ('b0000001-0000-0000-0000-000000000005', 'ROUTE_RESTRICTED', 'Route Officially Restricted', 'ROUTE', 'route_status', '=', 0.00, 0, 'NEVER_RECOMMEND', 'CRITICAL', 'Never recommend routes that are officially closed or restricted by verified authority.', true);

-- ====================================================================
-- 14. AUTOMATED GUIDANCE (3 Active Engine Outputs)
-- ====================================================================
INSERT INTO public.automated_guidance (id, code, rule_id, source_module, entity_type, entity_id, title, guidance_text, reason, recommended_action, status, confidence, severity, metric_snapshot, zone_id)
VALUES
  (
    'c0000001-0000-0000-0000-000000000001',
    'AG_CROWD_Z01_PEAK',
    'b0000001-0000-0000-0000-000000000002',
    'CROWD', 'ZONE', 'Z01',
    'Ramkund Ghat crowd exceeds 90% â€” recommend diversion',
    'Zone Z01 (Ramkund Ghat) has exceeded 90% density for over 5 minutes. Pilgrims are advised to proceed to Tapovan Staging (Z03) or use alternate Route R03 via Godavari Bridge.',
    'density_percent = 95% sustained for 8 minutes (threshold: >90% for 5 min).',
    'Divert foot traffic to Z03 via Route R03. Deploy additional marshals to Z01 north steps.',
    'ACTIVE', 'HIGH', 'HIGH',
    '{"density_percent": 95, "sustained_minutes": 8, "pilgrims": 2850}',
    'Z01'
  ),
  (
    'c0000001-0000-0000-0000-000000000002',
    'AG_PARKING_P04_SAT',
    'b0000001-0000-0000-0000-000000000003',
    'PARKING', 'PARKING', 'P04',
    'Panchavati Parking P04 at 96% â€” redirect to P01',
    'Parking lot P04 (Panchavati Feeder) has reached 96% occupancy. Incoming vehicles should be redirected to Tapovan Outer Terminus (P01) which has 45% availability.',
    'occupancy_percent = 96% (threshold: >90%).',
    'Activate traffic diversion signs on NH-3 approach. Redirect to P01 Tapovan Outer Terminus.',
    'ACTIVE', 'HIGH', 'WARNING',
    '{"occupancy_percent": 96, "available_spaces": 160, "capacity": 4000}',
    'Z04'
  ),
  (
    'c0000001-0000-0000-0000-000000000003',
    'AG_TOILET_T01_QUEUE',
    'b0000001-0000-0000-0000-000000000004',
    'FACILITY', 'FACILITY', 'T01',
    'Ramkund Sanitation T01 queue at 10 min â€” redirect to T02',
    'Sanitation Block T01 at Ramkund currently has a 10-minute wait queue. Nearby Sanitation Complex T02 at Kushavarta has only 3 minutes wait.',
    'wait_minutes = 10 (threshold: >10 min).',
    'Direct pilgrims to T02 Kushavarta (3 min wait). Deploy cleaning crew to T01.',
    'ACTIVE', 'HIGH', 'WARNING',
    '{"wait_minutes": 10, "queue_level": "HIGH"}',
    'Z01'
  );

-- ====================================================================
-- 15. GUIDANCE OVERRIDES (2 Active Tactical Overrides)
-- ====================================================================
INSERT INTO public.guidance_overrides (id, code, entity_type, entity_id, override_type, reason, authorized_by, authority_role, active, zone_id, expires_at)
VALUES
  (
    'd0000001-0000-0000-0000-000000000001',
    'OVR_ROUTE_R02_RESTRICT',
    'ROUTE', 'R02',
    'FORCE_CLOSE',
    'VIP procession scheduled through Panchavati corridor. Route R02 restricted per Police Order #KM-2027/456.',
    'SP Vikram Patil',
    'Superintendent of Police, Nashik',
    true, 'Z04',
    NOW() + INTERVAL '4 hours'
  ),
  (
    'd0000001-0000-0000-0000-000000000002',
    'OVR_SUPPRESS_Z05',
    'ZONE', 'Z05',
    'SUPPRESS_AUTO_GUIDANCE',
    'Sadhugram Camp is under scheduled maintenance. Auto guidance suppressed to prevent false alerts during camp restructuring.',
    'Anjali Rane',
    'Super Admin, Kumbh Operations',
    true, 'Z05',
    NOW() + INTERVAL '2 hours'
  );
