# Anubhav — Admin Screen Architecture

## 1. Purpose

The Anubhav Admin Control Room is the central operational interface for managing the data, conditions and services that power the Pilgrim App, Web experience and KISKO assistance kiosks.

The Admin is not a generic CMS.

It is an **operations control room** designed for fast monitoring, decision-making and intervention during the Kumbh.

Primary goals:

- Monitor operational conditions
- Detect problems quickly
- Understand crowd movement
- Manage food availability
- Manage parking
- Monitor public facilities
- Manage routes and closures
- Manage important places and cultural information
- Coordinate volunteers
- Broadcast alerts
- Monitor events and peak periods
- Review operational history
- Provide data to the Smart Assistance layer

---

# 2. Application Structure

## Persistent Application Shell

Every Admin page uses the same:

- Sidebar
- Top navigation
- Global search
- Notification area
- System status
- Admin profile

### Sidebar

## Anubhav

### OPERATIONS

- Overview

### INTELLIGENCE

- Crowd Intelligence
- Food & Kitchens
- Parking

### OPERATIONS MANAGEMENT

- Facilities
- Routes & Closures
- Events & Peaks

### CONTENT

- Places & Discover

### FIELD OPERATIONS

- Volunteers
- Alerts & Broadcasts

### MANAGEMENT

- Users & Roles
- Reports & Analytics
- Audit Logs

### SYSTEM

- Settings

---

# 3. Route Architecture

```text
/admin
/admin/crowd
/admin/crowd/:zoneId

/admin/food
/admin/food/:kitchenId
/admin/food/shortages

/admin/parking
/admin/parking/:parkingId

/admin/facilities
/admin/facilities/:facilityId

/admin/places
/admin/places/:placeId

/admin/routes
/admin/routes/:routeId

/admin/events
/admin/events/:eventId

/admin/volunteers
/admin/volunteers/:volunteerId

/admin/alerts
/admin/alerts/create

/admin/users

/admin/reports

/admin/audit

/admin/settings
```

---

# 4. Page Architecture

# 4.1 Operations Overview

Route:

`/admin`

Purpose:

Provide an immediate understanding of the current Kumbh operational situation.

The page must answer:

1. What is happening now?
2. Where are the problems?
3. What requires attention?
4. What has changed recently?

## Header

Title:

Operations Overview

Subtitle:

Real-time overview of Anubhav operations

## KPI Layer

- Active Pilgrims
- High / Peak Zones
- Food Alerts
- Parking Occupancy
- Active Volunteers
- Stale Reports

## Main Map

Layers:

- Crowd
- Food
- Parking
- Facilities
- Routes

## Critical Operations Panel

Examples:

- Zone 07 — High Crowd
- Kitchen K12 — Food Deficit
- Parking P12 — Near Capacity
- Facility T12 — High Queue

## Recent Operational Activity

Columns:

- Time
- Actor
- Module
- Action
- Status

## Zone Summary

Show all operational zones and their current state.

---

# 4.2 Crowd Intelligence

Route:

`/admin/crowd`

Purpose:

Monitor crowd density and movement across operational zones.

## Filters

- Zone
- Crowd Status
- Trend
- Data Source
- Confidence
- Time

## KPI

- Current Active Pilgrims
- High Zones
- Peak Zones
- Increasing Zones
- Stale Reports

## Main Map

Display:

- Zone boundaries
- Crowd density
- Crowd severity
- Trend
- Selected zone
- Nearby routes
- Nearby facilities

## Priority Panel

Example:

Zone 08

PEAK

Increasing

Zone 07

HIGH

Increasing

## Data Table

Columns:

- Zone
- Crowd
- Trend
- Reports
- Confidence
- Updated
- Action

Clicking a zone opens:

`/admin/crowd/:zoneId`

---

# 4.3 Crowd Zone Detail

Route:

`/admin/crowd/:zoneId`

Example:

Zone 07

Display:

- Current crowd status
- Trend
- Number of reports
- Confidence
- Last update

## Map

Focus on selected zone.

Show:

- Crowd area
- Routes
- Facilities
- Nearby food
- Parking

## Crowd Trend

Chart showing crowd conditions over time.

## Operational Assessment

Example:

"Traffic on R17 is increasing while R18 remains moderate."

## Actions

- Create Alert
- Recommend Diversion
- Override Status

---

# 4.4 Food & Kitchens

Route:

`/admin/food`

Purpose:

Monitor food supply, availability and demand.

## KPIs

- Active Kitchens
- Meals Available
- Estimated Demand
- Current Deficit
- Critical Shortages

## Map

Show:

- Kitchens
- Food points
- Demand areas
- Shortage indicators

## Priority Conditions

Example:

K12

860 meal deficit

CRITICAL

## Table

Columns:

- Kitchen
- Zone
- Meals Available
- Estimated Demand
- Deficit
- Status
- Updated
- Action

Primary action:

Add Kitchen

---

# 4.5 Kitchen Detail

Route:

`/admin/food/:kitchenId`

Display:

- Kitchen ID
- Zone
- Status
- Meals available
- Estimated demand
- Deficit
- Last update

## Charts

Supply vs demand

## Actions

- Update Stock
- Verify Shortage
- Create Alert
- Contact Kitchen
- Close Kitchen

## Timeline

- Reported
- Verified
- Support Assigned
- Delivery
- Fulfilled

---

# 4.6 Food Shortages

Route:

`/admin/food/shortages`

Tabs:

- All
- Critical
- Pending Verification
- Verified
- Fulfilled

Columns:

- Kitchen
- Zone
- Meals Required
- Severity
- Verification
- Reported
- Updated
- Action

Critical shortages appear first.

---

# 4.7 Parking

Route:

`/admin/parking`

Purpose:

Monitor parking capacity and its effect on pilgrim journeys.

## KPIs

- Total Capacity
- Occupied
- Available
- Occupancy
- Full Locations

## Map

Show:

- Parking locations
- Occupancy
- Crowd
- Routes

## Priority Panel

Examples:

P04 — 78%

P06 — 91%

P12 — 96%

## Table

Columns:

- Parking
- Zone
- Capacity
- Occupied
- Available
- Occupancy
- Trend
- Updated
- Action

---

# 4.8 Parking Detail

Route:

`/admin/parking/:parkingId`

Display:

- Capacity
- Occupied
- Available
- Occupancy
- Trend
- Status

## Map

Show:

- Parking
- Destination
- Walking route
- Crowd conditions

## Journey Impact

Example:

Parking P04 currently provides a smoother route to Ghat B than P03.

Display:

- Destination
- Walking distance
- Walking time
- Crowd condition

## Actions

- Update Occupancy
- Mark Full
- Close Parking
- Edit Capacity

---

# 4.9 Facilities

Route:

`/admin/facilities`

Categories:

- Toilets
- Water
- Medical
- Help Points
- Rest Areas

## KPIs

- Open
- Needs Attention
- Closed
- Stale Reports

## Table

Columns:

- Facility
- Type
- Zone
- Status
- Queue / Availability
- Accessibility
- Updated
- Action

---

# 4.10 Facility Detail

Route:

`/admin/facilities/:facilityId`

Example:

Toilet T08

Display:

- Status
- Queue
- Estimated Wait
- Capacity
- Accessibility
- Last Inspection

## Map

Show:

- Facility
- Nearby crowd
- Nearby routes

## Actions

- Update Status
- Report Issue
- Close Facility

---

# 4.11 Places & Discover

Route:

`/admin/places`

Categories:

- Ghats
- Temples
- Historic Places
- Akhara
- Cultural
- Other

Views:

- List
- Map

Columns:

- Place
- Category
- Zone
- Published
- Verification
- Updated
- Action

Primary action:

Add Place

---

# 4.12 Place Detail / CMS

Route:

`/admin/places/:placeId`

Two-column interface.

## Place Information

- Name
- Category
- Zone
- Coordinates
- Verification
- Status

## Content

- Short Description
- Historical Significance
- 60-Second Story
- Cultural Context
- Visitor Information

## Languages

- English
- Hindi
- Marathi

## Media

- Cover image
- Gallery
- Audio story

## Pilgrim Preview

Show how the content will appear to a pilgrim.

Actions:

- Save Draft
- Preview
- Publish
- Archive

---

# 4.13 Routes & Closures

Route:

`/admin/routes`

Purpose:

Monitor pedestrian routes and operational restrictions.

## Map Layers

- Recommended
- Congested
- Closed
- Diversion

## Active Route Conditions

Examples:

R17 — HIGH CONGESTION

R21 — CLOSED

R08 — RECOMMENDED

## Table

Columns:

- Route
- From
- To
- Status
- Crowd
- Walking Time
- Updated
- Action

Actions:

- Create Closure
- Create Diversion
- Update Route

---

# 4.14 Route Detail

Route:

`/admin/routes/:routeId`

Display:

- Route status
- Crowd
- Distance
- Walking time
- Alternative route
- Last update

Map highlights the selected route.

Actions:

- Close Route
- Create Diversion
- Update Status
- Reopen Route

---

# 4.15 Events & Peak Windows

Route:

`/admin/events`

Views:

- Calendar
- Timeline

Events include:

- Amrit Snan
- Evening Aarti
- Major Darshan Period

Display:

- Date
- Start
- Peak
- End
- Expected Crowd
- Affected Zones

Actions:

- Edit Event
- Publish
- Create Alert
- Add Peak Window

---

# 4.16 Event Detail

Route:

`/admin/events/:eventId`

Display:

- Date
- Start
- Peak
- End
- Expected Crowd
- Affected Zones

Timeline:

- Pre-Peak
- Peak
- Post-Peak

Map:

Highlight affected zones.

Actions:

- Edit Event
- Publish
- Create Alert

---

# 4.17 Volunteers

Route:

`/admin/volunteers`

KPIs:

- Active
- Available
- Assigned
- Offline

Filters:

- Zone
- Language
- Skill
- Availability
- Status

Table:

- Volunteer
- Zone
- Languages
- Skills
- Status
- Current Assignment
- Last Active
- Action

Coverage panel:

Zone 08

Need: 4

Available: 1

Critical

Primary action:

Assign Volunteer

---

# 4.18 Volunteer Detail

Route:

`/admin/volunteers/:volunteerId`

Display:

- Languages
- Skills
- Status
- Zone
- Availability
- Current Assignment

Map:

Current location / assigned zone where available.

Actions:

- Assign
- Reassign
- Contact
- Disable

---

# 4.19 Alerts & Broadcasts

Route:

`/admin/alerts`

Tabs:

- Active
- Scheduled
- Sent
- Expired

Table:

- Severity
- Title
- Audience
- Zone
- Created
- Status
- Action

Alert preview channels:

- Pilgrim
- KISKO
- Volunteer

Primary action:

Create Alert

---

# 4.20 Create Alert

Route:

`/admin/alerts/create`

## Form

Alert Type:

- Crowd
- Food
- Route
- Facility
- General

Severity:

- Information
- Warning
- High
- Critical

Audience:

- All Pilgrims
- Selected Zone
- KISKO
- Volunteers
- Kitchen Operators

Fields:

- Zone
- Message

## Preview

Show:

- Pilgrim version
- KISKO version
- Volunteer version

Delivery:

- Now
- Schedule

Actions:

- Save Draft
- Schedule
- Send Now

Send Now requires confirmation.

---

# 4.21 Users & Roles

Route:

`/admin/users`

Roles:

- Super Admin
- Operations Head
- Crowd Operator
- Food Operator
- Facilities Operator
- Content Manager
- Volunteer Coordinator

Table:

- User
- Role
- Status
- Last Active
- Created
- Action

---

# 4.22 Reports & Analytics

Route:

`/admin/reports`

Categories:

- Crowd
- Food
- Parking
- Facilities
- Volunteers
- Journey Performance

Time:

- Today
- Yesterday
- 7 Days
- Custom

Charts:

- Crowd Trends
- Food Supply vs Demand
- Parking Utilization
- Facility Usage
- Volunteer Activity
- Journey Performance

Include:

Key Operational Insights

Example:

"Zone 07 crowd increased 24% over the last hour."

Primary action:

Export Report

---

# 4.23 Audit Logs

Route:

`/admin/audit`

Filters:

- Date
- Actor
- Role
- Module
- Action
- Severity

Columns:

- Time
- Actor
- Role
- Module
- Object
- Action
- Previous State
- New State

Selecting an entry opens a detail drawer.

---

# 4.24 Settings

Route:

`/admin/settings`

Sections:

- General
- Zones & Locations
- Crowd Intelligence
- Food
- Parking
- Facilities
- Routes
- Notifications
- Languages
- Roles & Permissions
- Integrations
- System Health

System Health:

- API
- Database
- Realtime
- Maps
- AI Services

During MVP, services may display:

Ready

Not Configured

Simulated

---

# 5. Shared Component Architecture

Create reusable components:

```text
AppShell
Sidebar
TopBar
Breadcrumbs

MetricCard
MetricStrip

StatusBadge
SeverityBadge
TrendIndicator

DataTable
FilterBar
SearchInput
Pagination

MapPanel
MapLegend
MapLayerControl
MapMarker

DetailDrawer
ConfirmationDialog

FormSection
FormField

AlertBanner
ActivityFeed
Timeline

LoadingState
EmptyState
ErrorState
StaleDataState

Toast
```

Components must be reused across modules.

---

# 6. Data Architecture

The UI must consume the existing service layer.

Do not hardcode business data inside components.

Existing data/services should remain the source for:

- Crowd
- Kitchens
- Food
- Parking
- Facilities
- Places
- Routes
- Events
- Volunteers
- Alerts
- Users
- Audit

The current data is:

**DEMO / SIMULATED**

---

# 7. Future Integration Boundary

Current:

```text
UI
 ↓
Mock Service
 ↓
In-Memory Store
```

Future:

```text
UI
 ↓
Service Interface
 ↓
Supabase / API
 ↓
PostgreSQL
```

The UI should not need redesign when the backend changes.

---

# 8. Map Architecture

The map must be implemented as an abstraction.

Future integration:

```text
MapPanel
   ↓
MapLibre
   ↓
Nashik Monitor V2 geographic foundation
```

Do not create unnecessary competing map infrastructure.

---

# 9. Design Principles

The Admin Control Room should prioritize:

1. Situational awareness
2. Fast scanning
3. Clear severity
4. Clear actions
5. Geographic context
6. Data freshness
7. Consistency
8. Accessibility
9. Operational usefulness

The interface should feel:

**Professional + Calm + Precise + Operational**

Not:

**Decorative + Gamified + Generic SaaS**