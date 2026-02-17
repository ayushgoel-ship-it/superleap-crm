# SuperLeap CRM - Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** February 6, 2026  
**Product:** SuperLeap KAM CRM for CARS24 Dealer Referral Business

---

## Table of Contents

1. [Business Context](#business-context)
2. [Goals & Success Metrics](#goals--success-metrics)
3. [User Personas](#user-personas)
4. [Core Modules](#core-modules)
5. [Must-Have Behaviors](#must-have-behaviors)
6. [Filters & Time Scopes](#filters--time-scopes)
7. [Admin Dashboards](#admin-dashboards)
8. [Non-Goals](#non-goals)

---

## Business Context

### CARS24 Dealer Referral Model

**How it works:**
1. KAMs build relationships with used-car dealers in their city
2. Dealers share seller leads (customers selling cars) with CARS24
3. CARS24 inspects cars, makes offers, and buys cars if accepted
4. Dealers earn commissions on successful stock-ins
5. KAMs earn incentives based on performance

### Business Verticals

1. **C2B (Customer to Business)** - Customers selling cars to CARS24
2. **C2D (Customer to Dealer)** - Direct customer-dealer connections
3. **GS (Guaranteed Sale)** - CARS24 guarantees car sale
4. **DCF (Dealer Credit Facility)** - Loans to customers buying cars from dealers

### Business Metrics Hierarchy

```
CARS24 Business
├── Regions (NCR, West, South, East)
│   └── Team Leads (TLs)
│       └── Key Account Managers (KAMs)
│           └── Dealer Panel (20-30 dealers each)
│               └── Leads (Seller + Inventory + DCF)
│                   └── Funnel Stages
│                       └── Revenue
```

---

## Goals & Success Metrics

### Primary Goals

1. **Increase KAM Productivity**
   - Single cockpit for all dealer/lead/visit/call activities
   - Reduce time spent on manual tracking
   - Clear visibility into incentive earnings

2. **Improve Panel Health**
   - Track dealer engagement (calls, visits, leads)
   - Identify at-risk dealers early
   - Optimize visit planning with geofence + nearby dealers

3. **Enhance Accountability**
   - Mandatory call/visit feedback
   - TL review workflows for productivity
   - Audit trails for location updates

4. **Drive DCF Adoption**
   - Simplified DCF onboarding workflow
   - Clear commission visibility
   - Loan journey tracking

### Success Metrics

- **For KAMs:** Input Score ≥85, Stock-in achievement ≥90%, DCF disbursals growth
- **For TLs:** Team Input Score ≥80, Visit/Call coverage ≥80%, I2SI% improvement
- **For Business:** Revenue growth, Dealer retention, Lead quality improvement

---

## User Personas

### 1. Key Account Manager (KAM)

**Profile:**
- Age: 25-35
- Experience: 1-3 years in sales
- Tech comfort: Medium (uses smartphone daily)
- Work style: Field-based, visits 4-6 dealers/day

**Needs:**
- Quick dealer info access while on-field
- One-tap call/route to dealer
- Track today's visits/calls at a glance
- Know exactly how much incentive earned
- Clear next actions (pending feedback, overdue visits)

**Pain Points:**
- Too many apps to track activities
- Unclear incentive calculations
- Lost productivity data (manual Excel)
- Forget to log visit feedback

### 2. Team Lead (TL)

**Profile:**
- Age: 30-40
- Experience: 4-8 years (promoted KAM)
- Tech comfort: High
- Work style: Office + Field hybrid

**Needs:**
- Team performance at a glance
- Identify underperforming KAMs quickly
- Review call/visit quality
- Approve dealer location updates
- Project team incentive scenarios

**Pain Points:**
- Can't review all calls/visits manually
- No visibility into "why" KAM underperforming
- Manual incentive projections
- Late escalations (discover issues too late)

### 3. Admin (Business Leadership)

**Profile:**
- Age: 35-50
- Role: Regional Manager / Business Head
- Tech comfort: High
- Work style: Office-based

**Needs:**
- Business KPIs across all TLs/regions
- TL leaderboards with performance banding
- Export data for presentations
- Set/adjust targets quickly

**Pain Points:**
- Data scattered across Excel sheets
- No real-time visibility
- Manual report generation
- Can't drill down into TL performance

---

## Core Modules

### 1. Dealers Module

**Purpose:** Manage dealer panel, track engagement, create leads

**KAM Features:**
- Dealer list with filters (Channel, Status, Lead Giving, Date Range)
- Dealer cards showing: Last visit, Last contact, MTD performance
- Quick actions: Call, Navigate (Google Maps), Create Lead
- Dealer 360 view:
  - Profile (Name, Code, City, Contact, Location)
  - Performance (Leads, Inspections, Stock-ins, I2SI%, DCF status)
  - Visits history
  - Leads list
  - DCF onboarding status
- Update dealer location during visit check-in

**TL Features:**
- Same as KAM but for all team dealers
- Filter by KAM

**Admin Features:**
- Read-only view
- Dealer state metrics (Active/Inactive/At-risk)

### 2. Leads Module

**Purpose:** Track lead funnel, manage CEP, monitor conversions

**KAM Features:**
- Leads list with filters (Channel, Status, Date Range, Lead Type)
- Lead cards showing: Reg No, Make/Model, Customer, Stage, CEP
- Lead 360 view (LeadDetailPageV2):
  - Header: Reg No, Make/Model, Status badge, Channel badge
  - Customer info + contact CTA
  - KAM owner card (Campaign/Tele/KAM with contacts)
  - Lead timeline (Submitted → Appointment → Inspection → Stock-in)
  - CEP card (if available)
  - Action buttons: Add CEP, Call Customer, View Dealer
- Navigation from: Leads section, Dealer section, DCF section

**TL Features:**
- Same as KAM but for all team leads
- Filter by KAM

**Admin Features:**
- Lead source breakdown
- Conversion funnel metrics

### 3. Calls Module

**Purpose:** Execute calls with mandatory feedback, track productivity

**KAM Features:**
- **Today's Calls Hub:**
  - Shows dealers with calls due today
  - "Resume Feedback" for pending feedback calls
  - "Call Now" for new calls
  - Block new call attempts without feedback
- **Pre-Call Screen:**
  - Dealer context (last visit, last call summary)
  - Past call notes
  - "Start Call" CTA (opens native dialer)
- **Post-Call Feedback (Mandatory):**
  - Call outcome (Connected/Not Reachable/Busy/Call Back)
  - Car Sell discussion (Yes/No + details)
  - DCF discussion (Yes/No + status)
  - Notes
  - Next actions (Follow-up call, Schedule visit, etc.)
- **Call Attempt Tracking:**
  - Max 3 attempts per dealer per day
  - Each attempt must have feedback
  - Productivity auto-calculated (7-day window)

**TL Features:**
- **Call Review View:**
  - All team calls with KAM filter
  - Productive vs Non-productive segmentation
  - Call detail review (recording access mock, transcript, feedback)
  - Flag calls for attention
- **Call Coverage Metrics:**
  - Calls/KAM/day
  - Top/Tagged/Overall dealer coverage (Last 7 days)

**Admin Features:**
- Call volume trends
- Call coverage by TL/region
- Call detail modal (business view)

### 4. Visits Module

**Purpose:** Geofence check-in, in-visit tracking, feedback submission

**KAM Features:**
- **Today Tab:**
  - In-progress visits highlighted (green card)
  - Elapsed time counter
  - Priority ordering (In-progress → Upcoming → Suggested)
  - "Resume Visit" CTA for checked-in visits
  - "Start Visit" CTA for upcoming visits
- **Upcoming Tab:**
  - Planned visits for future days
- **Suggested Tab:**
  - Nearby dealers (geofence-based)
  - Last contact >7 days
  - Quick call & route CTAs
- **Visit Check-In:**
  - Geofence validation (within 100m)
  - Dealer context display
  - "Check In" CTA
  - Option to update dealer location (if geofence fails)
- **In-Visit Screen:**
  - Timer running
  - Discussion checklist: Car Sell, DCF, Payout
  - Notes capture
  - "Complete Visit" CTA
- **Visit Feedback (Mandatory):**
  - Meeting person
  - Car Sell discussion (Yes/No + outcome + expected leads)
  - DCF discussion (Yes/No + status)
  - Issues raised
  - Next actions + follow-up date
  - "Submit Feedback" CTA

**TL Features:**
- **Visit Review View:**
  - All team visits with KAM filter
  - Visit detail page (full summary + feedback)
  - Location update approvals
  - Visit coverage metrics
- **Location Update Approval:**
  - View old vs new location
  - Distance moved
  - GPS accuracy
  - Proof photo
  - Approve/Reject with reason

**Admin Features:**
- Visit volume trends
- Visit coverage by TL/region
- Visit detail modal (business view)

### 5. DCF Module

**Purpose:** Onboard dealers, track DCF leads/disbursals, commission visibility

**KAM Features:**
- **DCF Home:**
  - 4 metric cards: Onboarded Dealers, Lead Giving Dealers, Leads, Disbursals
  - Quick nav to dealers/leads/disbursals lists
- **DCF Dealers List:**
  - Filter: Onboarded vs Lead Giving
  - Dealer cards with onboarding/performance status
- **DCF Dealer Detail:**
  - Dealer info + NBFC partner
  - Onboarding stage (7-stage funnel or NOT_ONBOARDED)
  - Conversion owner contact
  - Commission summary
  - Performance metrics
- **DCF Dealer Onboarding Flow (NEW):**
  - State: NOT_ONBOARDED → Show benefits, document requirements, "Start Onboarding" CTA
  - State: PENDING_DOCS → Upload 6 documents (5 mandatory)
  - State: PENDING_APPROVAL → "Under Review" with timeline
  - State: REJECTED → Show reason, "Resubmit Documents" CTA
  - State: APPROVED → Normal DCF operations
- **DCF Leads List:**
  - 3 RAG states (Green/Amber/Red)
  - Lead cards with customer, dealer, car info
  - Status chips + channel chips
- **DCF Lead Detail:**
  - Top 3 flags: Current Stage, Channel (RAG colored), Book Type
  - Current State Summary: Status, Loan numbers, Parties, Commission
  - Loan Journey (collapsible): 8 stages with sub-stages
- **DCF Disbursals List:**
  - Disbursal cards with loan amount, date, status
  - UTR tracking, commission visibility

**TL Features:**
- Same as KAM but team-level
- KAM filter for drill-down

**Admin Features:**
- DCF funnel metrics
- Disbursals by TL/region

### 6. Incentives Module

**Purpose:** Real-time incentive calculation, what-if scenarios

**KAM Features:**
- **Incentive Calculator:**
  - Current MTD display (Stock-ins, DCF, I2SI%, Input Score)
  - Sliders: Extra SIs, Extra DCF, Improved I2SI%
  - Real-time impact calculation
  - Gates visibility (Input Score ≥75, SI achievement ≥90%)
  - Commission breakdown (Stock-in + DCF + I2SI Bonus)

**TL Features:**
- **Team Incentive Simulator:**
  - Current MTD vs Projected (Projected emphasized)
  - Team-level sliders
  - Gate status panel (I2SI%, TL Score, 100% target achievement)
  - Scenario summary with recommendations

**Admin Features:**
- View-only incentive summaries

### 7. Performance Module (TL Only)

**Purpose:** Team performance tracking, KAM leaderboards

**Features:**
- Team metrics (Stock-ins, I2SI%, DCF, Input Score)
- KAM tiles with RAG flags (Good/Poor performing)
- Time period filters (D-1, L7D, Last Month, MTD)
- Drill-down to KAM detail page

### 8. Admin Dashboard

**Purpose:** Business intelligence, TL leaderboards, exports

**Features:**
- **Home:**
  - Business KPIs (Stock-ins, Revenue, I2SI%, DCF Disbursals)
  - Sparkline trend charts
  - Comparison vs targets
- **TL Leaderboards:**
  - Color-coded performance banding (Green ≥90%, Amber ≥70%, Red <70%)
  - Sortable by metrics
  - Clickable → TL Detail Page
- **TL Detail Page:**
  - Performance timeline
  - KAM list with filters
  - Targets vs actuals
- **Regional Panels (Collapsible):**
  - Collapse/expand regions
  - Show/hide TL rows
- **Targets Modal:**
  - Set targets by TL
  - Input validation
- **Export Modal:**
  - Date range selection
  - Format (CSV/Excel/PDF)

---

## Must-Have Behaviors

### 1. Call Attempt → Feedback Flow

**Rule:** Every call attempt MUST have feedback before creating another attempt to the same dealer.

**Implementation:**
- `callAttemptEngine.ts` tracks attempts
- `CallFeedbackPage.tsx` enforces mandatory feedback
- `KAMCallsView.tsx` shows "Resume Feedback" instead of "Call Now" for pending feedback

**User Flow:**
1. KAM clicks "Call Now" on dealer
2. Pre-call screen shows dealer context
3. "Start Call" opens native dialer
4. After call ends, KAM MUST submit feedback
5. If KAM tries to call same dealer again without feedback → Blocked

### 2. Visit Check-in → Resume → Complete

**Rule:** Visit has 3 states (NOT_STARTED, CHECKED_IN, COMPLETED). Must check-in before completing.

**Implementation:**
- `visitEngine.ts` state machine
- `VisitCheckInPage.tsx` enforces geofence
- `VisitFeedbackPage.tsx` requires check-in state

**User Flow:**
1. KAM sees visit in "Today" tab
2. Clicks "Start Visit" → Check-in page
3. Geofence validation (within 100m)
4. Check-in successful → State = CHECKED_IN
5. In-visit screen shows with timer
6. KAM can close app and return later
7. Visit shows "Resume Visit" CTA in Today tab
8. On complete → Feedback form → State = COMPLETED

### 3. Location Update Governance

**Rule:** First location update auto-approved. Subsequent updates require TL approval.

**Implementation:**
- `LocationUpdateModal.tsx` captures GPS + autocomplete
- `mockDatabase.ts` tracks location history
- `TLLocationApprovalCard.tsx` TL approval UI

**User Flow:**
1. KAM checks in to visit → Geofence fails (dealer moved)
2. "Update Dealer Location" option appears
3. GPS auto-detect OR Google autocomplete
4. Distance moved calculated
5. Proof photo upload
6. If first update → Auto-approved
7. If subsequent → Sent to TL for approval
8. TL reviews: old vs new location, distance, photo
9. TL approves/rejects with reason
10. Audit trail maintained

### 4. Mandatory Feedback Validation

**Rule:** Cannot mark call/visit as complete without structured feedback.

**Implementation:**
- Form validation in `CallFeedbackForm.tsx`, `VisitFeedbackRedesigned.tsx`
- Conditional fields (Car Sell discussed? → Show outcome dropdown)
- Submit button disabled until all required fields filled

### 5. Lead Navigation Consistency

**Rule:** Lead cards from ALL sections (Leads, Dealer, DCF) must open the same LeadDetailPageV2.

**Implementation:**
- `LeadsPageV3.tsx` → onNavigateToLeadDetail → LeadDetailPageV2
- `Dealer360View.tsx` → onNavigateToLeadDetail → LeadDetailPageV2
- `DCFLeadsListPage.tsx` → onNavigateToLeadDetail → LeadDetailPageV2
- Back navigation returns to original context

### 6. DCF Onboarding State Machine

**Rule:** Dealer can only access DCF loans if onboarding status = APPROVED.

**States:**
- NOT_ONBOARDED → Show benefits + "Start Onboarding"
- PENDING_DOCS → Upload documents form
- PENDING_APPROVAL → "Under Review" message
- REJECTED → Show reason + "Resubmit"
- APPROVED → Full DCF functionality

---

## Filters & Time Scopes

### Common Filters Across Modules

**Dealers:**
- Channel: All, C2B, C2D, GS, DCF
- Status: All, Active, Inactive, At-risk
- Lead Giving: All, Yes, No
- Date Range: Custom picker

**Leads:**
- Channel: All, C2B, C2D, GS
- Status: All, Submitted, Appointment, Inspection, Stock-in, Lost
- Lead Type: All, Seller, Inventory
- Date Range: Custom picker

**Calls:**
- Status: All, Productive, Non-productive, Pending
- KAM Filter (TL view)
- Date Range

**Visits:**
- Status: All, Completed, In-progress, Upcoming
- KAM Filter (TL view)
- Date Range

**DCF:**
- Dealer Status: All, Onboarded, Lead Giving
- Loan Status: All, Pending, Approved, Disbursed, Rejected

### Time Period Filters

**Standard Periods:**
- Today
- D-1 (Yesterday)
- Last 7 Days (L7D)
- Last 30 Days (L30D)
- MTD (Month to Date)
- Last Month
- Last 6 Months
- Custom Range

**Admin Dashboard Specific:**
- Current Month
- Last Month
- Quarter (Q1, Q2, Q3, Q4)
- YTD (Year to Date)

---

## Admin Dashboards

### Admin Home - Business KPIs

**Layout:**
- 4 KPI cards (Stock-ins, Revenue, I2SI%, DCF Disbursals)
- Sparkline trend charts (7-day micro trends)
- % change vs last period
- Target achievement bars

**Interactions:**
- Click KPI card → Drill-down to detailed view
- Hover sparkline → Tooltip with exact values

### TL Leaderboards

**Layout:**
- Collapsible regional panels (NCR, West, South, East)
- TL rows with color-coded performance bands
- Columns: TL Name, Stock-ins, I2SI%, DCF, Input Score, Overall Rating
- Sort by any column (ascending/descending)

**Color Banding:**
- Green: ≥90% target achievement
- Amber: ≥70% and <90%
- Red: <70%

**Interactions:**
- Click TL row → TL Detail Page
- Click region header → Collapse/expand all TLs in region
- "Expand All" / "Collapse All" buttons

### TL Detail Page

**Layout:**
- Header: TL name, region, contact
- Performance timeline (line chart)
- Targets vs Actuals (bar chart)
- KAM list with filters (Name, Performance Flag)
- KAM cards: Input Score, Stock-ins, I2SI%, DCF

**Interactions:**
- Click KAM card → KAM Detail Page
- Filter KAMs by performance flag
- Adjust date range

### Targets Management Modal

**Layout:**
- Table with TL rows
- Editable input fields (Stock-in target, DCF target)
- Validation (must be positive integer)
- Save button

**Interactions:**
- Edit target inline
- Validation on blur
- Save all → Confirmation toast

### Export Modal

**Layout:**
- Date range picker (Start, End)
- Format selector (CSV, Excel, PDF)
- Entity selector (Dealers, Leads, Visits, Calls, DCF)
- Export button

**Interactions:**
- Select date range
- Select format
- Click "Export" → Mock download (toast confirmation)

---

## Non-Goals

**Out of Scope for V1:**

1. **Real Backend Integration**
   - API scaffolding exists but not connected
   - Focus is on UX/UI prototype

2. **Real-time Collaboration**
   - No websockets, no multi-user editing

3. **Advanced Analytics**
   - No predictive models, no ML-based insights

4. **Mobile App Native Features**
   - No push notifications (though PWA-ready)
   - No offline sync (client-side only)

5. **Dealer-Facing Interface**
   - Dealers don't log in (KAM-centric only)

6. **Payment Processing**
   - Commission calculations shown but no payout flow

7. **Advanced Geofencing**
   - Simple radius-based check, no complex polygon geofences

8. **CRM Integrations**
   - No Salesforce, HubSpot, or third-party CRM sync

**Future Considerations:**
- Backend API integration
- Real-time notifications
- Advanced reporting/BI tools
- Mobile native app (React Native)
- Dealer self-service portal
