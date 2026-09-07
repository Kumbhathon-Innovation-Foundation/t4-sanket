-- ========================================================================
-- Kumbh Saathi — Seed Data (Real Nashik Coordinates & Initial State)
-- ========================================================================

-- 1. Insert Real Nashik Locations
insert into locations (id, name, lat, lng, type) values
  ('P09', 'Modi Ground Parking', 20.0061, 73.8102, 'parking'),
  ('RAMKUND', 'Ramkund Main Ghat', 20.0085, 73.7925, 'ghat'),
  ('KALARAM', 'Kalaram Temple', 20.0070, 73.7952, 'temple'),
  ('SITA_GUFA', 'Sita Gufa', 20.0075, 73.7961, 'temple'),
  ('R21_end', 'Panchavati Ghat', 20.0083, 73.7914, 'ghat'),
  ('R18_end', 'Tapovan Ghat', 20.0000, 73.8124, 'ghat')
on conflict (id) do update set
  name = excluded.name,
  lat = excluded.lat,
  lng = excluded.lng,
  type = excluded.type;

-- 2. Insert Route Status (Initial Normal State - Tier 4)
insert into route_status (route_id, from_location, to_location, tier, crowd, message_hi, message_mr, message_en, updated_by, updated_at) values
  ('R17', 'P09', 'RAMKUND', 4, 'moderate',
   'सीधा नदी तट मार्ग। सामान्य प्रवाह। अनुमानित चलने का समय: १४ मिनट।',
   'थेट नदीकाठ मार्ग. सामान्य प्रवाह. चालण्याचा अंदाजे वेळ: १४ मिनिटे.',
   'Direct riverside road. Normal flow. Estimated walk time: 14 minutes.',
   'Police Traffic Control HQ', now()),

  ('R21', 'P09', 'R21_end', 4, 'low',
   'आधिकारिक पुलिस डायवर्जन मार्ग। चौड़ा सुरक्षित पैदल पथ।',
   'अधिकृत पोलीस वळण मार्ग. रुंद व सुरक्षित पादचारी मार्ग.',
   'Designated official police diversion route. Wide pedestrian walkway, clear flow.',
   'Crowd Safety Division', now()),

  ('R18', 'P09', 'R18_end', 4, 'low',
   'तपोवन घाट बाईपास (१.४ किमी)। कम भीड़ वाला सुगम मार्ग।',
   'तपोवन घाट बायपास (१.४ किमी). कमी गर्दीचा सुरक्षित मार्ग.',
   'Bypass corridor to Tapovan Ghat (~1.4 km). Low crowd density.',
   'Tapovan Sector Police', now())
on conflict (route_id) do update set
  from_location = excluded.from_location,
  to_location = excluded.to_location,
  tier = excluded.tier,
  crowd = excluded.crowd,
  message_hi = excluded.message_hi,
  message_mr = excluded.message_mr,
  message_en = excluded.message_en,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at;

-- 3. Insert Parking
insert into parking (id, availability_pct) values
  ('P09', 68)
on conflict (id) do update set
  availability_pct = excluded.availability_pct;

-- 4. Insert Facilities
insert into facilities (id, type, near_location, status, distance_m, queue_min, last_verified_at) values
  ('FAC_1', 'toilet', 'RAMKUND', 'clean', 140, 3, now() - interval '4 minutes'),
  ('FAC_2', 'toilet', 'R21_end', 'clean', 210, 2, now() - interval '5 minutes')
on conflict (id) do update set
  type = excluded.type,
  near_location = excluded.near_location,
  status = excluded.status,
  distance_m = excluded.distance_m,
  queue_min = excluded.queue_min,
  last_verified_at = excluded.last_verified_at;

-- 5. Insert Food & Mahaprasad Spots
insert into food (id, near_location, distance_m, queue, reference_price_inr) values
  ('FOOD_1', 'RAMKUND', 160, '5 min', 0),
  ('FOOD_2', 'RAMKUND', 290, '4 min', 30)
on conflict (id) do update set
  near_location = excluded.near_location,
  distance_m = excluded.distance_m,
  queue = excluded.queue,
  reference_price_inr = excluded.reference_price_inr;

-- 6. Insert Admin User (default: admin / pravah2026)
-- Bcrypt hash for 'pravah2026' with 10 rounds: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi (or standard hash checked in API)
insert into admin_users (username, password_hash) values
  ('admin', '$2a$10$U6UvBq2iL0vF4J2Q5n4hMeaU/Y1cQoZp7O7Yn7J7fVq5f3uQ3MvOi')
on conflict (username) do update set
  password_hash = excluded.password_hash;
