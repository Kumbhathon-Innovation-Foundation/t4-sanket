import { Router, Request, Response } from 'express';
import { db } from '../db.js';

export const toolsRouter = Router();

// Waypoint paths for realistic Leaflet map corridor rendering
const PRECOMPUTED_PATHS: Record<string, [number, number][]> = {
  R17: [
    [20.0061, 73.8102],
    [20.0065, 73.8065],
    [20.0072, 73.8015],
    [20.0078, 73.7968],
    [20.0082, 73.7942],
    [20.0085, 73.7925]
  ],
  R21: [
    [20.0061, 73.8102],
    [20.0082, 73.8080],
    [20.0095, 73.8020],
    [20.0098, 73.7950],
    [20.0083, 73.7914],
    [20.0085, 73.7925]
  ],
  R18: [
    [20.0061, 73.8102],
    [20.0040, 73.8115],
    [20.0020, 73.8120],
    [20.0000, 73.8124]
  ]
};

// 1. Tool 1: GET /api/routes - list all active route corridors with location enrichment
toolsRouter.get('/routes', async (_req: Request, res: Response) => {
  try {
    const [rawRoutes, locations] = await Promise.all([
      db.getRouteStatuses(),
      db.getLocations()
    ]);

    const locMap = new Map(locations.map((loc) => [loc.id, loc]));

    const enriched = rawRoutes.map((r) => {
      const fromLoc = locMap.get(r.from_location);
      const toLoc = locMap.get(r.to_location);
      const isClosed = r.tier === 1;

      return {
        route_id: r.route_id,
        name: r.route_id === 'R17'
          ? 'Modi Ground to Ramkund via Riverside Road'
          : r.route_id === 'R21'
          ? 'Modi Ground via Panchavati Ghat Diversion'
          : 'Modi Ground to Tapovan Ghat Bypass Corridor',
        name_hi: r.route_id === 'R17'
          ? 'मोदी मैदान से रामकुंड - मुख्य नदी तट मार्ग (R17)'
          : r.route_id === 'R21'
          ? 'पंचवटी घाट वैकल्पिक वळण मार्ग (R21)'
          : 'मोदी मैदान से तपोवन घाट बाईपास (R18)',
        name_mr: r.route_id === 'R17'
          ? 'मोदी मैदान ते रामकुंड - मुख्य नदीकाठ मार्ग (R17)'
          : r.route_id === 'R21'
          ? 'पंचवटी घाट पर्यायी वळण मार्ग (R21)'
          : 'तपोवन घाट बायपास (R18)',
        destination: toLoc ? toLoc.name : r.to_location,
        from_location: r.from_location,
        to_location: r.to_location,
        tier: r.tier,
        crowd: r.crowd,
        message_en: r.message_en || '',
        message_hi: r.message_hi || '',
        message_mr: r.message_mr || '',
        updated_by: r.updated_by || 'Police Traffic Control HQ',
        updated_at: r.updated_at,
        travel_time_min: isClosed ? 999 : r.tier === 2 ? 22 : 14,
        is_closed: isClosed,
        color_code: isClosed ? '#EF4444' : r.tier === 2 ? '#3B82F6' : r.tier === 3 ? '#F59E0B' : '#2F7A6B',
        closure_reason: isClosed ? (r.message_en || 'Tactical police emergency closure') : undefined,
        waypoints: PRECOMPUTED_PATHS[r.route_id] || []
      };
    });

    res.json({ routes: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve routes', details: String(error) });
  }
});

// 2. Tool 2: GET /api/routes/:id - get status of a single corridor
toolsRouter.get('/routes/:id', async (req: Request, res: Response) => {
  try {
    const route = await db.getRouteStatusById(req.params.id);
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }
    res.json({ route });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve route', details: String(error) });
  }
});

// 3. Tool 3: GET /api/locations - list all Nashik reference points
toolsRouter.get('/locations', async (_req: Request, res: Response) => {
  try {
    const locations = await db.getLocations();
    res.json({ locations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve locations', details: String(error) });
  }
});

// 4. Tool 4: GET /api/parking - parking lots & live availability
toolsRouter.get('/parking', async (_req: Request, res: Response) => {
  try {
    const parking = await db.getParking();
    res.json({
      parking: parking.map((p) => ({
        id: p.id,
        name: 'Modi Ground Parking (P09)',
        name_hi: 'मोदी मैदान वाहनतळ (P09)',
        name_mr: 'मोदी मैदान वाहनतळ (P09)',
        lat: 20.0061,
        lng: 73.8102,
        availability_pct: p.availability_pct,
        distance_to_ghat_m: 1350,
        recommended_for: ['R17', 'R21', 'R18'],
        status: p.availability_pct > 50 ? 'available' : 'filling_fast'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve parking', details: String(error) });
  }
});

// 5. Tool 5: GET /api/facilities - sanitation & clean toilets
toolsRouter.get('/facilities', async (_req: Request, res: Response) => {
  try {
    const facilities = await db.getFacilities();
    res.json({
      facilities: facilities.map((f) => ({
        id: f.id,
        name: f.id === 'FAC_1' ? 'Ramkund Ghat Block 2 Sanitation Complex' : 'Panchavati Ghat Mobile Sanitation Unit',
        name_hi: f.id === 'FAC_1' ? 'रामकुंड ब्लॉक २ स्वच्छ शौचालय' : 'पंचवटी घाट जनसुविधा',
        name_mr: f.id === 'FAC_1' ? 'रामकुंड ब्लॉक २ स्वच्छतागृह' : 'पंचवटी घाट जनसुविधा',
        lat: f.id === 'FAC_1' ? 20.0084 : 20.0082,
        lng: f.id === 'FAC_1' ? 73.7928 : 73.7918,
        type: f.type,
        status: f.status,
        distance_m: f.distance_m,
        queue_min: f.queue_min,
        last_verified_min_ago: 4,
        location_detail: f.id === 'FAC_1' ? 'Behind Ganga Mandir steps' : 'Near Panchavati Footbridge',
        location_detail_hi: f.id === 'FAC_1' ? 'गंगा मंदिर सीढ़ियों के पीछे' : 'पंचवटी फुटब्रिज के पास',
        location_detail_mr: f.id === 'FAC_1' ? 'गंगा मंदिराच्या पायऱ्यांमागे' : 'पंचवटी पादचारी पुलाजवळ',
        accessible: true
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve facilities', details: String(error) });
  }
});

// 6. Tool 6: GET /api/food - food spots & subsidized langar
toolsRouter.get('/food', async (_req: Request, res: Response) => {
  try {
    const food = await db.getFood();
    res.json({
      food: food.map((f) => ({
        id: f.id,
        name: f.id === 'FOOD_1' ? 'Sri Ram Seva Akhand Langar' : 'Godavari Trust Mahaprasad Kendra',
        name_hi: f.id === 'FOOD_1' ? 'श्री राम सेवा अखंड लंगर (निःशुल्क)' : 'गोदावरी ट्रस्ट महाप्रसाद केंद्र',
        name_mr: f.id === 'FOOD_1' ? 'श्री राम सेवा अखंड लंगर (मोफत)' : 'गोदावरी ट्रस्ट महाप्रसाद केंद्र',
        lat: f.id === 'FOOD_1' ? 20.0078 : 20.0086,
        lng: f.id === 'FOOD_1' ? 73.7940 : 73.7935,
        type: f.reference_price_inr === 0 ? 'free_langar' : 'subsidized_thali',
        distance_m: f.distance_m,
        queue_min: parseInt(f.queue) || 5,
        reference_price_inr: f.reference_price_inr,
        items_en: f.id === 'FOOD_1' ? 'Moong Khichdi, Kadhi, Sheera & Warm Tea (24x7)' : 'Satvik Thali: 4 Chapatis, Dal Tadka, Sabzi, Rice',
        items_hi: f.id === 'FOOD_1' ? 'मूंग खिचड़ी, कढ़ी, शीरा एवं चाय (२४ घंटे)' : 'सात्विक थाली: ४ रोटी, दाल, सब्जी, चावल',
        items_mr: f.id === 'FOOD_1' ? 'मूग खिचडी, कढी, शिरा आणि चहा (२४ तास)' : 'सात्विक थाळी: ४ पोळ्या, डाळ, भाजी, भात',
        last_verified_min_ago: 5
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve food spots', details: String(error) });
  }
});

// 7. Tool 7: GET /api/advisories - active tactical restrictions
toolsRouter.get('/advisories', async (_req: Request, res: Response) => {
  try {
    const routes = await db.getRouteStatuses();
    const active = routes.filter((r) => r.tier <= 2);
    res.json({
      advisories: active,
      active_closures_count: active.filter((r) => r.tier === 1).length,
      warning_count: active.filter((r) => r.tier === 2).length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve advisories', details: String(error) });
  }
});
