# Anubhav — Demonstration Scenarios

## Purpose

These scenarios define the core experiences that should be demonstrable during the Anubhav MVP presentation.

The objective is not to demonstrate every feature.

The objective is to demonstrate that Anubhav can turn operational data into **useful, personalized pilgrim assistance**.

---

# Scenario 1 — Smart Journey Planning

## User Situation

A pilgrim is arriving at Kumbh around 4 AM by car.

They want:

- Parking
- Darshan
- Snan
- Minimum difficulty
- Fast overall journey

## User Question

> "I'm coming to Kumbh at 4 AM for darshan and snan. Where should I park and which route should I take?"

## System Needs

- Arrival time
- Destination
- Activities
- Parking availability
- Crowd conditions
- Route conditions
- Event conditions

## Backend Flow

```text
User Question
 ↓
AI Intent Detection
 ↓
Journey Planning
 ↓
Parking Tool
Crowd Tool
Route Tool
Event Tool
 ↓
Journey Engine
 ↓
Rank Options
 ↓
AI Explanation
```

## Expected Result

The assistant recommends a specific parking location and route.

It explains WHY the option is better.

Example:

> I recommend Parking P09. P04 is closer, but its current occupancy is higher and the connecting route is more crowded. P09 has better availability and connects to a lower-crowd pedestrian route.

## Admin Demonstration

Before asking the question, the operator can change:

```text
P04 occupancy:
72% → 94%

R17:
OPEN → CONGESTED

Zone 07:
MODERATE → HIGH
```

The assistant's recommendation should change accordingly.

## Value

Demonstrates:

**Live operational data → intelligence → personalized journey recommendation**

---

# Scenario 2 — Smart Food Discovery

## User Situation

A pilgrim is hungry while moving through the Kumbh area.

They want food but do not want to stand in a long queue.

## User Question

> "I'm hungry. Where can I get food nearby without waiting too long?"

## System Needs

- Current location
- Nearby food points
- Food availability
- Queue
- Crowd
- Walking distance

## Backend Flow

```text
Location
 ↓
Nearby Food Search
 ↓
Availability
 ↓
Queue
 ↓
Crowd
 ↓
Walking Time
 ↓
Ranking
 ↓
Assistant
```

## Expected Result

Example:

> Food Point F12 is about 650m away and currently has a low queue. F08 is closer, but its queue is significantly higher. I recommend F12.

## Admin Demonstration

Change:

```text
F12 queue:
LOW → HIGH
```

The recommendation should change.

## Value

Demonstrates:

**Better choice instead of nearest choice.**

---

# Scenario 3 — Smart Facility Discovery

## User Situation

A pilgrim needs a toilet.

They want the shortest practical waiting time.

## User Question

> "Where can I find a toilet nearby with the shortest queue?"

## System Needs

- Current location
- Nearby toilets
- Queue
- Distance
- Facility status

## Example Data

```text
T08
280m
3 min wait

T12
350m
8 min wait

T19
420m
2 min wait
```

## Expected Result

Assistant recommends T19 because the user's objective is minimum waiting time.

Example:

> T19 has the shortest estimated queue at about 2 minutes. T08 is closer, but its queue is slightly longer.

## Value

Demonstrates:

**Context-aware facility recommendation.**

---

# Scenario 4 — Crowd-Driven Route Change

## User Situation

A pilgrim is already walking toward a destination.

A route becomes congested.

## Admin Action

Change:

```text
R17:
OPEN → CONGESTED
```

and:

```text
R18:
MODERATE → RECOMMENDED
```

## User Question

> "Why are you sending me this way instead?"

## Backend

Checks:

- Route R17
- Route R18
- Crowd conditions
- Travel time
- Closures

## Expected Response

> R17 is currently experiencing increasing crowd density. R18 is slightly longer but currently has lower crowd and should provide a smoother walk.

## Value

Demonstrates that recommendations are dynamically affected by operational conditions.

---

# Scenario 5 — Early Morning Kumbh Planning

## User Situation

A pilgrim plans to arrive at 4 AM.

## User Question

> "I'm coming at 4 AM. What will the crowd be like and how quickly could I finish darshan and snan?"

## System Needs

- Current crowd
- Historical/demo time patterns if available
- Event schedule
- Peak windows
- Destination conditions
- Journey estimates

## Important Rule

If the system does not have a true prediction model, it must NOT claim certainty.

Use language such as:

> "Based on current conditions and the scheduled events, the expected crowd is moderate."

or:

> "This is an estimate based on available operational data."

## Value

Demonstrates time-aware planning without pretending to have perfect prediction.

---

# Scenario 6 — Cultural Discovery

## User Situation

A pilgrim is at or near an important place.

## User Question

> "Tell me about this place."

Example:

Ramkund

## System

Retrieves structured place content:

- Historical significance
- Cultural importance
- Short story
- Visitor information

## Expected Experience

The assistant provides a short, memorable explanation rather than a long encyclopedia entry.

Example structure:

```text
What it is

Why it matters

A short story

What you can see

Nearby places
```

## Value

Moves Anubhav beyond navigation into:

**Pilgrim experience and cultural discovery.**

---

# Scenario 7 — KISKO Assistance

## User Situation

A pilgrim does not have a smartphone.

They approach a KISKO kiosk.

## Interaction

Pilgrim asks:

> "मुझे स्नान के लिए जाना है, सबसे आसान रास्ता कौन सा है?"

KISKO sends the same request to the Smart Assistance backend.

## Backend

Uses:

- Crowd
- Routes
- Destination
- Current kiosk location

## Response

KISKO displays:

```text
Recommended Route

R08

Crowd:
Moderate

Walking:
15 min

Directions:
Go straight
Turn left at Help Point 04
Continue toward Ghat B
```

## Value

Demonstrates:

**Digital inclusion.**

The intelligence is available even when the pilgrim does not have a smartphone.

---

# Scenario 8 — Admin → Pilgrim Intelligence Loop

This is the most important technical demonstration.

## Step 1

Admin sees:

```text
Zone 07
HIGH CROWD
```

## Step 2

Admin sees:

```text
R17
CONGESTED
```

## Step 3

Admin sees:

```text
P04
94% OCCUPIED
```

## Step 4

Admin updates operational status.

## Step 5

Pilgrim asks:

> "Where should I park?"

## Step 6

Smart Assistance retrieves the updated conditions.

## Step 7

Journey Engine recalculates options.

## Step 8

Pilgrim receives a different recommendation.

## Demonstration Message

This proves:

```text
ADMIN DATA
     ↓
OPERATIONAL STATE
     ↓
SMART ASSISTANCE
     ↓
PILGRIM DECISION
```

The Admin is therefore not an isolated dashboard.

It powers the pilgrim experience.

---

# 9. Recommended Final Presentation Flow

Do not demonstrate all eight scenarios.

Use this sequence:

## Demo 1

### "I'm coming at 4 AM..."

Show:

Crowd + Parking + Routes + Journey Intelligence

---

## Demo 2

### "I'm hungry..."

Show:

Food + Queue + Location

---

## Demo 3

### "Where is a toilet with less waiting?"

Show:

Facilities + Queue + Location

---

## Demo 4

### KISKO

Ask the same journey question without using a smartphone.

Show:

KISKO → Same Intelligence Backend

---

# 10. Core Demonstration Message

The presentation should communicate:

> **Anubhav does not simply show information. It understands the pilgrim's situation, combines operational conditions and recommends what to do next.**

---

# 11. Technical Demonstration Message

When explaining the architecture:

```text
Admin
 ↓
Operational Data
 ↓
Supabase
 ↓
FastAPI
 ↓
AI Orchestrator
 ↓
Domain Tools
 ↓
Journey Engine
 ↓
LLM Explanation
 ↓
Pilgrim / KISKO
```

Explain:

**The database provides facts.**

**The Journey Engine evaluates options.**

**The AI understands the question and explains the result.**

---

# 12. MVP Boundary

For the submission, prioritize:

### Must Work

- Admin dashboard
- Crowd data
- Parking data
- Food data
- Facility data
- Routes
- Supabase integration
- Smart Assistant
- Journey recommendation
- KISKO interface

### Can Be Simulated / Seeded

- Crowd reports
- Food demand
- Parking occupancy
- Facility queues
- Event impact
- Demo locations

Clearly identify simulated data where appropriate.

### Future

- Advanced crowd prediction
- Advanced demand forecasting
- Advanced routing
- Voice-first KISKO
- Multilingual expansion
- Large-scale realtime infrastructure
- Advanced personalization
- Predictive resource allocation

---

# 13. Success Criteria

The MVP is successful if a judge can understand this sequence within a few minutes:

```text
Something changes in Kumbh
          ↓
Admin sees it
          ↓
Operational data updates
          ↓
Assistant understands pilgrim request
          ↓
System checks multiple conditions
          ↓
Journey Engine evaluates options
          ↓
Assistant recommends the better option
          ↓
Pilgrim receives actionable guidance
          ↓
Same intelligence works through KISKO
```

That is the core Anubhav experience.