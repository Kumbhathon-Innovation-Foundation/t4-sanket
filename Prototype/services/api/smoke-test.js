process.env.NODE_ENV = 'test';
import app from './dist/server.js';
import http from 'http';

const PORT = 4099;
const server = http.createServer(app);

async function runSmokeTests() {
  console.log('🚀 Starting Kumbh Saathi Multi-Service Smoke Tests...\n');

  await new Promise((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'online', 'GET /health returns online status');

    // 2. Unauthenticated route status write blocked
    const unauthRes = await fetch(`${baseUrl}/api/admin/route-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route_id: 'R17', tier: 1 })
    });
    assert(unauthRes.status === 401, 'POST /api/admin/route-status without token returns 401 Unauthorized');

    // 3. Admin Login
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'pravah2026' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && Boolean(loginData.token), 'POST /api/admin/login returns valid JWT token', JSON.stringify(loginData));
    const token = loginData.token;

    // 4. Initial Routes Check (All Tier 4)
    const routesRes = await fetch(`${baseUrl}/api/routes`);
    const routesData = await routesRes.json();
    assert(routesData.routes.length === 3, 'GET /api/routes returns all 3 primary corridors');
    const r17Initial = routesData.routes.find((r) => r.route_id === 'R17');
    assert(r17Initial && r17Initial.tier === 4, 'R17 initially operating at Tier 4 (Normal)');

    // 5. Pilgrim Agent Query (Initial: Direct R17)
    const agentQ1 = await fetch(`${baseUrl}/api/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '४ बजे स्नान और दर्शन मार्ग', language: 'hi' })
    });
    const agentData1 = await agentQ1.json();
    assert(agentData1.route_data?.primary_route?.route_id === 'R17', 'Agent recommends direct riverside road (R17) for 4 AM under normal conditions');
    assert(agentData1.route_data?.is_diverted === false, 'Journey is not diverted initially');

    // 6. Admin Route Override (VIP Procession Emergency Closure)
    const overrideRes = await fetch(`${baseUrl}/api/admin/route-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        route_id: 'R17',
        tier: 1,
        crowd: 'surge',
        message_en: 'VIP Procession Emergency Closure',
        message_hi: 'वीआईपी काफिला: मुख्य नदी तट मार्ग बंद',
        message_mr: 'व्हीआयपी मिरवणूक: मुख्य मार्ग बंद'
      })
    });
    const overrideData = await overrideRes.json();
    assert(overrideRes.status === 200 && overrideData.route?.tier === 1, 'Authenticated POST /api/admin/route-status sets R17 to Tier 1');

    // 7. Pilgrim Agent Re-Query (Live Tactical Detour to R21)
    const agentQ2 = await fetch(`${baseUrl}/api/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '४ बजे स्नान और दर्शन मार्ग', language: 'hi' })
    });
    const agentData2 = await agentQ2.json();
    assert(agentData2.type === 'reroute', 'Agent detects emergency closure and triggers reroute');
    assert(agentData2.route_data?.primary_route?.route_id === 'R21', 'Agent dynamically diverts pilgrim to Panchavati Ghat (R21)');
    assert(agentData2.route_data?.is_diverted === true, 'route_data.is_diverted is true');

    // 8. Test 7 Agent Tools
    const [tLocations, tParking, tFacilities, tFood, tAdvisories, tSingleRoute] = await Promise.all([
      fetch(`${baseUrl}/api/locations`).then((r) => r.json()),
      fetch(`${baseUrl}/api/parking`).then((r) => r.json()),
      fetch(`${baseUrl}/api/facilities`).then((r) => r.json()),
      fetch(`${baseUrl}/api/food`).then((r) => r.json()),
      fetch(`${baseUrl}/api/advisories`).then((r) => r.json()),
      fetch(`${baseUrl}/api/routes/R17`).then((r) => r.json())
    ]);

    assert(tLocations.locations?.length >= 6, 'Tool 3: GET /api/locations returns all 6 Nashik coordinate points');
    assert(tParking.parking?.length >= 1, 'Tool 4: GET /api/parking returns parking lots');
    assert(tFacilities.facilities?.length >= 2, 'Tool 5: GET /api/facilities returns clean sanitation facilities');
    assert(tFood.food?.length >= 2, 'Tool 6: GET /api/food returns langar and thali spots');
    assert(tAdvisories.active_closures_count === 1, 'Tool 7: GET /api/advisories reports 1 active tactical closure (R17)');
    assert(tSingleRoute.route?.route_id === 'R17', 'Tool 2: GET /api/routes/:id returns specific route status');

    // 9. Reset All to Normal
    const resetRes = await fetch(`${baseUrl}/api/admin/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    assert(resetRes.status === 200, 'Authenticated POST /api/admin/reset restores all routes to normal');

    const routesAfterReset = await fetch(`${baseUrl}/api/routes`).then((r) => r.json());
    const r17After = routesAfterReset.routes.find((r) => r.route_id === 'R17');
    assert(r17After?.tier === 4, 'R17 verified back to Tier 4 (Normal) after reset');

  } catch (err) {
    console.error('Smoke test exception:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n=========================================`);
    console.log(`Smoke Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`=========================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runSmokeTests();
