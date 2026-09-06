# Anubhav 2.0 — Product Requirements Document

**Product:** Anubhav  
**Positioning:** Personal Kumbh Journey Companion  
**Track:** Pilgrim Experience — Kumbhathon Innovation S.P.R.I.N.T.  
**Primary interfaces:** Mobile Web/App, Pilgrim Web, KISKO Public Kiosk, Operations/Admin Console  
**MVP context:** Competition-ready demonstrator; designed to be buildable quickly, with clear upgrade paths.

---

## 1. Executive Summary

Anubhav is a **Personal Kumbh Journey Companion** that helps a pilgrim decide what to do, when to go, where to go, how to get there, what to avoid, and what to discover along the way.

The product is not intended to be a generic chatbot, static Kumbh information portal, or ordinary map application.

Its central idea is:

> **Tell Anubhav what you want to experience. It figures out the best way to experience it.**

A pilgrim can naturally say:

> “I'm coming at 4 AM with my parents. I have a car. I want Snan and Darshan and need to be back by 8.”

Anubhav converts that intent into a practical journey using available crowd, place, queue, parking, food, facility and timing information.

The same intelligence powers three experiences:

1. **Pilgrim:** plan and navigate a personalized Kumbh journey.
2. **KISKO:** provide the same assistance to pilgrims who do not have or do not want to use a smartphone.
3. **Operations/Admin:** manage places, food, parking, facilities, crowd reports, volunteers and live operational conditions.

The original Anubhav concept is retained: a shared zone-level crowd and supply intelligence layer supports both pilgrim decisions and food-resource coordination.

---

## 2. Problem Statement

Pilgrims at Kumbh can struggle with:

- finding food without entering overcrowded areas;
- choosing parking that makes the complete journey easier;
- knowing which Ghat or temple is less crowded;
- estimating how long Snan + Darshan + return will take;
- finding toilets, water, medical help and resting places;
- navigating through a large, changing crowd environment;
- understanding what important places they are passing;
- planning around a fixed arrival or return time;
- getting assistance when they do not have a smartphone.

At the operational level, administrators also need visibility into:

- zone-level crowd conditions;
- food supply and shortages;
- kitchen status;
- parking occupancy;
- facility availability;
- volunteer reports;
- verified operational alerts.

The underlying challenge is fragmented, changing information.

Anubhav creates a **shared intelligence layer** and turns that information into decisions and journeys.

---

## 3. Product Vision

### Vision

**Make every pilgrim's Kumbh experience easier, safer, more meaningful and more memorable.**

### Product Promise

> **Anubhav doesn't just tell pilgrims what exists. It tells them what they should do next.**

### Product Philosophy

**Better, not merely nearest.**

Examples:

- not the nearest food point, but the better food option considering crowd and wait;
- not the nearest toilet, but the one with the shorter expected queue;
- not the nearest parking, but the parking option that creates the easiest overall journey;
- not the shortest route, but the best route considering crowd and user constraints.

---

## 4. Goals

### Primary goals

1. Allow pilgrims to interact conversationally with Anubhav.
2. Convert natural-language intent into a structured journey.
3. Rank food, parking, temples, Ghats and facilities using crowd and context.
4. Provide crowd-aware route recommendations.
5. Support journey planning around time constraints.
6. Help pilgrims discover meaningful Kumbh places and stories.
7. Maintain a personal “My Kumbh” journey/memory.
8. Provide the same core experience through a KISKO public kiosk.
9. Give administrators one operational console to manage the ecosystem.
10. Preserve the original food-intelligence objective: connect verified food shortages with appropriate support.

### Secondary goals

- Make volunteer reporting extremely fast.
- Make kitchen stock updates possible in under 30 seconds.
- Support low-connectivity environments.
- Provide clear confidence/freshness information for live and estimated data.
- Build an architecture that can later accept CCTV/IoT/GPS data.

---

## 5. Non-Goals / Out of Scope for MVP

The following are future upgrades, not MVP dependencies:

- centimeter-accurate indoor GPS navigation;
- full Google Maps-equivalent turn-by-turn navigation;
- live CCTV/IoT crowd detection;
- ML-based demand prediction;
- production payment processing;
- full hotel/OTA marketplace;
- social network/community feed;
- complex public reviews;
- comprehensive emergency-response command infrastructure;
- full autonomous routing based on unavailable sensor data.

The MVP may use seeded/simulated data for demonstration, but the UI must distinguish:

- **Live**
- **Estimated**
- **Scheduled/known**
- **Simulated/demo**

---

# 6. Personas

## 6.1 Pilgrim

Needs:

- simple planning;
- crowd-aware recommendations;
- food;
- parking;
- Snan/Darshan planning;
- navigation;
- toilets/water/medical/help;
- cultural discovery;
- minimal cognitive load.

Example:

> “I have two hours. What can I do?”

---

## 6.2 Family / Elderly Companion

Needs:

- easier routes;
- less walking;
- lower crowd exposure;
- rest points;
- toilets;
- medical access;
- predictable return time.

Example:

> “I'm with my parents. Make the route easier.”

---

## 6.3 Kitchen Operator

Needs:

- register kitchen;
- update stock;
- update operating status;
- report shortage;
- see relevant operational information.

Target:

**Daily update in <30 seconds.**

---

## 6.4 Donor

Needs:

- verified shortages;
- severity;
- location;
- food deficit;
- pledge support;
- delivery/verification status.

---

## 6.5 Volunteer / Coordinator

Needs:

- report crowd quickly;
- update zone condition;
- verify food shortages;
- flag operational issues;
- optionally help pilgrims.

---

## 6.6 Kumbh Admin / Control Room

Needs:

- live operational map;
- crowd status;
- food supply/shortage;
- parking;
- toilets/water/medical;
- volunteer activity;
- alerts;
- content/place management;
- user and role management;
- data freshness;
- audit trail.

---

## 6.7 KISKO User Without Smartphone

Needs:

- large, simple interface;
- voice assistance;
- visual journey;
- directions;
- place discovery;
- QR continuation if possible;
- printable route;
- volunteer escalation.

---

# 7. Core Product Concept: Journey Engine

The Journey Engine is the central product capability.

### Input

**Intent + Context + Constraints + Preferences**

### Processing

**Live conditions + places + crowd + queue + timing + route + availability**

### Output

**Recommended Journey**

### Continuous operation

**Live updates → route/journey adaptation**

---

## 7.1 Journey Inputs

The engine may use:

- current/start location;
- destination;
- arrival time;
- desired activity;
- desired Snan time;
- desired Darshan time;
- return deadline;
- transport mode;
- companions;
- mobility/accessibility preferences;
- maximum walking;
- crowd tolerance;
- food preferences;
- time available.

---

## 7.2 Example

User:

> “I'm coming at 4 AM with my parents. I have a car. I want Snan and Darshan and need to be back by 8.”

System extracts:

```text
Arrival: 04:00
Transport: Car
Companions: Parents
Activities: Snan + Darshan
Return deadline: 08:00
Preference: Easier / lower walking
```

It then evaluates:

```text
Parking
→ Ghat
→ Snan timing
→ Ghat crowd
→ Temple crowd/queue
→ Food options
→ Return route
→ Time buffer
```

Output:

**My Kumbh Journey**

04:00 — Arrive  
04:10 — Park at recommended parking  
04:25 — Walk via lower-crowd route  
04:45 — Snan  
05:30 — Darshan  
06:30 — Breakfast  
07:15 — Return  
07:35 — Reach parking

The exact values above are illustrative demo data, not real operational predictions.

---

# 8. Conversational AI

The AI should be an **action-oriented journey agent**, not a text-only chatbot.

## 8.1 Natural-language examples

Pilgrim can ask:

- “I'm coming to Kumbh now. Where should I park?”
- “I want the fastest Snan and Darshan.”
- “I'm coming at 4 AM. What will the crowd be like?”
- “I'm with my parents. Give me an easier route.”
- “Find food near me.”
- “Find food on the way to Ramkund.”
- “I need a toilet with less waiting.”
- “Where can my parents rest?”
- “Tell me about this temple.”
- “I have two hours. What should I experience?”
- “I need to be back at my car by 8.”
- “The route looks crowded. What should I do?”

## 8.2 AI response principle

Do not respond with a long paragraph when an action is possible.

Instead:

**Explain briefly → show structured recommendation → provide action.**

Example:

> “P4 is slightly farther, but it currently has better availability and gives you an easier route to your selected Ghat.”

Actions:

**USE P4**

**COMPARE PARKING**

**CHANGE PREFERENCE**

---

# 9. Routing

The MVP uses zone-level routing rather than claiming GPS-precise navigation.

## 9.1 Route modes

### Fastest
Optimize total estimated time.

### Least Crowded
Prefer lower-crowd zones.

### Easiest
Optimize for:

- shorter walking;
- lower crowd;
- fewer difficult crossings;
- family/elderly comfort;
- accessibility where data exists.

The AI can infer the mode from conversation.

---

## 9.2 Human-readable navigation

Instead of only:

> 800 m / 10 min

provide:

> Walk straight toward Zone 5.

> Keep the Help Point on your left.

> Turn right after Gate 3.

> Continue toward Ghat B.

> Destination is ahead.

For MVP, these can be zone/landmark-based instructions.

---

## 9.3 Dynamic routing

If crowd conditions change:

> **Route updated**

> “Zone 6 is now crowded. This alternative route adds approximately 3 minutes but avoids the congested area.”

The system should show:

- old route;
- new route;
- reason;
- estimated time difference.

---

# 10. Crowd Intelligence

The original MVP uses zone-level crowd reports.

### Crowd levels

- LOW
- MEDIUM
- HIGH
- PEAK

### Crowd source

MVP:

- volunteer reports;
- coordinator/admin inputs;
- seeded demo data.

Future:

- CCTV;
- IoT;
- other sensing systems;
- more precise location data.

### Data freshness

Every live crowd condition should expose freshness where appropriate:

> Updated 32 sec ago

or:

> Reported 4 min ago

---

# 11. Prediction and Trust

The product must distinguish:

### Live

Current reported condition.

### Estimated

Calculated from available data.

### Predicted

Rule-based future estimate.

### Scheduled

Known event or timing.

The MVP can use rule-based lookup tables for known peak windows rather than pretending to have ML prediction.

---

# 12. Food Experience

Food is a major product module and retains the original shortage-intelligence concept.

## 12.1 Pilgrim food discovery

Rank food options using:

- distance;
- current crowd;
- estimated wait;
- operating status;
- meal availability;
- route compatibility;
- free/paid/seva classification where known.

Example:

### Better Food Options

**Community Food Centre**  
700 m · Low crowd · ~5 min wait

**Seva Kitchen**  
400 m · Medium crowd · ~12 min wait

**Food Point**  
250 m · High crowd · ~25 min wait

Recommendation:

> “Community Food Centre is farther but currently estimated to save approximately 20 minutes.”

---

## 12.2 Food categories

Clearly distinguish:

- FREE SEVA / BHANDARA
- COMMUNITY KITCHEN
- PAID FOOD
- OTHER VERIFIED FOOD SERVICE

---

## 12.3 Food shortage intelligence

For each kitchen:

- demand estimate;
- supply estimate;
- deficit;
- severity;
- verification status;
- last updated;
- supporting evidence.

Basic MVP calculation:

```text
demand(zone)
= footfall_multiplier[density_level]
  × zone_base_population
  × meals_per_person

supply(zone)
= SUM(kitchen.stock_meals)

deficit
= demand - supply
```

The formula is rule-based for MVP.

---

## 12.4 Donor flow

Donor:

1. Opens verified shortages.
2. Sees severity.
3. Selects shortage.
4. Pledges money/meals.
5. Pledge status becomes tracked.
6. Delivery/fulfilment can be verified.

Payment may be mocked/test-mode for the competition.

---

# 13. Facilities Discovery

Universal discovery should cover:

- food;
- toilets;
- water;
- medical;
- parking;
- temples;
- Ghats;
- help points;
- resting points;
- charging points where available;
- other verified pilgrim facilities.

Do not overcrowd the home screen with dozens of category icons.

Use:

**Universal search + contextual recommendations + compact category shortcuts.**

---

# 14. Toilet Experience

Example:

### Nearby Toilets

**Toilet A**  
250 m · Low queue · ~3 min

**Toilet B**  
120 m · Medium queue · ~2 min

**Toilet C**  
80 m · High queue · ~5–8 min wait

Recommendation:

> “Toilet A is slightly farther but expected to be faster.”

CTA:

**GUIDE ME**

Queue values are estimated unless backed by a verified live source.

---

# 15. Stay

Stay is a journey anchor, not a hotel marketplace.

Pilgrim can define:

- hotel;
- camp;
- Dharamshala;
- relative's home;
- other base.

The system can then plan:

**Stay → Parking → Ghat → Darshan → Food → Stay**

Accommodation discovery can be added later using verified inventory.

---

# 16. Kumbh Discover

The discovery layer makes the experience memorable.

## 16.1 60-second stories

When a pilgrim reaches or passes an important place:

> **60-Second Kumbh Story**

Content can cover:

- historical significance;
- religious/cultural context;
- place history;
- traditions;
- important people;
- events.

## 16.2 Audio

Future/optional:

**Listen to this story**

---

## 16.3 Along-the-way discovery

The system can identify places close to the user's journey:

> “3 meaningful places are along your route.”

Each can show:

- additional walking time;
- short description;
- story.

User chooses:

**JUST GET THERE**

or

**EXPLORE ALONG THE WAY**

---

# 17. My Kumbh

The product maintains a personal journey record.

### Today

- Arrived
- Snan
- Darshan
- Places visited
- Food/seva experience

### Discoveries

- places;
- stories;
- cultural points.

### Future plan

Upcoming journeys.

### End-of-journey memory

Generate a simple personal summary:

> **Your Kumbh Journey**

This should be private/personal, not a social network.

---

# 18. KISKO

KISKO is the **physical/public form of Anubhav**.

It uses the same backend and Journey Engine.

## 18.1 KISKO goals

Serve:

- pilgrims without smartphones;
- elderly users;
- users who prefer a physical help point;
- visitors needing immediate directions;
- users needing volunteer assistance.

## 18.2 KISKO home

Primary actions:

- PLAN MY VISIT
- FIND FOOD
- FIND PARKING
- FIND GHAT
- PLAN SNAN
- FIND TOILET
- DISCOVER KUMBH
- GET HELP

Also:

**Talk to Anubhav**

---

## 18.3 KISKO voice interaction

Example:

Pilgrim:

> “I have two hours. What should I do?”

KISKO:

> “I can create a short Kumbh experience for you. Would you prefer Snan, Darshan, cultural places, or a combination?”

The result appears visually on the kiosk.

---

## 18.4 KISKO continuation

After creating a journey:

### Continue on Phone
Display QR.

### View Route
Show large-screen route.

### Print Route
Print a simple route/journey slip.

### Get Volunteer Help
Escalate to volunteer/help point.

---

# 19. Admin / Operations Console

The Admin Panel is a first-class product surface.

It should allow authorized administrators to **monitor, manage, verify and configure** the operational ecosystem.

## 19.1 Admin dashboard

Primary KPIs:

- active zones;
- low/medium/high/peak zones;
- active crowd reports;
- food shortage alerts;
- available/occupied parking;
- facility status;
- active volunteers;
- unresolved alerts;
- stale data.

Main map:

**Crowd + Food + Parking + Facilities**

---

# 20. Admin Modules

## 20.1 Overview

Live operational summary.

Actions:

- inspect zone;
- open alert;
- filter by category;
- jump to critical issue.

---

## 20.2 Crowd Management

Admin can:

- view all zone crowd states;
- inspect individual reports;
- see report time;
- see reporter;
- see conflicting reports;
- approve/override status where authorized;
- mark stale reports;
- view crowd trend;
- create operational alert.

### Example

Zone 7:

**HIGH**

6 reports

Latest: 34 sec ago

Trend:

↑ Increasing

---

## 20.3 Food & Kitchen Management

Admin can:

- create/edit kitchen;
- activate/deactivate kitchen;
- assign zone;
- set capacity;
- view stock;
- view demand estimate;
- view deficit;
- view shortage severity;
- verify shortage;
- review verification evidence;
- assign/track donor pledges;
- mark fulfilment;
- manage food categories;
- flag stale stock.

### Kitchen status

- OPEN
- LOW STOCK
- CRITICAL
- CLOSED
- UNVERIFIED

---

## 20.4 Parking Management

Admin can:

- add parking location;
- set capacity;
- update occupancy;
- set status;
- mark full;
- inspect zone crowd;
- configure recommended entry/exit information.

Example:

**P4**

Capacity: 5000  
Occupied: 1900  
Availability: 62%

---

## 20.5 Ghat & Temple Management

Admin can:

- create/edit place;
- assign zone;
- set operating status;
- add description;
- add historical content;
- add images;
- define peak windows;
- manage crowd/queue information;
- flag temporary closure.

---

## 20.6 Toilets / Water / Medical / Help Points

Admin can CRUD facilities:

- name;
- category;
- zone;
- status;
- capacity where relevant;
- accessibility;
- operating hours;
- queue/condition;
- last verified time.

Statuses:

- OPEN
- LIMITED
- BUSY
- CLOSED
- UNDER MAINTENANCE

---

## 20.7 Routes & Navigation

Admin can manage:

- zones;
- zone connections;
- route segments;
- blocked segments;
- temporary closures;
- recommended pedestrian corridors;
- landmark instructions.

If a route is blocked:

> Mark segment CLOSED

The Journey Engine avoids it.

---

## 20.8 Events & Peak Windows

Admin can manage:

- event name;
- date;
- time;
- location;
- expected crowd level;
- peak window;
- notes.

These events feed journey planning.

---

## 20.9 Kumbh Discover Content

Admin CMS for:

- places;
- stories;
- 60-second stories;
- audio;
- images;
- cultural explanations;
- multilingual content;
- publish/unpublish;
- review status.

---

## 20.10 Volunteer Management

Admin can:

- create volunteer;
- assign zone;
- view language/skill profile;
- view availability;
- view recent reports;
- view verification activity;
- assign/reassign operational coverage;
- disable account.

Future enhancement:

**dynamic volunteer dispatch based on crowd demand and skill/language matching.**

---

## 20.11 User & Role Management

Roles:

- Pilgrim
- Kitchen Operator
- Volunteer
- Coordinator
- Donor
- Admin
- Super Admin

Admin can:

- activate/deactivate users;
- assign role;
- reset access;
- review activity.

---

## 20.12 Alerts & Broadcasts

Admin can create:

- zone alert;
- crowd alert;
- route closure;
- food shortage alert;
- facility alert;
- emergency informational broadcast.

Target:

- all pilgrims;
- selected zone;
- selected KISKO;
- volunteers;
- kitchen operators.

---

## 20.13 Reports & Audit

Admin can inspect:

- crowd reports;
- shortage verifications;
- stock updates;
- route changes;
- facility updates;
- admin overrides;
- donor pledge history.

Every important operational change should store:

- actor;
- timestamp;
- previous value;
- new value;
- reason where appropriate.

---

# 21. Volunteer Experience

Volunteer UI should be optimized for speed.

### Home

**REPORT CROWD**

**VERIFY SHORTAGE**

**REPORT ISSUE**

**HELP PILGRIM**

## Crowd report

Select zone:

Zone 4

Select:

🟢 Low  
🟡 Medium  
🟠 High  
🔴 Peak

Optional:

- note;
- photo;
- timestamp.

Target:

**under 10–15 seconds.**

---

# 22. Kitchen Experience

Kitchen operator sees:

### Today's Kitchen

Status: OPEN

Meals remaining:

**1,240**

Quick actions:

**+100**

**−100**

**UPDATE STOCK**

**REPORT SHORTAGE**

**CLOSE KITCHEN**

The primary objective is minimal interaction time.

---

# 23. Donor Experience

Donor sees:

# Verified Food Needs

Cards show:

- zone;
- kitchen;
- deficit;
- severity;
- verification age;
- amount/meals needed;
- fulfilment progress.

Actions:

**PLEDGE**

**VIEW DETAILS**

**TRACK**

---

# 24. Information Architecture

## Pilgrim

```text
Home
├── Converse
├── Explore
├── Journey
├── Map
├── My Kumbh
└── Help
```

## KISKO

```text
Home
├── Talk
├── Plan
├── Find
├── Navigate
├── Discover
└── Help
```

## Admin

```text
Dashboard
├── Crowd
├── Food & Kitchens
├── Parking
├── Ghats & Temples
├── Facilities
├── Routes
├── Events
├── Discover Content
├── Volunteers
├── Alerts
├── Users & Roles
└── Reports / Audit
```

---

# 25. Core Data Model

The original model contains:

```sql
zones
crowd_reports
kitchens
parking_spots
temples
shortages
pledges
verifications
```

Extend it with:

```sql
places
place_categories

toilets
water_points
medical_points
help_points
rest_points

routes
route_segments
route_blocks

queue_reports

events
peak_windows

journeys
journey_stops
journey_preferences

users
roles
volunteer_profiles

discoveries
stories
story_translations

kiosk_devices
kiosk_sessions

alerts
admin_actions
```

### Important principle

Do not create separate intelligence logic for mobile, web and KISKO.

All interfaces should call the same backend Journey Engine/services.

---

# 26. Suggested Supabase Architecture

## Database

Supabase Postgres.

## Auth

Supabase Auth + role-based access.

## Realtime

Subscriptions for:

- crowd_reports;
- shortages;
- parking;
- facility status;
- alerts;
- journey updates where required.

## Storage

For:

- verification photos;
- place images;
- discovery media;
- optional kiosk assets.

## Edge/server functions

For:

- journey generation;
- recommendation ranking;
- shortage calculation;
- notification/broadcast logic;
- secure admin operations.

---

# 27. Recommendation Ranking

A recommendation score can combine:

```text
score =
  crowd_score
+ distance_score
+ availability_score
+ queue_score
+ route_compatibility
+ user_preference
+ time_compatibility
```

The exact weighting can be adjusted.

Important:

**Distance must not automatically dominate.**

Example:

> 300m + High crowd

can lose to:

> 700m + Low crowd

---

# 28. Journey State Machine

A journey can move through:

```text
DRAFT
↓
PLANNED
↓
STARTED
↓
IN_PROGRESS
↓
ADAPTED
↓
COMPLETED
```

It can also be:

```text
CANCELLED
```

Every stop can have:

```text
PLANNED
REACHED
COMPLETED
SKIPPED
```

---

# 29. Realtime Journey Adaptation

When a significant condition changes:

```text
Crowd changes
Parking changes
Route closes
Facility closes
Queue increases
```

The Journey Engine evaluates whether the current plan is affected.

If yes:

> **Your journey has changed**

Then show:

- what changed;
- why;
- new recommendation;
- time difference.

User can:

**ACCEPT**

**KEEP CURRENT PLAN**

**REPLAN**

---

# 30. Accessibility & Outdoor UX

The interface must work in real Kumbh conditions.

Requirements:

- high contrast;
- large touch targets;
- clear typography;
- minimal dense text;
- obvious status colours + text labels;
- strong sunlight readability;
- low-bandwidth friendly;
- graceful loading states;
- offline/poor-network retry for critical reports;
- multilingual architecture.

Languages:

**English / Hindi / Marathi**

Additional languages can be added later.

---

# 31. Trust & Safety UX

The product must avoid overclaiming.

Never display an estimated queue as an exact guarantee.

Use:

> Estimated 15–20 min

rather than:

> Queue = 17 min

unless exact measurement exists.

Show freshness:

> Updated 42 sec ago

For predictions:

> Expected based on historical/scheduled pattern

For simulated competition data:

> Demo data

---

# 32. MVP Scope

## Pilgrim

### Must work

- conversational AI;
- location/zone selection;
- crowd map;
- food discovery;
- parking discovery;
- Ghat discovery;
- temple discovery;
- toilets;
- basic facilities;
- better-option ranking;
- journey planner;
- route avoiding high-crowd zones;
- journey timeline;
- My Kumbh basic history.

## KISKO

### Must work

- conversational UI;
- voice-ready interface;
- journey planning;
- map;
- food;
- parking;
- Ghat;
- Snan planning;
- help;
- QR continuation;
- simulated print route representation if physical printer is unavailable.

## Volunteer

- crowd reporting;
- shortage verification;
- issue reporting.

## Kitchen

- kitchen profile;
- stock update;
- operating status;
- shortage reporting.

## Donor

- shortage feed;
- verified shortage details;
- mock/test pledge;
- pledge status.

## Admin

- live dashboard;
- crowd heatmap;
- kitchen management;
- shortage management;
- parking management;
- facility management;
- Ghat/temple management;
- route management;
- discovery content CMS;
- volunteer management;
- alerts;
- users/roles;
- audit/activity view.

---

# 33. Future Roadmap

## Phase 2

- precise GPS;
- real pedestrian navigation;
- richer multilingual voice;
- actual queue sensing;
- verified accommodation integration;
- better accessibility routing;
- real payment;
- richer discovery/audio.

## Phase 3

- CCTV/IoT crowd sensing;
- ML-based crowd prediction;
- ML demand prediction;
- dynamic volunteer dispatch;
- advanced operational optimization;
- city-scale Kumbh digital journey layer.

---

# 34. Success Metrics

### Pilgrim

- time to generate a journey;
- time to find a suitable low-crowd option;
- successful completion of a planned journey;
- percentage of recommendations accepted;
- route adaptation success.

### Operations

- crowd report time;
- percentage of zones with recent reports;
- shortage verification time;
- kitchen stock update time;
- stale-data rate.

### Demo

The core end-to-end demo should prove:

**Natural-language request → AI intent extraction → crowd-aware recommendations → journey creation → route → live change → updated journey → completion.**

Food intelligence should demonstrate:

**Kitchen stock → shortage → verification → donor pledge → fulfilment/verification.**

---

# 35. Flagship Demonstration

The strongest competition scenario:

> **“I'm arriving at 4 AM with my parents. I have a car. I want Snan and Darshan and breakfast, and I need to be back at my car by 8.”**

Anubhav:

1. Understands the request.
2. Identifies constraints.
3. Recommends parking.
4. Selects a Ghat using crowd/timing.
5. Plans Snan.
6. Plans Darshan.
7. Finds food along the journey.
8. Selects an easier route.
9. Shows return time and safety buffer.
10. Introduces a nearby 60-second Kumbh Story.
11. Simulates a crowd change.
12. Dynamically changes the route.
13. Completes the journey.
14. Adds the experience to My Kumbh.

Then demonstrate the same journey through KISKO.

Finally switch to Admin:

> “Zone 6 became crowded.”

Admin sees the change.

This demonstrates the complete ecosystem rather than disconnected screens.

---

# 36. Technical Architecture

```text
                         Anubhav
                              │
                  ┌───────────┴───────────┐
                  │    JOURNEY ENGINE     │
                  │                       │
                  │ Intent Understanding  │
                  │ Recommendation        │
                  │ Routing               │
                  │ Crowd Context         │
                  │ Journey Planning      │
                  │ Adaptation             │
                  └───────────┬───────────┘
                              │
                       SUPABASE BACKEND
                              │
          ┌──────────────┬────┼────┬──────────────┐
          │              │    │    │              │
        Crowd          Food Routes Places      Facilities
          │              │    │    │              │
     Volunteers      Kitchens   │ Temples      Toilets
                              │ Ghats         Water
                              │               Medical
                              │               Help
                              │
                         Realtime Layer
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
        PILGRIM              KISKO              ADMIN
        MOBILE/WEB         PUBLIC KIOSK       CONTROL ROOM
```

---

# 37. Recommended Technical Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- component library of choice
- responsive web/PWA architecture

### Backend

- Supabase Postgres
- Supabase Auth
- Supabase Realtime
- Supabase Storage
- Edge/server functions

### Maps

- Leaflet/OpenStreetMap for MVP
- static/zone-aware map data
- upgrade path to richer routing later

### AI

Use a structured tool/action layer so the model can produce:

```json
{
  "intent": "plan_journey",
  "start": "...",
  "arrival_time": "...",
  "activities": ["snan", "darshan"],
  "return_deadline": "...",
  "preferences": ["easy_route"]
}
```

The AI should not directly invent operational facts. It should retrieve data from the application services and then explain the resulting recommendation.

---

# 38. Repository Structure

```text
/app
  /pilgrim
  /journey
  /map
  /discover
  /my-kumbh
  /kisko
  /volunteer
  /kitchen
  /donor
  /admin
    /dashboard
    /crowd
    /food
    /parking
    /places
    /facilities
    /routes
    /events
    /discover
    /volunteers
    /alerts
    /users
    /audit

/components
/lib
  journey/
  recommendations/
  crowd/
  food/
  routing/
  ai/
  supabase/
  notifications/
```

---

# 39. Product Differentiation

Anubhav is not differentiated by:

- having a map;
- having a chatbot;
- listing food;
- listing temples;
- listing parking.

It is differentiated by combining them into a **context-aware journey**.

### Core differentiator

> **Intent → Intelligence → Journey → Live Adaptation → Memory**

And the same intelligence is available through:

> **Mobile + Web + KISKO**

while the same operational layer is visible to:

> **Volunteers + Kitchens + Donors + Admin**

---

# 40. Final Pitch

### Short pitch

> **Anubhav is a personal Kumbh journey companion that combines live crowd intelligence, conversational AI, smart recommendations, crowd-aware routing and cultural discovery to help pilgrims decide not just where to go, but when to go, how to get there, what to avoid and what not to miss.**

### Stronger competition line

> **“You tell Anubhav what you want to experience. It plans the journey around you—and keeps adapting as Kumbh changes around you.”**

### Ecosystem line

> **One intelligence layer. Three experiences: Pilgrim, KISKO and Kumbh Operations.**
