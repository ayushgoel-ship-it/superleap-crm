# SuperLeap CRM - Technical Requirements & Architecture

**Version:** 2.0  
**Last Updated:** February 6, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [Central Mock Database](#central-mock-database)
4. [Selectors & DTO Pattern](#selectors--dto-pattern)
5. [Navigation System](#navigation-system)
6. [Auth & Permissions](#auth--permissions)
7. [Impersonation Model](#impersonation-model)
8. [Engines - Single Sources of Truth](#engines---single-sources-of-truth)
9. [Metrics Definitions](#metrics-definitions)
10. [Business Rules](#business-rules)

---

## Architecture Overview

### Tech Stack

```
Frontend:
├── React 18+ (TypeScript)
├── Vite (Build tool)
├── Tailwind CSS v4.0
├── Lucide React (Icons)
├── Recharts (Charts)
├── Sonner@2.0.3 (Toasts)
└── Motion/React (Animations)

State Management:
├── React useState/useEffect
├── Context API (Auth only)
└── Props drilling (intentionally simple)

No Backend:
├── Client-side only
├── Mock data in /data/mockDatabase.ts
└── localStorage for auth persistence
```

### Folder Structure

```
/
├── App.tsx                          # Main router + role-based navigation
├── components/
│   ├── pages/                       # Full-page components (60+ files)
│   ├── ui/                          # Reusable UI primitives (40+ files)
│   ├── calls/                       # Call module components
│   ├── visits/                      # Visit module components
│   ├── leads/                       # Lead module components
│   ├── dealers/                     # Dealer module components
│   ├── admin/                       # Admin dashboard components
│   ├── auth/                        # Auth & impersonation components
│   ├── dcf/                         # DCF onboarding components
│   └── shared/                      # Shared utilities
├── data/
│   ├── mockDatabase.ts              # ⭐ SINGLE SOURCE: All mock data
│   ├── selectors.ts                 # Data access layer
│   ├── dtoSelectors.ts              # DTO contract enforcement
│   ├── types.ts                     # Entity type definitions
│   ├── vcSelectors.ts               # Visit/Call specific selectors
│   └── adapters/                    # Legacy adapters (DO NOT USE)
├── lib/
│   ├── metricsEngine.ts             # ⭐ Metric calculations
│   ├── incentiveEngine.ts           # ⭐ Incentive logic
│   ├── productivityEngine.ts        # ⭐ Productivity rules
│   ├── activity/
│   │   ├── callAttemptEngine.ts     # Call attempt tracking
│   │   └── visitEngine.ts           # Visit state machine
│   ├── domain/
│   │   ├── constants.ts             # Business constants
│   │   └── metrics.ts               # Metric definitions
│   └── auth/                        # Auth services
├── navigation/
│   ├── routes.ts                    # ⭐ Route constants
│   ├── roleConfig.ts                # Role-based nav config
│   └── navigationHelper.ts          # Navigation utilities
├── contracts/                       # DTO contracts for UI components
├── auth/                            # Auth context & permissions
├── contexts/                        # React contexts (Activity)
├── api/                             # Backend API scaffolding (not connected)
├── utils/                           # Utility functions
└── styles/globals.css               # Tailwind v4 config
```

---

## Data Flow

### Canonical Flow: Engine → Selector → DTO → UI

```
┌──────────────┐
│   Engine     │  Calculation logic (metrics, incentives, productivity)
│ (lib/*.ts)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Mock Database│  Raw entities (Dealer, Lead, Call, Visit, etc.)
│ (data/*.ts)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Selectors   │  Data access functions (getDealerById, etc.)
│ (data/*.ts)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ DTO Selectors│  Transform raw entities → DTOs (contracts)
│(dtoSelectors)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ UI Components│  Consume DTOs only (NEVER raw entities)
│ (components/)│
└──────────────┘
```

### Rules

1. **UI components MUST consume DTOs, not raw entities**
   - ✅ `function DealerCard(props: { dealer: DealerDTO })`
   - ❌ `function DealerCard(props: { dealer: Dealer })`

2. **ALL data access goes through selectors**
   - ✅ `const dealer = getDealerById(id);`
   - ❌ `const dealer = DEALERS.find(d => d.id === id);`

3. **ALL calculations go through engines**
   - ✅ `const i2si = calculateI2SI(inspections, stockIns);`
   - ❌ `const i2si = (stockIns / inspections) * 100;`

4. **NO inline mock data in components**
   - ✅ Mock data in `/data/mockDatabase.ts` only
   - ❌ `const mockDealers = [...]` inside component

---

## Central Mock Database

**File:** `/data/mockDatabase.ts`

### Entity Types

```typescript
// Exported from /data/types.ts
export interface Dealer { ... }
export interface CallLog { ... }
export interface VisitLog { ... }
export interface Lead { ... }
export interface DCFLead { ... }
export interface TeamLead { ... }
export interface KAM { ... }
export interface LocationChangeRequest { ... }
```

### Mock Data Collections

```typescript
// All exported from /data/mockDatabase.ts
export const DEALERS: Dealer[]
export const CALLS: CallLog[]
export const VISITS: VisitLog[]
export const LEADS: Lead[]
export const DCF_LEADS: DCFLead[]
export const TEAM_LEADS: TeamLead[]
export const KAMS: KAM[]
export const LOCATION_REQUESTS: LocationChangeRequest[]
```

### ID Generation Rules

```typescript
// Canonical ID formats
makeDealerId(region, seq) → "dealer-ncr-001"
makeKAMId(region, seq) → "kam-ncr-01"
makeTLId(region, seq) → "tl-ncr-01"
makeCallId(timestamp, seq) → "call-1670000000-001"
makeVisitId(timestamp, seq) → "visit-1670000000-001"
makeLeadId(region, seq) → "lead-ncr-001"
```

### Legacy ID Mapping

```typescript
// Maps old IDs to new canonical format
export const LEGACY_ID_MAP: Record<string, string> = {
  'DLR001': makeDealerId('ncr', 1),
  'd1': makeDealerId('ncr', 1),
  // ... etc
};

// Normalization functions
export const normalizeDealerId = (id: string): string => LEGACY_ID_MAP[id] ?? id;
```

**Rule:** ALWAYS normalize IDs when accessing mock data from components.

---

## Selectors & DTO Pattern

### Selectors (Data Access Layer)

**File:** `/data/selectors.ts`

**Pattern:**
```typescript
// Get single entity by ID
export function getDealerById(id: string): Dealer | undefined

// Get filtered entities
export function getDealersByKAM(kamId: string): Dealer[]
export function getLeadsByDealerId(dealerId: string): Lead[]
export function getCallsByDealerId(dealerId: string): CallLog[]
export function getVisitsByDealerId(dealerId: string): VisitLog[]
export function getDCFLeadsByDealerId(dealerId: string): DCFLead[]

// Get related entities
export function getKAMByDealerId(dealerId: string): KAM | undefined
export function getTLByKAMId(kamId: string): TeamLead | undefined
```

### DTO Contracts

**File:** `/contracts/<module>.contract.ts`

**Example - Dealer DTO:**
```typescript
export interface DealerDTO {
  // Identity
  id: string;
  name: string;
  code: string;
  city: string;
  region: string;
  segment: DealerSegment;
  tags: DealerTag[];
  status: 'active' | 'dormant' | 'inactive';
  
  // Ownership
  kamId: string;
  kamName: string;
  tlId: string;
  
  // Contact
  phone?: string;
  email?: string;
  address?: string;
  
  // Business Metrics
  metrics: DealerMetricsDTO;
  
  // Productivity
  productivity: DealerProductivityDTO;
  
  // Engagement
  lastInteractionAt: Date | null;
  daysSinceLastVisit: number;
  daysSinceLastCall: number;
}
```

### DTO Selectors

**File:** `/data/dtoSelectors.ts`

**Pattern:**
```typescript
export function getDealerDTO(dealerId: string): DealerDTO | null {
  const dealer = getDealerById(dealerId);
  if (!dealer) return null;
  
  // Transform raw entity → DTO
  return {
    id: dealer.id,
    name: dealer.name,
    // ... map all fields
    metrics: calculateDealerMetrics(dealer),
    productivity: calculateDealerProductivity(dealer),
    daysSinceLastVisit: calculateDaysSince(dealer.lastVisit),
  };
}
```

**Rule:** UI components ONLY import from `/contracts/` and call DTO selectors.

---

## Navigation System

### Routes Constants

**File:** `/navigation/routes.ts`

```typescript
export const ROUTES = {
  HOME: '/',
  DEALERS: '/dealers',
  DEALER_DETAIL: '/dealers/:id',
  LEADS: '/leads',
  LEAD_DETAIL: '/leads/:id',
  CALLS: '/calls',
  CALL_DETAIL: '/calls/:id',
  CALL_FEEDBACK: '/calls/:id/feedback',
  VISITS: '/visits',
  VISIT_CHECK_IN: '/visits/:id/check-in',
  VISIT_FEEDBACK: '/visits/:id/feedback',
  DCF: '/dcf',
  DCF_DEALER_DETAIL: '/dcf/dealers/:id',
  DCF_LEAD_DETAIL: '/dcf/leads/:id',
  PERFORMANCE: '/performance',
  INCENTIVE_SIMULATOR: '/incentive-simulator',
  ADMIN: '/admin',
  ADMIN_TL_DETAIL: '/admin/tl/:id',
  // ... etc
} as const;
```

**Rule:** NEVER hardcode paths. Always use `ROUTES.PAGE_NAME`.

### Role Config

**File:** `/navigation/roleConfig.ts`

```typescript
export const getRoleConfig = (role: UserRole) => {
  switch (role) {
    case 'KAM':
      return {
        bottomNav: [
          { id: 'home', label: 'Home', icon: Home, route: ROUTES.HOME },
          { id: 'dealers', label: 'Dealers', icon: Users, route: ROUTES.DEALERS },
          { id: 'leads', label: 'Leads', icon: FileText, route: ROUTES.LEADS },
          { id: 'visits', label: 'Visits', icon: MapPin, route: ROUTES.VISITS },
          { id: 'dcf', label: 'DCF', icon: IndianRupee, route: ROUTES.DCF },
        ],
        hamburgerMenu: [
          { label: 'Performance', route: ROUTES.PERFORMANCE },
          { label: 'Incentive Simulator', route: ROUTES.INCENTIVE_SIMULATOR },
          { label: 'Leaderboard', route: ROUTES.LEADERBOARD },
          // ... etc
        ],
      };
    
    case 'TL':
      return {
        bottomNav: [
          { id: 'home', label: 'Home', icon: Home, route: ROUTES.HOME },
          { id: 'dealers', label: 'Dealers', icon: Users, route: ROUTES.DEALERS },
          { id: 'leads', label: 'Leads', icon: FileText, route: ROUTES.LEADS },
          { id: 'performance', label: 'Performance', icon: TrendingUp, route: ROUTES.PERFORMANCE },
          { id: 'dcf', label: 'DCF', icon: IndianRupee, route: ROUTES.DCF },
        ],
        hamburgerMenu: [
          { label: 'Visits & Calls', route: ROUTES.UNIFIED_VISITS },
          { label: 'Incentive Simulator', route: ROUTES.TL_INCENTIVE_SIMULATOR },
          // ... etc
        ],
      };
    
    case 'Admin':
      return {
        bottomNav: [
          { id: 'admin', label: 'Admin', icon: BarChart3, route: ROUTES.ADMIN },
        ],
        hamburgerMenu: [],
      };
  }
};
```

### Navigation Helper

**File:** `/navigation/navigationHelper.ts`

```typescript
export function navigateTo(route: string, params?: Record<string, string>) {
  // Replace route params
  let path = route;
  if (params) {
    Object.keys(params).forEach(key => {
      path = path.replace(`:${key}`, params[key]);
    });
  }
  window.location.hash = path;
}

// Example usage
navigateTo(ROUTES.DEALER_DETAIL, { id: dealer.id });
```

---

## Auth & Permissions

### Auth Context

**File:** `/auth/authContext.tsx`

```typescript
export interface AuthContextType {
  user: User | null;
  authRole: UserRole | null;         // Real role
  activeRole: UserRole | null;       // Current viewing role (impersonation)
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonateAs: (targetRole: UserRole, targetId?: string) => void;
  exitImpersonation: () => void;
}
```

### RequireAuth Guard

**File:** `/components/auth/RequireAuth.tsx`

```typescript
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} />;
  }
  
  return <>{children}</>;
}
```

### RequireProfileComplete Guard

**File:** `/components/auth/RequireProfileComplete.tsx`

```typescript
export function RequireProfileComplete({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  if (!user?.profileComplete) {
    return <Navigate to={ROUTES.PROFILE_COMPLETE} />;
  }
  
  return <>{children}</>;
}
```

### Permissions

**File:** `/auth/permissions.ts`

```typescript
export const can = (role: UserRole, action: string): boolean => {
  const permissions = {
    KAM: ['view_own_dealers', 'create_lead', 'execute_call', 'execute_visit'],
    TL: ['view_team_dealers', 'review_calls', 'approve_location', 'view_team_incentives'],
    Admin: ['view_all_data', 'set_targets', 'export_data', 'view_tl_leaderboards'],
  };
  
  return permissions[role]?.includes(action) ?? false;
};
```

---

## Impersonation Model

### Concept

**authRole** = User's real role (e.g., Admin)  
**activeRole** = Currently viewing as (e.g., KAM via impersonation)

### Implementation

**File:** `/lib/auth/impersonationTargets.ts`

```typescript
export function getImpersonationTargets(authRole: UserRole): ImpersonationTarget[] {
  if (authRole === 'Admin') {
    return [
      ...TEAM_LEADS.map(tl => ({ id: tl.id, name: tl.name, role: 'TL' as UserRole })),
      ...KAMS.map(kam => ({ id: kam.id, name: kam.name, role: 'KAM' as UserRole })),
    ];
  }
  
  if (authRole === 'TL') {
    const tl = TEAM_LEADS.find(t => t.id === currentUserId);
    const teamKAMs = KAMS.filter(kam => kam.tlId === tl?.id);
    return teamKAMs.map(kam => ({ id: kam.id, name: kam.name, role: 'KAM' as UserRole }));
  }
  
  return [];
}
```

### UI Indicator

**File:** `/components/auth/ImpersonationBanner.tsx`

Shows when `activeRole !== authRole`:
```
⚠ Viewing as [Target Name] (KAM) | Real Role: Admin | [Exit] button
```

---

## Engines - Single Sources of Truth

### 1. Metrics Engine

**File:** `/lib/metricsEngine.ts`

**Purpose:** ALL metric calculations (I2SI%, Input Score, DCF metrics)

```typescript
// I2SI% calculation
export function calculateI2SI(inspections: number, stockIns: number): number {
  if (inspections === 0) return 0;
  return Math.round((stockIns / inspections) * 100);
}

// Input Score calculation (4 components × 25 points)
export function calculateInputScore(data: InputScoreData): number {
  const visitScore = calculateVisitScore(data.visits, data.targetVisits);
  const connectScore = calculateConnectScore(data.connects, data.targetConnects);
  const inspectingScore = calculateInspectingScore(data.inspecting, data.targetInspecting);
  const siScore = calculateSIScore(data.stockIns, data.targetStockIns);
  
  return visitScore + connectScore + inspectingScore + siScore;
}

// DCF metrics
export function calculateDCFMetrics(dcfLeads: DCFLead[]): DCFMetrics {
  const onboarded = dcfLeads.filter(l => l.onboardingStatus === 'APPROVED').length;
  const disbursed = dcfLeads.filter(l => l.status === 'DISBURSED').length;
  const gmv = dcfLeads
    .filter(l => l.status === 'DISBURSED')
    .reduce((sum, l) => sum + (l.loanAmount || 0), 0);
  
  return { onboarded, disbursed, gmv };
}
```

**Rule:** NEVER calculate metrics inline. Always call engine functions.

### 2. Incentive Engine

**File:** `/lib/incentiveEngine.ts`

**Purpose:** KAM & TL incentive calculations with gates

```typescript
// KAM Incentive
export function calculateKAMIncentive(data: KAMIncentiveData): IncentiveBreakdown {
  // Master Gate: Input Score ≥75
  if (data.inputScore < 75) {
    return { total: 0, locked: true, reason: 'Input Score < 75' };
  }
  
  // Stock-in Incentive (Gate: ≥90% achievement)
  const siAchievement = data.stockIns / data.stockInTarget;
  const siIncentive = siAchievement >= 0.9 ? data.stockIns * 500 : 0;
  
  // DCF Incentive (No gate)
  const dcfIncentive = data.dcfDisbursals * 2000;
  
  // Base
  const baseIncentive = siIncentive + dcfIncentive;
  
  // I2SI Bonus (if I2SI > 15%)
  const i2siBonus = data.i2si > 15 
    ? baseIncentive * ((data.i2si - 15) * 0.05)
    : 0;
  
  return {
    total: baseIncentive + i2siBonus,
    breakdown: { siIncentive, dcfIncentive, i2siBonus },
  };
}

// TL Incentive (similar pattern with team-level gates)
export function calculateTLIncentive(data: TLIncentiveData): IncentiveBreakdown { ... }
```

**Rule:** ALL incentive logic goes here. UI just displays results.

### 3. Productivity Engine

**File:** `/lib/productivityEngine.ts`

**Purpose:** Call/Visit productivity evaluation (7-day window rule)

```typescript
export function evaluateProductivity(
  interactionType: 'CALL' | 'VISIT',
  interactionAt: Date,
  beforeSnapshot: MetricsSnapshot,
  afterSnapshot: MetricsSnapshot,
  now: Date
): ProductivityEvaluationResult {
  const daysSince = Math.floor((now.getTime() - interactionAt.getTime()) / (1000 * 60 * 60 * 24));
  const deltas = calculateDeltas(beforeSnapshot, afterSnapshot);
  
  // Rules:
  // - PRODUCTIVE: ANY delta > 0 within 7 days
  // - NON_PRODUCTIVE: 7+ days passed AND all deltas = 0
  // - PENDING: Within 7 days AND all deltas = 0
  
  const hasAnyDelta = Object.values(deltas).some(d => d > 0);
  
  if (hasAnyDelta) {
    return { status: 'PRODUCTIVE', daysSince, deltas };
  }
  
  if (daysSince >= 7) {
    return { status: 'NON_PRODUCTIVE', daysSince, deltas };
  }
  
  return { status: 'PENDING', daysSince, deltas };
}
```

**Rule:** Productivity is NEVER calculated inline. Always use this engine.

### 4. Call Attempt Engine

**File:** `/lib/activity/callAttemptEngine.ts`

**Purpose:** Track call attempts (max 3 per dealer per day, mandatory feedback)

```typescript
export function canAttemptCall(dealerId: string, kamId: string): CallAttemptValidation {
  const today = new Date().toISOString().split('T')[0];
  const todayCalls = getCallsByDealerId(dealerId).filter(c => 
    c.callDate.startsWith(today) && c.kamId === kamId
  );
  
  // Check for pending feedback
  const pendingFeedback = todayCalls.find(c => c.feedbackStatus === 'PENDING');
  if (pendingFeedback) {
    return { canAttempt: false, reason: 'Complete feedback for previous call first' };
  }
  
  // Check attempt limit
  if (todayCalls.length >= 3) {
    return { canAttempt: false, reason: 'Maximum 3 attempts per day reached' };
  }
  
  return { canAttempt: true };
}
```

### 5. Visit Engine

**File:** `/lib/activity/visitEngine.ts`

**Purpose:** Visit state machine (NOT_STARTED → CHECKED_IN → COMPLETED)

```typescript
export function canCheckIn(visit: VisitLog, currentLocation: GeolocationCoordinates): CheckInValidation {
  // Must be NOT_STARTED or CHECKED_IN (resume)
  if (visit.status === 'COMPLETED') {
    return { canCheckIn: false, reason: 'Visit already completed' };
  }
  
  // Geofence validation (100m radius)
  const distance = calculateDistance(
    currentLocation,
    { latitude: visit.dealerLatitude, longitude: visit.dealerLongitude }
  );
  
  if (distance > 100) {
    return { 
      canCheckIn: false, 
      reason: `Too far from dealer (${distance}m). Must be within 100m.`,
      showLocationUpdate: true,
    };
  }
  
  return { canCheckIn: true };
}
```

---

## Metrics Definitions

### Stock-in (SI)

**Definition:** Car successfully onboarded to CARS24 inventory after inspection and negotiation.

**Calculation:** Count of leads with `stage = 'Stock-in'` and `status = 'Converted'`

### Inspection to Stock-in % (I2SI%)

**Definition:** Conversion rate from inspection to stock-in.

**Formula:** `(Stock-ins / Inspections) × 100`

**Example:** 28 inspections, 18 stock-ins → I2SI% = 64.3%

### Total to Stock-in % (T2SI%)

**Definition:** Conversion rate from total leads to stock-in.

**Formula:** `(Stock-ins / Total Leads) × 100`

### Input Score

**Definition:** KAM activity quality score (0-100) with 4 components of 25 points each:

1. **Visits Component (25 points)**
   - Formula: `(Actual Visits / Target Visits) × 25`
   - Cap: 25 max

2. **Connects Component (25 points)**
   - Formula: `(Actual Connects / Target Connects) × 25`
   - Cap: 25 max

3. **Inspecting Dealers Component (25 points)**
   - Formula: `(Avg Inspecting Dealers / Target Inspecting Dealers) × 25`
   - Cap: 25 max

4. **Stock-ins Component (25 points)**
   - Formula: `(Actual Stock-ins / Target Stock-ins) × 25`
   - Cap: 25 max

**Total:** Sum of all 4 components (max 100)

**Thresholds:**
- ≥85: Green (Excellent)
- 75-84: Amber (Good)
- <75: Red (Needs Improvement) + Incentive locked

### DCF Metrics

**Onboarded Dealers:** Count of dealers with `dcfOnboardingStatus = 'APPROVED'`

**Lead Giving Dealers:** Count of onboarded dealers who submitted ≥1 DCF lead in period

**DCF Leads:** Count of DCF loan applications

**DCF Disbursals:** Count of loans with `status = 'DISBURSED'`

**DCF GMV (Gross Merchandise Value):** Sum of disbursed loan amounts

---

## Business Rules

### Call Rules

1. **Max 3 attempts per dealer per day**
2. **Mandatory feedback before next attempt to same dealer**
3. **Feedback structure:**
   - Call outcome (Connected/Not Reachable/Busy/Call Back)
   - Car Sell discussion (Yes/No + details)
   - DCF discussion (Yes/No + status)
   - Notes
   - Next actions

### Visit Rules

1. **Geofence check-in required (within 100m)**
2. **State progression: NOT_STARTED → CHECKED_IN → COMPLETED**
3. **Cannot complete without check-in**
4. **Mandatory feedback before marking complete**
5. **Location update governance:**
   - First update: Auto-approved
   - Subsequent: TL approval required

### Lead Rules

1. **Lead types: Seller, Inventory**
2. **Channels: C2B, C2D, GS**
3. **Funnel stages:**
   - Submitted
   - Appointment Scheduled
   - Inspection Done
   - Raised (offer made)
   - Stock-in (converted)
   - Lost

### DCF Rules

1. **Onboarding stages:**
   - NOT_ONBOARDED
   - PENDING_DOCS
   - PENDING_APPROVAL
   - REJECTED (can resubmit)
   - APPROVED

2. **Document requirements:**
   - Mandatory (5): PAN, GST, Bank Statement, Dealer Agreement, Address Proof
   - Optional (1): Cancelled Cheque

3. **Loan journey (8 funnels):**
   1. SOURCING (9 sub-stages)
   2. CREDIT (4 sub-stages)
   3. CONVERSION (6 sub-stages)
   4. BAJAJ (1 sub-stage)
   5. FULFILMENT (4 sub-stages)
   6. RISK (5 sub-stages)
   7. DISBURSAL (1 sub-stage)
   8. Car Docs (status card)

4. **Commission eligibility:**
   - Only disbursed loans
   - Base: 0.5% of loan amount
   - Booster: 2× if dealer's 1st disbursal
   - Not eligible if not disbursed or rules unmet

---

**End of TRD Document**
