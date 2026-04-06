# SuperLeap CRM - Quick Handoff Guide

**Project:** SuperLeap KAM CRM for CARS24 Dealer Referral Business  
**Status:** Production-ready prototype (client-side only)  
**Tech:** React 18 + TypeScript + Tailwind CSS v4 + Vite  
**Last Updated:** February 6, 2026

---

## What This App Is

SuperLeap is a comprehensive CRM for CARS24's Dealer Referral business where **Key Account Managers (KAMs)** manage panels of used-car dealers who share seller leads and inventory leads in exchange for commissions. The app serves as a single cockpit for KAMs and Team Leads to track panel health, funnel metrics, dealer visits, lead management, DCF onboarding, and performance targets.

**Business Verticals:** NGS (Non-Guaranteed Sale), GS (Guaranteed Sale), DCF (Dealer Credit Facility - loans for car buyers).

**User Roles:**
- **KAM (Key Account Manager):** Manages 20-30 dealers, executes visits/calls, tracks leads, earns incentives
- **TL (Team Lead):** Oversees 4-6 KAMs, reviews team performance, approves location updates
- **Admin:** Business-level dashboard with TL leaderboards and exports

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Access the app:**
- Local dev: `http://localhost:5173` (or port shown in terminal)
- No backend required - fully client-side prototype with mock data

**Role Switching:**
- Use the hamburger menu (☰) → "Switch Role" to toggle between KAM/TL/Admin views
- Or use impersonation feature to view as specific KAM/TL

---

## Folder Map (Top Folders/Files)

```
/
├── App.tsx                           # Main router + role-based navigation
├── components/
│   ├── pages/                        # Full-page components (60+ files)
│   ├── ui/                           # Reusable UI primitives (40+ files)
│   ├── calls/                        # Call module components
│   ├── visits/                       # Visit module components
│   ├── leads/                        # Lead module components
│   ├── dealers/                      # Dealer module components
│   ├── admin/                        # Admin dashboard components
│   ├── auth/                         # Auth & impersonation components
│   ├── dcf/                          # DCF onboarding components
│   └── shared/                       # Shared utilities
├── data/
│   ├── runtimeDB.ts                  # ⭐ SINGLE SOURCE: Supabase data cache
│   ├── supabaseRaw.ts                # Raw Supabase fetch layer
│   ├── selectors.ts                  # Data access layer
│   ├── canonicalMetrics.ts           # Stage classification & DCF metrics
│   ├── dtoSelectors.ts               # DTO contract enforcement
│   ├── types.ts                      # Entity type definitions
│   ├── adminOrgData.ts               # Admin org data accessors
│   └── adapters/                     # Data adapters (dcfAdapter, leadAdapter)
├── lib/
│   ├── metricsEngine.ts              # ⭐ SINGLE SOURCE: Metric calculations
│   ├── incentiveEngine.ts            # ⭐ SINGLE SOURCE: Incentive logic
│   ├── productivityEngine.ts         # ⭐ SINGLE SOURCE: Productivity rules
│   ├── metricsFromDB.ts              # Rank-based metrics from runtimeDB
│   ├── time/
│   │   └── resolveTimePeriod.ts      # ⭐ Canonical date range resolver
│   ├── domain/
│   │   ├── constants.ts              # Business constants
│   │   └── metrics.ts                # Metric definitions
│   └── activity/
│       ├── callAttemptEngine.ts      # Call attempt tracking
│       └── visitEngine.ts            # Visit state machine
├── navigation/
│   ├── routes.ts                     # ⭐ SINGLE SOURCE: Route constants
│   ├── roleConfig.ts                 # Role-based nav config
│   └── navigationHelper.ts           # Navigation utilities
├── contracts/                        # DTO contracts for UI components
├── auth/                             # Auth context & permissions
├── styles/globals.css                # Tailwind v4 config + tokens
└── docs/                             # ⭐ Canonical documentation (THIS FOLDER)
```

---

## Roles & Access

### Impersonation Model
- **authRole:** User's real role (e.g., Admin)
- **activeRole:** Currently viewing as (e.g., KAM via impersonation)
- **Impersonation targets:** Admins can view as any TL/KAM, TLs can view as their KAMs

### How to Impersonate
1. Click profile icon (top right)
2. Click "View As..." button
3. Select TL or KAM from dropdown
4. Interface switches to that user's view
5. Banner shows "Viewing as [Name]" with "Exit" button

---

## Where is the Single Source of Truth for...

| What | File | Rules |
|------|------|-------|
| **Data Cache** | `/data/runtimeDB.ts` | All dealers, leads, calls, visits, DCF data fetched from Supabase. Never inline data in components. |
| **Data Access** | `/data/selectors.ts` | ALL data queries go through selectors (getDealerById, getLeadsByDealerId, etc). |
| **DTO Contracts** | `/data/dtoSelectors.ts` + `/contracts/` | UI components consume DTOs, not raw entities. |
| **Metrics Calculations** | `/lib/metricsEngine.ts` | I2SI%, Input Score, DCF metrics - all calculated here. |
| **Incentive Logic** | `/lib/incentiveEngine.ts` | Projection, what-if scenarios, gates, tiers - all here. |
| **Productivity Rules** | `/lib/productivityEngine.ts` | Call/visit productivity deltas (7-day window rule). |
| **Routes** | `/navigation/routes.ts` | ROUTES constant - never hardcode paths. |
| **Role Config** | `/navigation/roleConfig.ts` | Bottom nav, hamburger menu items per role. |

---

## "Do Not Break" Workflows

### 1. **Calls Module: Attempt → Feedback Flow**
- **Rule:** Every call attempt MUST have feedback before creating another attempt
- **Files:** `callAttemptEngine.ts`, `CallFeedbackPage.tsx`, `KAMCallsView.tsx`
- **Test:** Try to call same dealer twice without feedback - should block

### 2. **Visits: Check-in → Resume → Complete**
- **Rule:** Visit has 3 states (NOT_STARTED, CHECKED_IN, COMPLETED). Can't complete without check-in.
- **Files:** `visitEngine.ts`, `VisitCheckInPage.tsx`, `VisitFeedbackPage.tsx`
- **Test:** Check in to visit → close app → reopen → should show "Resume Visit" in Today tab

### 3. **Leads Routing from Multiple Entry Points**
- **Rule:** Lead cards from Leads section, Dealer section, DCF section all open LeadDetailPageV2
- **Files:** `LeadsPageV3.tsx`, `Dealer360View.tsx`, `DCFLeadsListPage.tsx`, `LeadDetailPageV2.tsx`
- **Test:** Click lead card from each section → should open same detail page with proper back navigation

### 4. **Dealer Detail: Activity Links to V/C Detail**
- **Rule:** Call/Visit entries in dealer detail should open respective detail pages
- **Files:** `DealerDetailPageV2.tsx`, `CallFeedbackPage.tsx`, `VisitFeedbackPage.tsx`
- **Test:** Open dealer → Activity tab → click call entry → should open call feedback page

---

## How to Add a New Feature Safely

**Follow this flow (MANDATORY):**

1. **Engine Layer** (if metrics/calculations involved)
   - Add logic to `metricsEngine.ts` / `incentiveEngine.ts` / `productivityEngine.ts`
   - Write test cases in engine validation files

2. **Data Layer**
   - Ensure data is available via `/data/runtimeDB.ts` (fetched from Supabase)
   - Create selector in `/data/selectors.ts`
   - Define DTO contract in `/contracts/<module>.contract.ts`
   - Create DTO selector in `/data/dtoSelectors.ts`

3. **Navigation Layer** (if adding new page)
   - Add route constant to `/navigation/routes.ts`
   - Add to role config in `/navigation/roleConfig.ts`

4. **UI Layer**
   - Create component consuming DTOs (NOT raw entities)
   - Use selectors for data access
   - Use ROUTES constants for navigation
   - Follow mobile-first design

**❌ DO NOT:**
- Inline mock data in components
- Bypass selectors to access runtimeDB directly
- Create duplicate metric calculations
- Hardcode navigation paths
- Accept raw entities in UI components (use DTOs)

---

## Known Constraints

1. **Supabase Backend:** Data is fetched from Supabase and cached in `runtimeDB.ts`. The app is primarily client-side with a Supabase data layer.

2. **No Persistence:** Page refresh resets state. Use localStorage for critical state (auth does this).

3. **Role Switching:** Manual toggle in menu. Real app would have server-side session.

4. **Geofence:** Mock GPS coordinates. Real app needs `navigator.geolocation` permissions.

5. **File Uploads:** Mock only (DCF documents, visit photos). No actual file storage.

6. **Android Safety:** Performance guards in place (`/utils/platformSafety.ts`, `/utils/performance.ts`). Tested for PWA readiness.

---

## Quick Links to Other Docs

- **[PRD (Product Requirements)](./01_PRD.md)** - Business context, modules, personas
- **[TRD (Architecture)](./02_TRD_ARCHITECTURE.md)** - Data flow, engines, navigation rules
- **[QA Runbook](./03_QA_RUNBOOK.md)** - Test scripts, debug playbook
- **[Changelog](./04_CHANGELOG_PROMPTS.md)** - Prompt history, what changed when

---

**Need Help?** Check `/docs/03_QA_RUNBOOK.md` for common issues and debugging steps.
