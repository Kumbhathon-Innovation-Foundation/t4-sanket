# Anubhav — Smart Assistance Architecture

## 1. Purpose

Anubhav Smart Assistance helps pilgrims make better decisions during their Kumbh journey.

It should not behave like a generic chatbot.

The assistant should combine:

- User intent
- Current location
- Time
- Crowd conditions
- Parking availability
- Routes
- Food availability
- Facility conditions
- Places
- Events

to provide contextual recommendations.

---

# 2. Core Product Principle

## Better, not merely nearest.

The assistant should not simply answer:

> "What is nearest?"

It should answer:

> "What is the better option for your current situation?"

Examples:

- Not just nearest parking → easiest overall parking + journey
- Not just nearest food → food availability + queue + distance
- Not just nearest toilet → shortest practical wait
- Not just shortest route → safest/easiest available route
- Not just place information → relevant place information based on the pilgrim's context

---

# 3. Interfaces

The same intelligence backend should support:

```text
Pilgrim App
Pilgrim Web
KISKO
```

Architecture:

```text
                Smart Assistance Backend
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Pilgrim         Web           KISKO
```

KISKO must not create a separate intelligence system.

---

# 4. MVP Architecture

For the current MVP, use:

```text
Frontend
   ↓
FastAPI
   ↓
AI Orchestrator
   ↓
Domain Tools
   ↓
Supabase
   ↓
Operational Data
```

The LLM handles:

- Natural language understanding
- Intent detection
- Tool selection
- Conversational response
- Explanation

The backend handles:

- Data retrieval
- Spatial queries
- Business rules
- Journey scoring
- Operational calculations

The LLM must not invent operational conditions.

---

# 5. AI Orchestrator

The orchestrator receives the user's request.

Example:

> "I'm coming at 4 AM for darshan and snan. Where should I park?"

The orchestrator identifies:

```text
Intent:
Journey Planning

Time:
04:00

Activities:
Darshan + Snan

Goal:
Fast + Easy

Transport:
Car
```

It then calls the necessary tools.

---

# 6. Domain Tools

## Crowd

```text
get_crowd_status
get_crowd_near_location
get_crowd_forecast
```

## Parking

```text
find_nearby_parking
get_parking_status
compare_parking_options
```

## Food

```text
find_food_near_location
get_food_availability
get_food_queue
```

## Facilities

```text
find_nearby_facilities
get_facility_queue
get_facility_status
```

## Routes

```text
find_best_route
get_route_status
find_alternative_route
```

## Places

```text
get_place_information
find_nearby_places
```

## Events

```text
get_upcoming_events
get_event_impact
```

---

# 7. Journey Intelligence

The Journey Engine is the most important intelligence component.

Input example:

```json
{
  "origin": "current_location",
  "destination": "Ramkund",
  "arrival_time": "04:00",
  "activities": [
    "darshan",
    "snan"
  ],
  "objective": "fastest_easiest",
  "transport": "car"
}
```

The engine evaluates:

- Parking availability
- Parking distance
- Crowd conditions
- Destination crowd
- Route status
- Walking time
- Closures
- Event conditions

---

# 8. Journey Scoring

The backend should calculate the recommendation.

Conceptual scoring:

```text
journey_score =
    travel_time
  + crowd_penalty
  + parking_penalty
  + route_penalty
  + closure_penalty
  + uncertainty_penalty
```

The formula can evolve.

The important architectural rule is:

**The LLM should not independently calculate operational scores.**

The Journey Engine produces the recommendation.

The LLM explains it naturally.

---

# 9. Example Journey Flow

User:

> "I'm coming to Kumbh at 4 AM. Where should I park for darshan and snan?"

Flow:

```text
User
 ↓
FastAPI
 ↓
AI Orchestrator
 ↓
Intent: Journey Planning
 ↓
Parking Tool
Crowd Tool
Route Tool
Event Tool
 ↓
Journey Engine
 ↓
Candidate journeys
 ↓
Ranked result
 ↓
LLM
 ↓
Natural response
```

Example output:

> I recommend Parking P09. P04 is closer, but its occupancy is currently higher and the connecting route is more crowded. P09 has better availability and connects to a lower-crowd pedestrian route.

---

# 10. Food Assistance

User:

> "I'm hungry. Where can I get food nearby without waiting too long?"

Flow:

```text
Location
 ↓
PostGIS nearby search
 ↓
Food availability
 ↓
Queue
 ↓
Crowd
 ↓
Walking route
 ↓
Ranking
 ↓
AI response
```

The assistant should consider:

- Distance
- Food availability
- Queue
- Crowd
- Walking time

Example:

> Food Point F12 is about 650m away and currently has a low queue. F08 is closer, but its queue is significantly higher. I recommend F12.

---

# 11. Facility Assistance

Example:

> "Where is a toilet nearby with the shortest queue?"

The assistant compares:

```text
T08
280m
3 min

T12
350m
8 min

T19
420m
2 min
```

Recommendation:

T19 because the objective is shortest wait, not shortest distance.

---

# 12. Places & Cultural Experience

The assistant should support:

- Place information
- Historical context
- Cultural significance
- Visitor information

Example:

> "Tell me about this place."

The assistant retrieves curated place information from the Places data managed through the Admin system.

For the MVP, a full RAG/vector system is not required.

Use structured CMS data.

---

# 13. Live Data vs Knowledge

## Live operational information

Must come from operational data.

Examples:

- Current crowd
- Parking occupancy
- Food availability
- Facility queue
- Route status
- Current alerts

Source:

```text
Supabase
```

## Curated information

Examples:

- Place history
- Cultural descriptions
- Visitor information
- Kumbh information

Source:

```text
Places CMS / structured content
```

Do not treat live operational information as static knowledge.

---

# 14. Location Context

The assistant should accept location context.

Example:

```json
{
  "lat": 20.005,
  "lng": 73.789
}
```

The backend can use PostGIS to find nearby:

- Food
- Toilets
- Parking
- Medical facilities
- Help points
- Places
- Routes

---

# 15. Conversation Context

The assistant should maintain short-term session context.

Example:

User:

> I'm coming from Mumbai.

Then:

> Where should I park?

Then:

> What about food?

The assistant understands that the questions belong to the same journey.

Context can include:

- Current location
- Destination
- Arrival time
- Current journey
- Recent user intent
- Selected preferences

Do not create complicated long-term memory for the MVP.

---

# 16. Data Freshness

Operational answers should include freshness internally.

Each operational result should have:

```text
source
updated_at
confidence
```

Example:

```text
Crowd:
HIGH

Updated:
34 seconds ago

Confidence:
HIGH
```

If data is stale, the assistant should communicate uncertainty.

Example:

> Crowd information for this area was last updated 18 minutes ago, so conditions may have changed.

Never present stale data as live.

---

# 17. MVP Backend Structure

Recommended:

```text
backend/

app/

  api/
    chat.py
    journey.py

  ai/
    orchestrator.py
    intent.py
    prompts.py
    memory.py
    guardrails.py

  tools/
    crowd.py
    parking.py
    food.py
    facilities.py
    routes.py
    places.py
    events.py

  journey/
    planner.py
    scoring.py
    context.py

  services/
    crowd_service.py
    parking_service.py
    food_service.py
    facility_service.py
    route_service.py
    place_service.py

  models/

  db/
```

---

# 18. Technology

Recommended MVP stack:

```text
Frontend:
React + TypeScript

Backend:
Python + FastAPI

Database:
Supabase PostgreSQL

Geospatial:
PostGIS

Maps:
MapLibre

AI:
LLM with structured tool/function calling
```

---

# 19. What Is NOT Required for MVP

Do not over-engineer the first submission.

Not required initially:

- RAG pipeline
- Vector database
- Embedding infrastructure
- Fine-tuned LLM
- Custom crowd prediction model
- Multi-agent architecture
- Autonomous agents
- Complex long-term memory
- Production-scale distributed architecture

These can be future extensions.

---

# 20. KISKO Integration

KISKO uses the same Smart Assistance backend.

Flow:

```text
KISKO
 ↓
Smart Assistance API
 ↓
AI Orchestrator
 ↓
Tools
 ↓
Supabase
 ↓
Response
 ↓
KISKO
```

KISKO may additionally provide:

- Voice input
- Language selection
- Large visual responses
- Map directions
- Accessibility-oriented interaction

But the intelligence remains shared.

---

# 21. Example Smart Assistance Scenarios

### Scenario A — Journey

> "I'm arriving at 4 AM for darshan and snan. Where should I park?"

Uses:

Crowd + Parking + Routes + Events + Journey Engine

---

### Scenario B — Food

> "I'm hungry. Find food nearby with less waiting."

Uses:

Location + Food + Queue + Crowd + Route

---

### Scenario C — Toilet

> "Where is the nearest toilet with the shortest queue?"

Uses:

Location + Facilities + Queue + Route

---

### Scenario D — Crowd

> "What will the crowd be like around Ramkund at 4 AM?"

Uses:

Crowd + Time + Events

The answer should clearly communicate that this is an estimate if prediction data is not available.

---

### Scenario E — Place

> "Tell me about Ramkund."

Uses:

Places CMS

---

### Scenario F — Route Change

> "Why are you asking me to take this route?"

Uses:

Route + Crowd + Closure

The assistant explains the recommendation.

---

# 22. Core Product Differentiator

Anubhav is not:

**"Ask a chatbot about Kumbh."**

It is:

> **A context-aware pilgrim assistant that combines operational conditions to help pilgrims make better decisions during their journey.**

The same intelligence can be accessed through:

- Smartphone
- Web
- KISKO kiosk

This is the foundation for the future Journey Intelligence platform.