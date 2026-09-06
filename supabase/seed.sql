-- ====================================================================
-- PRAVAH (Anubhav) — Deterministic SQL Seed Data
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
    'Zone 01 · Ramkund Ghat',
    'Ramkund Riverfront',
    'Primary ritual bathing concourse and spiritual core of the Nashik Kumbh.',
    ST_GeomFromText('POLYGON((73.7850 20.0100, 73.8000 20.0080, 73.7980 19.9980, 73.7830 20.0000, 73.7850 20.0100))', 4326),
    20.0075, 73.7915,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000002',
    'Z02',
    'Zone 02 · Kushavarta Kund',
    'Trimbakeshwar Inner Ring',
    'Sacred spring kund where the river Godavari re-emerges; main dip for Dashanami sadhus.',
    ST_GeomFromText('POLYGON((73.7800 19.9950, 73.7950 19.9930, 73.7930 19.9800, 73.7780 19.9820, 73.7800 19.9950))', 4326),
    19.9320, 73.5300,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000003',
    'Z03',
    'Zone 03 · Tapovan Staging',
    'Tapovan East Corridor',
    'Vast staging arena, holding ground, and primary ingress hub for incoming pilgrims.',
    ST_GeomFromText('POLYGON((73.8050 20.0150, 73.8300 20.0120, 73.8250 19.9900, 73.8000 19.9950, 73.8050 20.0150))', 4326),
    20.0035, 73.8150,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000004',
    'Z04',
    'Zone 04 · Panchavati Temple',
    'Panchavati Historic Belt',
    'Historic temple precinct north of Ramkund featuring Kalaram Mandir and Sita Gufa.',
    ST_GeomFromText('POLYGON((73.7900 20.0200, 73.8100 20.0180, 73.8080 20.0050, 73.7880 20.0070, 73.7900 20.0200))', 4326),
    20.0125, 73.7985,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000005',
    'Z05',
    'Zone 05 · Sadhugram Camp',
    'Sadhugram Sector B',
    'Akhara encampments, sadhu residential dormitories, and community bhandaras.',
    ST_GeomFromText('POLYGON((73.7950 20.0020, 73.8200 19.9990, 73.8180 19.9800, 73.7930 19.9830, 73.7950 20.0020))', 4326),
    19.9920, 73.8065,
    'ACTIVE'
  ),
  (
    'a0000001-0000-0000-0000-000000000006',
    'Z06',
    'Zone 06 · Godavari Bridge',
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
    'Route R17 Temporarily Restricted — Police Notice',
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
    'Ramkund Ghat crowd exceeds 90% — recommend diversion',
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
    'Panchavati Parking P04 at 96% — redirect to P01',
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
    'Ramkund Sanitation T01 queue at 10 min — redirect to T02',
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
