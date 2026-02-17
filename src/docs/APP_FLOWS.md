# SuperLeap CRM — App Flows (Single Source of Truth)

**Last Updated:** February 11, 2026
**Source Files:** `navigation/routes.ts`, `navigation/roleConfig.ts`, `auth/permissions.ts`, `auth/authContext.tsx`, `App.tsx`, `lib/domain/constants.ts`, `contracts/*`, `data/dtoSelectors.ts`, `data/selectors.ts`, `data/vcSelectors.ts`, `docs/DECISIONS/*`

---

## 0. Glossary

| Term | Definition |
|------|-----------|
| **Lead** | A potential car transaction (buyer/seller) referred by a dealer. Identified by `leadId`. Progresses through stages (lead_created, inspection, stock-in, etc.). |
| **Dealer** | A used-car dealer in CARS24's referral network. Has a code (e.g., `GGN-001`), segment (A/B/C), tags, and is assigned to a KAM. |
| **KAM** | Key Account Manager. Field sales rep who manages dealers, makes calls/visits, and generates leads. |
| **TL** | Team Lead. Manages a team of KAMs. Has oversight on productivity, can approve location changes, and override productivity flags. |
| **Admin** | System administrator. Has full access, can impersonate KAM/TL, view org-wide data, manage users, and export data. |
| **Visit** | A physical dealer visit by a KAM. Includes geofence check-in, productivity assessment, and feedback. |
| **Call** | A phone call made by a KAM to a dealer. Includes duration, outcome, AI sentiment analysis, and productivity assessment. |
| **Incentive** | Monthly earnings for KAM/TL based on SI (Stock-In) achievement, input/quality score gates, and slab multipliers. |
| **Notification** | System alerts for lead stage changes, visit reminders, payout updates, etc. Displayed in NotificationCenterPage. |
| **DCF** | Dealer Car Finance. A loan product vertical where dealers get onboarded, leads are tracked through a disbursal funnel, and commissions are earned. |
| **OCB** | Online Car Buying. A business channel (not a primary CRM vertical in current implementation). |
| **C2B** | Consumer-to-Business. A business channel (seller leads). |
| **C2D** | Consumer-to-Dealer. A business channel (inventory/buyer leads). |
| **GS** | Gold Standard. A business channel / quality tier. |
| **SI** | Stock-In. The primary KPD metric — cars stocked in from dealer referrals. |
| **RAG** | Red-Amber-Green status indicator for metrics and leads. |
| **CEP** | Customer Expected Price. The price the customer expects to receive for their vehicle. Primary value metric on lead cards. If missing, it is treated as a high-priority action item for the KAM ("CEP Pending"). |
| **C24 Quote** | The price Cars24 offers the customer for their vehicle. Used for C2B, C2D, and GS channels. Displayed as the secondary value on lead cards (below CEP). Replaces the deprecated "Revenue" terminology. |
| **LTV** | Loan-To-Value / Loan amount approved for the customer. Used exclusively for the DCF channel. Displayed as the secondary value on lead cards (below CEP). Replaces the deprecated "Revenue" terminology. |

---

### 0.1 Terminology Decision: Revenue Removed

**Decision:** The term "Revenue" is intentionally NOT used anywhere in the SuperLeap CRM UI.

**Rationale:**
- "Revenue" implies CARS24 company earnings, which is not what KAMs track or act on.
- The correct concepts are:
  - **CEP** (Customer Expected Price) — what the customer wants (primary)
  - **C24 Quote** — what Cars24 offers back (secondary, for C2B/C2D/GS)
  - **LTV** — the loan amount approved (secondary, for DCF only)
- CEP is always the primary value. C24 Quote / LTV are comparison values.
- If CEP is missing ("CEP Pending"), it is a high-priority KAM action — surfaced with a red indicator on lead cards and a dedicated "CEP Pending" filter chip on the Leads page.

**Where this applies:**
- Lead cards (LeadPipelineCard): CEP primary, C24 Quote / LTV secondary
- Lead detail (LeadDetailPageV2): Snapshot KPIs, pricing section
- Leads page header (LeadsPageV3): No revenue in subtitle
- Sort options: "C24 Quote / LTV" replaces "Revenue"
- Performance page (PerformancePage): Dealer values shown as "C24 Quote"
- DCF Page (DCFPage): Comments and empty states use "disbursal" / "LTV", not "revenue"
- Admin pages (AdminLeadsPage, AdminDashboardPage): Use SI / CEP / Disbursals metrics, no "Revenue"
- All roles (KAM, TL, Admin) see identical terminology

### 0.2 CEP Pending — High-Priority KAM Workflow

**Definition:** A lead is "CEP Pending" when `cep` is `null` or `undefined` in the data model.

**Why it matters:**
- CEP (Customer Expected Price) is the single most important data point for lead qualification.
- Without CEP, the comparison value (C24 Quote / LTV) is meaningless.
- CEP Pending = KAM must take immediate action to capture the price.

**How it surfaces:**

1. **Pending Pill (LeadsPageV3)**
   - Compact pill, right-aligned next to channel filters (C2B / C2D / GS / DCF)
   - Red dot + "Pending" label + count badge (e.g. `Pending · 6`)
   - Subtle rose background with rose border when inactive; solid rose-600 when active
   - Hidden when count = 0 (no leads need CEP)
   - Clicking toggles `pendingMode` on/off — independent of channel/time filters

2. **Pending Mode Active State (LeadsPageV3)**
   - Rose indicator bar below header: "Showing CEP Pending leads · X results"
   - Small "Clear" button to exit pending mode
   - No extra banners or rows — just the inline indicator

3. **Lead Card Indicator (LeadPipelineCard)**
   - Rose left-border (3px) on cards with missing CEP
   - Inline "CEP" badge in red next to customer name
   - Key numbers strip shows "Pending" in rose-500 for CEP
   - Secondary value (C24 Quote / LTV) hidden (shown as "—")

4. **Lead Detail (LeadDetailPageV2)**
   - "CEP Pending" shown in rose-500 below pricing section
   - Snapshot KPI shows C24 Quote / LTV label (channel-correct)

5. **Empty State**
   - When Pending mode is active and count = 0:
   - Shows celebration emoji (🎉) and "No CEP pending leads"
   - Message: "All leads have CEP captured. Great work!"

**Pending is a mode, not a list segmentation:**
- Works across ALL channels (C2B, C2D, GS, DCF)
- Independent of time filter (MTD / Today / etc.) and channel filter
- Can be combined with any channel + stage selection

**Why "All", "Hot", and "Stale" filters are removed:**
- These were secondary analytical states that cluttered the primary action area
- TLs and KAMs prioritize *what is blocking progress* over passive categorization
- "Pending" (CEP Pending) is elevated because it has **direct KAM action dependency** — a lead cannot progress without CEP
- "Hot" (recent with CEP) and "Stale" (stuck > 7 days) are observable from the stage-grouped card view and don't require dedicated filter UI

### 0.3 TL Home — Team Operations Cockpit

**Purpose:** TL Home is an **action + coaching cockpit**, NOT a reporting dashboard. It mirrors the KAM Home structure but operates at team level, with clear separation between Stock-ins (SI) and DCF Disbursement, plus Productivity intelligence and Incentive transparency.

**How it differs from KAM Home:**
- KAM Home shows individual performance metrics (my stock-ins, my I2SI%, my incentive)
- TL Home shows team-aggregate metrics (team stock-ins vs target, team I2SI%, team avg input score)
- TL Home adds a "Who Needs Help" productivity section with per-KAM health cards
- TL Home shows TL-specific incentive slab structure (per-SI rate matrix)

**Section A: Team Performance Summary**

Two clearly separated metric groups:

1. **Stock-ins (Team):**
   - Team Stock-ins MTD — actual vs target, progress bar
   - I2SI% — actual vs target (15%), RAG indicator
   - Sub-metrics: Team Avg Input Score, % KAMs meeting I2SI target
   - Green only when target met; no mixed DCF data here

2. **DCF Disbursement (Team):**
   - DCF Onboardings MTD
   - DCF GMV (₹ in lakhs/crores)
   - Sub-metrics: Avg DCF onboardings per KAM, % KAMs contributing to DCF
   - No "Revenue" terminology; ₹ indicators only here

**Section B: Team Productivity — Who Needs Help**

Per-KAM health cards showing:
- Name, City
- I2SI%, Input Score, SI vs Target, DCF count
- Status tag: **On Track** (green), **Needs Attention** (amber), **Critical** (rose)

Status assignment rules:
- **Critical:** Input Score < 50, OR SI achievement < 60%, OR I2SI < 65% of target
- **Needs Attention:** Input Score < 70, OR SI achievement < 80%, OR I2SI < target
- **On Track:** All metrics at/above thresholds

Insight banners (auto-computed):
- "X KAMs below I2SI target" (amber)
- "X KAMs at risk of incentive loss (Score <70)" (rose)

Cards sorted: Critical first → Needs Attention → On Track.
Shows top 3 by default; "Review all X KAMs" CTA expands full list.

**Section C: TL Incentive Intelligence**

1. **Incentive Status:** Projected payout, achievement %, score gate status, risk alerts
2. **Per-SI Slab Visual (matrix table):**
   - Rows: Achievement % (<95%, 95%, 100%, 110%)
   - Columns: I2SI 12%, I2SI 15%
   - Rates: 95%@12%=₹100, 95%@15%=₹150, 110%@12%=₹200, 110%@15%=₹250
   - Current slab highlighted with indigo ring
3. **Boosters:** I2SI target achieved (+₹5,000), DCF onboarding (₹100 each), DCF GMV (GMV × 0.3%)
4. **Score-based Gating:** Score ≥70 = Full, 50–70 = Half, <50 = Zero
5. **Footnotes:** Incentive is per Stock-in; only 10% SB considered; gating at individual KAM level

**Time Filters:** D-1, L7D, Last Month, MTD (default). All three sections update on filter change.

**Source file:** `/components/pages/TLHomeView.tsx`

---

### 0.4 Balanced Performance Intelligence Model

**Decision:** Every major metric across TL Home, KAM Overview, and Admin Dashboard uses a two-layer performance hierarchy.

**Architecture:**

| Layer | Purpose | Visual Weight | Font Size |
|-------|---------|--------------|-----------|
| **L1 — Target Progress** | Primary commitment measure | Dominant (large numbers, progress bars, RAG badges) | 12–32px |
| **L2 — LMTD Momentum** | Secondary trajectory signal | Subtle (micro markers below bars) | ≤10px, grey text + colored arrow |

**Rules:**
1. LMTD must NEVER overpower target progress — it is always smaller, lighter, secondary.
2. LMTD markers appear BELOW progress bars or right-aligned under sub-metrics, never inline with main numbers.
3. Arrow color logic: ↑ green = improving vs last month, ↓ red = declining vs last month, — grey = flat (hidden).
4. Target + LMTD can diverge:
   - Target red + LMTD green → "Improving but still behind" — show both.
   - Target green + LMTD red → "Risk flag: on track but losing momentum" — show both.
5. No extra cards, no duplicate numbers, no side-by-side clutter for LMTD.

**Momentum Risk Detection:**

Inside TL Home's Team Productivity section, a "Declining vs LMTD" row counts KAMs where:
- Current SI achievement < 90% of target, AND
- Current SI achievement < LMTD SI achievement (negative trend)

This expandable inline row shows individual KAM deltas (e.g., "Sneha Verma ↓ 5%").

**KAM Overview Momentum Insight:**

Between the hero split cards and the Incentive Impact section, a micro insight line shows overall momentum:
- "Momentum: Improving vs last month" (green, when majority of metrics trending up)
- "Momentum: Slipping vs last month" (rose, when majority of metrics trending down)

**Admin Dashboard:**

Same LMTD marker format applied to Org-level metrics: SI, I2SI, C2D I2B, DCF Leads, DCF Onboardings, DCF Disbursements, DCF GMV.

**Rationale:**
- Targets define commitment — "What did we promise?"
- LMTD defines trajectory — "Are we getting better or worse?"
- Combined, they create leadership visibility without analytical clutter.
- Negative momentum detection is proactive control — catch slipping KAMs before they miss targets.

**Source files:**
- `/components/pages/TLHomeView.tsx` — Team Summary hero + Productivity Snapshot
- `/components/pages/KAMDetailPage.tsx` — Hero cards + Momentum insight line
- `/components/admin/AdminHomePage.tsx` — Business Summary metrics

---

## 1. Roles & Permissions Matrix

### 1.1 Route Access by Role

Defined in `navigation/roleConfig.ts` (`ROLE_CONFIGS`).

| Screen / Route | Key | KAM | TL | Admin | Admin (impersonating) |
|---------------|-----|-----|----|-------|----------------------|
| Home | `home` | Yes | Yes | Via impersonation | Yes |
| Dealers | `dealers` | Yes | Yes | Via impersonation | Yes |
| Leads | `leads` | Yes | Yes | Via impersonation | Yes |
| Visits/Calls | `visits` | Yes | Yes | Via impersonation | Yes |
| DCF Hub | `dcf` | Yes | Yes | Via impersonation | Yes |
| DCF Dealers | `dcf-dealers` | Yes | Yes | Via impersonation | Yes |
| DCF Leads | `dcf-leads` | Yes | Yes | Via impersonation | Yes |
| DCF Disbursals | `dcf-disbursals` | Yes | Yes | Via impersonation | Yes |
| DCF Dealer Detail | `dcf-dealer-detail` | Yes | Yes | Via impersonation | Yes |
| DCF Lead Detail | `dcf-lead-detail` | Yes | Yes | Via impersonation | Yes |
| DCF Onboarding Detail | `dcf-onboarding-detail` | Yes | Yes | Via impersonation | Yes |
| Performance | `performance` | Yes | Yes | Via impersonation | Yes |
| Productivity | `productivity` | Yes | Yes | Via impersonation | Yes |
| Leaderboard | `leaderboard` | Yes | Yes | Via impersonation | Yes |
| Incentive Simulator | `incentive-simulator` | Yes | Yes | Via impersonation | Yes |
| Call Feedback | `call-feedback` | Yes | Yes | Via impersonation | Yes |
| Visit Feedback | `visit-feedback` | Yes | Yes | Via impersonation | Yes |
| Profile | `profile` | Yes | Yes | Via impersonation | Yes |
| Notifications | `notifications` | Yes | Yes | Via impersonation | Yes |
| Admin Home | `admin-home` | No | No | Yes | N/A |
| Admin Dealers | `admin-dealers` | No | No | Yes | N/A |
| Admin Leads | `admin-leads` | No | No | Yes | N/A |
| Admin V/C | `admin-vc` | No | No | Yes | N/A |
| Admin DCF | `admin-dcf` | No | No | Yes | N/A |
| Admin Dashboard | `admin-dashboard` | No | No | Yes | N/A |
| Admin TL Detail | `admin-tl-detail` | No | No | Yes | N/A |
| Demo Pages | `demo-*` | No | No | Yes | N/A |

### 1.2 Action Permissions

Defined in `auth/permissions.ts` (`ROLE_PERMISSIONS`).

| Action Key | KAM | TL | ADMIN | Notes |
|-----------|-----|----|-------|-------|
| `IMPERSONATE` | No | No | Yes (authRole must be ADMIN) | Cannot be gained via impersonation |
| `APPROVE_LOCATION_CHANGE` | No | Yes | Yes | TL approves KAM requests |
| `EDIT_DEALER_LOCATION` | Yes | No | No | KAM requests, TL/Admin approves |
| `VIEW_ADMIN_SUMMARY` | No | No | Yes | |
| `VIEW_TEAM_VC` | No | Yes | Yes | TL sees own team; Admin sees all |
| `VIEW_AUDIT_LOG` | No | No | Yes | |
| `EXPORT_ADMIN_DATA` | No | No | Yes | |
| `EDIT_TARGETS` | No | No | Yes | |
| `VIEW_ALL_REGIONS` | No | No | Yes | |
| `OVERRIDE_PRODUCTIVITY` | No | Yes | Yes | |
| `MANAGE_USERS` | No | No | Yes | |

---

## 2. Route Map

Source: `lib/domain/constants.ts` (AppRoute enum), `navigation/routes.ts` (ROUTES), and `App.tsx` switch cases.

### 2.1 Mounted Routes (have App.tsx switch case)

| Route Constant | Key | Screen Component | Entry Points | Guard |
|---------------|-----|-----------------|-------------|-------|
| `AUTH_LOGIN` | `auth-login` | `LoginPage` | App launch (unauthenticated) | None |
| `AUTH_FORGOT_PASSWORD` | `auth-forgot-password` | `ForgotPasswordPage` | LoginPage | None |
| `PROFILE_COMPLETE` | `profile-complete` | `ProfileCompletePage` | RequireProfileComplete redirect | RequireAuth |
| `PROFILE` | `profile` | `ProfilePage` | MobileTopBar avatar, HomePage | RequireAuth + RequireProfileComplete |
| `INCENTIVE_SIMULATOR` | `incentive-simulator` | `IncentiveSimulator` | ProfilePage | RequireAuth + RequireProfileComplete |
| `HOME` | `home` | `HomePage` | Bottom nav, login redirect, default | RequireAuth + RequireProfileComplete |
| `DEALERS` | `dealers` | `DealersPage` (renders `DealerDetailPageV2` inline) | Bottom nav, HomePage metric cards | RequireAuth + RequireProfileComplete |
| `LEADS` | `leads` | `LeadsPageV3` | Bottom nav, HomePage | RequireAuth + RequireProfileComplete |
| `VISITS` | `visits` | `VisitsPage` (hosts `KAMVisitsViewNew` + `KAMCallsViewNew`) | Bottom nav | RequireAuth + RequireProfileComplete |
| (notifications) | `notifications` | `NotificationCenterPage` | MobileTopBar bell icon | RequireAuth + RequireProfileComplete |
| `DCF` | `dcf` | `DCFPage` | Bottom nav (DCF tab) | RequireAuth + RequireProfileComplete |
| `DCF_DEALERS` | `dcf-dealers` | `DCFDealersListPage` | DCFPage | RequireAuth + RequireProfileComplete |
| `DCF_LEADS` | `dcf-leads` | `DCFLeadsListPage` | DCFPage | RequireAuth + RequireProfileComplete |
| `DCF_DISBURSALS` | `dcf-disbursals` | `DCFDisbursalsListPage` | DCFPage | RequireAuth + RequireProfileComplete |
| `DCF_DEALER_DETAIL` | `dcf-dealer-detail` | `DCFDealerDetailPage` | DCFDealersListPage, DCFPage | RequireAuth + RequireProfileComplete |
| `DCF_LEAD_DETAIL` | `dcf-lead-detail` | `DCFLeadDetailPage` | DCFLeadsListPage | RequireAuth + RequireProfileComplete |
| `DCF_ONBOARDING_DETAIL` | `dcf-onboarding-detail` | `DCFDealerOnboardingDetailPage` | DCFPage | RequireAuth + RequireProfileComplete |
| `PERFORMANCE` | `performance` | `PerformancePage` | HomePage, bottom nav (indirect) | RequireAuth + RequireProfileComplete |
| `PRODUCTIVITY` | `productivity` | `ProductivityDashboard` | HomePage | RequireAuth + RequireProfileComplete |
| `LEADERBOARD` | `leaderboard` | `LeaderboardPage` | PerformancePage | RequireAuth + RequireProfileComplete |
| `CALL_FEEDBACK` | `call-feedback` | `CallFeedbackPage` | DealersPage (dealer detail), VisitsPage | RequireAuth + RequireProfileComplete |
| `VISIT_FEEDBACK` | `visit-feedback` | `VisitFeedbackPage` | DealersPage (dealer detail), VisitsPage | RequireAuth + RequireProfileComplete |
| `LEAD_DETAIL` | `lead-detail` | `LeadDetailPageV2` | LeadsPageV3, DealersPage, NotificationCenter (via adapter) | RequireAuth + RequireProfileComplete |
| `LEAD_CREATE` | `lead-create` | `LeadCreatePage` | DealersPage (dealer detail) | RequireAuth + RequireProfileComplete |
| `DCF_ONBOARDING` | `dcf-onboarding` | `DCFOnboardingPage` | DealersPage (dealer detail) | RequireAuth + RequireProfileComplete |
| `DEALER_LOCATION_UPDATE` | `dealer-location-update` | `DealerLocationUpdatePage` | DealersPage (dealer detail), VisitsPage | RequireAuth + RequireProfileComplete |
| `ADMIN_HOME` | `admin-home` | `AdminHomePage` | Admin bottom nav, login redirect (Admin) | RequireAuth + RequireProfileComplete |
| `ADMIN_DEALERS` | `admin-dealers` | `AdminDealersPage` | Admin bottom nav | RequireAuth + RequireProfileComplete |
| `ADMIN_LEADS` | `admin-leads` | `AdminLeadsPage` | Admin bottom nav | RequireAuth + RequireProfileComplete |
| `ADMIN_VC` | `admin-vc` | `AdminVCPage` | Admin bottom nav | RequireAuth + RequireProfileComplete |
| `ADMIN_DCF` | `admin-dcf` | `AdminDCFPage` | Admin bottom nav | RequireAuth + RequireProfileComplete |
| `ADMIN_DASHBOARD` | `admin-dashboard` | `AdminWorkspace` | AdminHomePage (legacy) | RequireAuth + RequireProfileComplete |
| `ADMIN_TL_LEADERBOARD` | `admin-tl-leaderboard` | `TLLeaderboardPage` | AdminWorkspace | RequireAuth + RequireProfileComplete |
| `ADMIN_TL_DETAIL` | `admin-tl-detail` | `TLDetailPage` | AdminWorkspace, TLLeaderboardPage | RequireAuth + RequireProfileComplete |
| `DEMO_LOCATION_UPDATE` | `demo-location-update` | `LocationUpdateDemoPage` | Admin only (direct nav) | RequireAuth + RequireProfileComplete |
| `DEMO_VISIT_FEEDBACK` | `demo-visit-feedback` | `VisitFeedbackDemo` | Admin only (direct nav) | RequireAuth + RequireProfileComplete |

### 2.2 Deprecated Routes (defined but unmounted — Phase 4.5)

These route constants exist in `AppRoute` enum / `ROUTES` with `@deprecated` markers. They have **no switch case** in App.tsx and **0 usage references** outside their definitions. Kept for type compatibility; candidates for removal in a future phase.

| Route Constant | Key | Reason for Deprecation |
|---------------|-----|----------------------|
| `VISIT_DETAIL` | `visit-detail` | Unmounted — visit detail handled inline by VisitsPage |
| `CALL_DETAIL` | `call-detail` | Unmounted — call detail handled inline by VisitsPage |
| `TL_CALL_DETAIL` | `tl-call-detail` | Unmounted — planned TL call review, never implemented |
| `VISIT_CHECKIN` | `visit-checkin` | Unmounted — check-in handled inline by VisitsPage |
| `DCF_ONBOARDING_FORM` | `dcf-onboarding-form` | Unmounted — `DCF_ONBOARDING` (`dcf-onboarding`) is the live route |

### 2.3 Route Parity Status

As of Phase 4.5, all live routes are reconciled:
- Every App.tsx switch case has a corresponding `AppRoute` enum constant and `ROUTES` entry
- Every non-deprecated `AppRoute` enum value has a corresponding App.tsx switch case
- All live routes are present in the appropriate `accessibleRoutes` arrays in `roleConfig.ts`

See `docs/DECISIONS/ROUTE_PARITY_PHASE4_5.md` for the full reconciliation audit.

---

## 3. Screen-by-Screen Flows

### 3.1 Authentication — LoginPage

- **Purpose:** User login with email/password
- **Route:** `auth-login`
- **Allowed roles:** All (pre-auth)
- **Entry points:** App launch when unauthenticated, logout redirect
- **Guard:** None
- **Required DTOs:** None (auth handled by `lib/auth/authService`)
- **Data sources:** `authService.login()` -> `AuthSession` + `UserProfile`
- **UI actions:**
  - Submit credentials -> `handleLoginSuccess(role)` -> navigate to `home` (KAM/TL) or `admin-home` (Admin)
  - "Forgot Password" -> `auth-forgot-password`
- **Empty/loading/error states:** Error toast on invalid credentials
- **Post-login routing:** Admin -> `admin-home`, TL -> `home` (userRole=TL), KAM -> `home` (userRole=KAM)

### 3.2 Authentication — ForgotPasswordPage

- **Purpose:** Password reset flow
- **Route:** `auth-forgot-password`
- **Allowed roles:** All (pre-auth)
- **Entry points:** LoginPage "Forgot Password" link
- **Guard:** None
- **UI actions:** Submit email -> success -> back to `auth-login`

### 3.3 Profile — ProfileCompletePage

- **Purpose:** First-time profile completion after login
- **Route:** `profile-complete`
- **Allowed roles:** All authenticated users with incomplete profiles
- **Entry points:** `RequireProfileComplete` redirect
- **Guard:** `RequireAuth`
- **UI actions:** Complete profile form -> `handleProfileComplete()` -> navigate to role-appropriate home

### 3.4 Profile — ProfilePage

- **Purpose:** View/edit user profile, access incentive simulator
- **Route:** `profile`
- **Allowed roles:** KAM, TL, Admin (impersonating)
- **Entry points:** MobileTopBar avatar/profile click
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **UI actions:**
  - Edit profile fields
  - Navigate to Incentive Simulator -> `incentive-simulator`
  - Back -> `home`

### 3.5 Home — HomePage

- **Purpose:** Role-aware dashboard with metric summary cards, quick actions, and navigation shortcuts
- **Route:** `home`
- **Allowed roles:** KAM, TL
- **Entry points:** Bottom nav "Home" tab, login redirect, default fallback
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** `IncentiveSummaryDTO`, `ProductivitySummaryDTO`, `DealerListItemDTO[]`
- **Data sources:** `dtoSelectors.getIncentiveSummaryDTO()`, `dtoSelectors.getProductivitySummaryDTO()`, `dtoSelectors.getDealerListDTOs()`
- **UI actions:**
  - Metric card taps -> `navigateToDealers(filter, context, filterContext)`
  - "View Productivity" -> `productivity`
  - Profile click -> `profile`
  - Notification bell -> `notifications`
- **Empty/loading/error states:** Metric cards show 0 values; no empty state (always has summary)

### 3.6 Dealers — DealersPage + DealerDetailPageV2

- **Purpose:** Browse, search, filter dealers; view dealer 360-degree detail inline
- **Route:** `dealers`
- **Allowed roles:** KAM, TL, Admin (impersonating)
- **Entry points:** Bottom nav "Dealers" tab, HomePage metric cards with filter context
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** `DealerListItemDTO[]`, `DealerDTO`, `Dealer360DTO`
- **Data sources:** `dtoSelectors.getDealerListDTOs()`, `dtoSelectors.getDealer360DTO(dealerId)`
- **Navigation params:** `dealersFilter`, `dealersNavigationContext`, `dealersFilterContext` (channel, status, leadGiving, dateRange)
- **UI actions (list view):**
  - Search dealers by name/code/city
  - Filter by segment (A/B/C), tags, status
  - Tap dealer card -> show `DealerDetailPageV2` inline
- **UI actions (detail view — DealerDetailPageV2):**
  - View dealer metrics (leads, inspections, stock-ins, I2SI)
  - View productivity (calls, visits)
  - View recent activity timeline
  - "Call" button -> phone dialer
  - "Log Call Feedback" -> `navigateToCallFeedback(callId)` -> `call-feedback`
  - "Log Visit Feedback" -> `navigateToVisitFeedback(visitId)` -> `visit-feedback`
  - "View Lead" -> `navigateToLeadDetail(leadId)` -> `lead-detail`
  - "Create Lead" -> `navigateToLeadCreate(dealerId)` -> `lead-create`
  - "DCF Onboarding" -> `navigateToDCFOnboarding(dealerId)` -> `dcf-onboarding`
  - "Update Location" -> `navigateToDealerLocationUpdate(dealerId)` -> `dealer-location-update`
  - Back -> dealer list
- **Decision doc:** `docs/DECISIONS/DEALER_DETAIL_DUPLICATE_DECISION.md` (Dealer360View archived, DealerDetailPageV2 canonical)

### 3.7 Leads — LeadsPageV3

- **Purpose:** Browse, search, filter leads across all channels (C2B, C2D, GS)
- **Route:** `leads`
- **Allowed roles:** KAM, TL, Admin (impersonating)
- **Entry points:** Bottom nav "Leads" tab, HomePage
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** `LeadCardVM` (via `leadAdapter.ts`)
- **Data sources:** `data/adapters/leadAdapter.ts` -> `toLeadListVM()`, `data/selectors.ts` -> `getLeadsByDealerId()`, `getAllLeads()`
- **Navigation params:** `leadsFilterContext` (channel, dateRange)
- **UI actions:**
  - Search leads by customer name, regNo, dealer
  - Filter by channel, stage, status
  - Tap lead card -> `onLeadClick(leadId)` -> `lead-detail`
- **Empty/loading/error states:** "No leads found" placeholder with suggestion text
- **Decision doc:** `docs/DECISIONS/LEAD_DETAIL_DUPLICATE_DECISION.md`

### 3.8 Lead Detail — LeadDetailPageV2

- **Purpose:** Full lead 360 view with stage info, timeline, pricing intelligence, and actions
- **Route:** `lead-detail`
- **Allowed roles:** KAM, TL, Admin (impersonating)
- **Entry points:**
  - LeadsPageV3 (tap lead card)
  - DealersPage / DealerDetailPageV2 (view lead action)
  - NotificationCenterPage (via `LeadDetailV2AdapterForNotifications` adapter)
  - App.tsx direct case (with `selectedLeadId`)
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** Internal lead data lookup by `leadId`
- **Data sources:** `data/selectors.ts` -> `getLeadById(leadId)`
- **Props:** `leadId: string`, `onBack: () => void`, `userRole: UserRole`
- **CTA Layout:** Three-button header row: **Call** | **WhatsApp** | **CEP Action**
  - CEP Pending → "Add CEP" (soft red gradient, "Action Required" badge)
  - CEP Available → "Edit CEP" (neutral indigo outline)
  - DCF channel → "Add LTV" / "Edit LTV"
- **CEP Micro Strip:** Below CTA row — shows "Captured" (green pill) or "Pending" (red animated pill)
- **CEP Intelligence Panel ("Pricing Alignment"):** Under Overview tab, below Customer/Dealer/Pricing card
  - When CEP + C24 Quote both present: shows CEP, C24 Quote, Gap (₹ + %)
  - CEP > C24 Quote → amber warning: "Customer expectation above internal quote"
  - CEP ≤ C24 Quote → green: "Margin cushion available"
  - CEP missing → red block: "CEP not captured — cannot evaluate negotiation strength"
  - DCF channel uses "LTV Expected" / "LTV Approved" labels
- **Journey stages (Token Removed):**
  Lead Created → 3CA → Inspection Scheduled → Inspection Done → HB Discovered → OCB Raised → PR Punched → Stock-in → Payout
  - No "Token Collected" stage — token flow does not exist in the current system
- **Smart CTA logic** (Next Best Action banner in overview):
  - Inspection Scheduled → "Confirm Inspection"
  - PLL → "Raise OCB"
  - PR → "Push PR"
  - Default → "Call Customer"
- **UI actions:**
  - View lead stage, sub-stage, status
  - View customer details, car details
  - View dealer context
  - CEP/LTV add/edit
  - Pricing gap analysis
  - Back -> origin page (stored in `feedbackOriginPage`)
- **Empty/loading/error states:** "Lead not found" fallback with back button (renders when `getLeadById` returns null)
- **Fallback behavior:** If `selectedLeadId` is null, redirects to HomePage
- **Decision docs:** `docs/DECISIONS/LEAD_DETAIL_DUPLICATE_DECISION.md`, `docs/DECISIONS/NOTIFICATIONCENTER_LEADDETAIL_MIGRATION.md`

### 3.9 Visits & Calls — VisitsPage

- **Purpose:** Unified V/C (Visits & Calls) management hub with KAM and TL sub-views
- **Route:** `visits`
- **Allowed roles:** KAM, TL
- **Entry points:** Bottom nav "V/C" tab
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** `CallDTO`, `VisitDTO`, `CallListItemDTO`, `VisitListItemDTO`
- **Data sources:** `data/vcSelectors.ts`, `data/dtoSelectors.ts`
- **Sub-components:**
  - `KAMVisitsViewNew` — KAM's visit management (today's visits, past visits, check-in flow)
  - `KAMCallsViewNew` — KAM's call log and management
  - TL sub-views for team oversight
- **UI actions:**
  - Toggle between Visits and Calls tabs
  - View today's scheduled visits
  - Start/resume visit -> inline check-in flow
  - View past visit history (7d, 30d, custom)
  - "Log Call Feedback" -> `navigateToCallFeedback(callId)` -> `call-feedback`
  - "Log Visit Feedback" -> `navigateToVisitFeedback(visitId)` -> `visit-feedback`
  - "Update Location" -> `navigateToLocationUpdate(dealerId)` -> `dealer-location-update`
- **Empty/loading/error states:** "No visits/calls" placeholder

### 3.10 Notifications — NotificationCenterPage

- **Purpose:** View and act on system notifications (lead alerts, visit reminders, payout updates)
- **Route:** `notifications`
- **Allowed roles:** KAM, TL
- **Entry points:** MobileTopBar bell icon
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** Internal notification/alert mock data
- **Data sources:** Hardcoded mock alerts within component (HighPriorityTab)
- **UI actions:**
  - View notification list (grouped by priority/type)
  - "View Lead" on alert -> `setSelectedLead({ regNo, customer, channel, leadType, currentStage })` -> renders `LeadDetailV2AdapterForNotifications`
  - Mark as read
  - Back to previous page
- **Notification -> Lead Detail flow:**
  1. User taps "View Lead" on notification alert
  2. `selectedLead` state set with `{ regNo, customer, channel, leadType, currentStage }`
  3. `LeadDetailV2AdapterForNotifications` adapter renders
  4. Adapter attempts leadId resolution: `getAllLeads()` lookup by `lead.id === regNo` || `lead.regNo === regNo` || `lead.registrationNumber === regNo`
  5. If resolved -> `LeadDetailPageV2` with real leadId
  6. If unresolved -> `LeadDetailPageV2` with regNo as leadId -> "Lead not found" fallback
  7. Back (`onBack`) -> clears `selectedLead` -> returns to notification list
- **Known limitation:** Mock alert regNo values (e.g., "C24-876542") don't match mock database lead IDs (e.g., "lead-ncr-1"). Result: "View Lead" always shows "Lead not found" fallback. See Section 4.1.
- **Decision doc:** `docs/DECISIONS/NOTIFICATIONCENTER_LEADDETAIL_MIGRATION.md`

### 3.11 Call Feedback — CallFeedbackPage

- **Purpose:** Log/review feedback for a specific call
- **Route:** `call-feedback`
- **Allowed roles:** KAM, TL
- **Entry points:** DealersPage (dealer detail actions), VisitsPage (call list actions)
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** `CallDetailDTO`
- **Data sources:** `dtoSelectors.getCallDetailDTO(callId)`
- **Props:** `callId: string`, `onBack: () => void`
- **UI actions:**
  - View call transcript, sentiment, auto-tags
  - Mark productive/non-productive
  - Add KAM comments
  - Add follow-up tasks
  - Back -> origin page (`feedbackOriginPage`)
- **Fallback:** If `selectedCallId` is null, renders HomePage

### 3.12 Visit Feedback — VisitFeedbackPage

- **Purpose:** Log/review feedback for a specific visit
- **Route:** `visit-feedback`
- **Allowed roles:** KAM, TL
- **Entry points:** DealersPage (dealer detail actions), VisitsPage (visit list actions)
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** `VisitDetailDTO`
- **Data sources:** `dtoSelectors.getVisitDetailDTO(visitId)`
- **Props:** `visitId: string`, `onBack: () => void`
- **UI actions:**
  - View geofence validation, location data
  - Mark productive/non-productive
  - Add outcomes, KAM comments
  - Add follow-up tasks
  - Back -> origin page (`feedbackOriginPage`)
- **Fallback:** If `selectedVisitId` is null, renders HomePage

### 3.13 Lead Create — LeadCreatePage

- **Purpose:** Create a new lead for a specific dealer
- **Route:** `lead-create`
- **Allowed roles:** KAM, TL
- **Entry points:** DealerDetailPageV2 "Create Lead" action
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Props:** `dealerId: string`, `onBack: () => void`, `onSuccess: (leadId) => void`
- **UI actions:**
  - Fill lead form (customer, car, channel)
  - Submit -> `handleLeadCreateSuccess(leadId)` -> navigate to `lead-detail` for the new lead
  - Back -> `dealers`
- **Fallback:** If `selectedDealerForLeadCreate` is null, renders HomePage

### 3.14 DCF Onboarding — DCFOnboardingPage

- **Purpose:** Onboard a dealer to the DCF (Dealer Car Finance) program
- **Route:** `dcf-onboarding`
- **Allowed roles:** KAM, TL
- **Entry points:** DealerDetailPageV2 "DCF Onboarding" action
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** `DCFDealerOnboardingDTO`
- **Props:** `dealerId: string`, `onBack: () => void`, `onComplete: () => void`
- **UI actions:**
  - Complete onboarding requirements checklist
  - Submit -> `handleDCFOnboardingComplete()` -> toast + navigate to `dealers`
  - Back -> `dealers`
- **Fallback:** If `selectedDealerForOnboarding` is null, renders HomePage

### 3.15 Dealer Location Update — DealerLocationUpdatePage

- **Purpose:** Request a dealer location correction (GPS/Google Maps)
- **Route:** `dealer-location-update`
- **Allowed roles:** KAM (action: `EDIT_DEALER_LOCATION`)
- **Entry points:** DealerDetailPageV2, VisitsPage
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Props:** `dealerId: string`, `onBack: () => void`, `onSuccess: () => void`
- **UI actions:**
  - Select new location (GPS, Google Maps search, manual pin)
  - Upload proof photo (required for 2nd+ updates)
  - Confirm and submit
  - First update: auto-approved (unless >2km movement)
  - Subsequent updates: requires TL approval (`APPROVE_LOCATION_CHANGE` action)
  - Back -> `dealers`
- **Fallback:** If `selectedDealerForLocation` is null, renders HomePage

### 3.16 DCF Hub — DCFPage

- **Purpose:** DCF vertical landing page with summary metrics, quick navigation to DCF sub-pages
- **Route:** `dcf`
- **Allowed roles:** KAM, TL
- **Entry points:** Bottom nav "DCF" tab
- **Guard:** `RequireAuth` + `RequireProfileComplete`
- **Required DTOs:** `DCFFunnelAnalyticsDTO`, `DCFCommissionSummaryDTO`
- **UI actions:**
  - View DCF summary metrics (leads, disbursals, GMV, commissions)
  - Navigate to DCF Dealers -> `dcf-dealers`
  - Navigate to DCF Leads -> `dcf-leads`
  - Navigate to DCF Disbursals -> `dcf-disbursals`
  - Navigate to DCF Dealer Detail -> `dcf-dealer-detail`
  - Navigate to DCF Onboarding Detail -> `dcf-onboarding-detail`
  - Change date range filter

### 3.17 DCF Dealers List — DCFDealersListPage

- **Purpose:** List DCF-enrolled dealers (onboarded or lead-giving)
- **Route:** `dcf-dealers`
- **Allowed roles:** KAM, TL
- **Entry points:** DCFPage
- **Required DTOs:** `DCFDealerOnboardingDTO[]`
- **UI actions:**
  - Filter by onboarded / lead-giving
  - Tap dealer -> `dcf-dealer-detail`
  - Back -> `dcf`

### 3.18 DCF Leads List — DCFLeadsListPage

- **Purpose:** List all DCF loan leads with funnel/status filters
- **Route:** `dcf-leads`
- **Entry points:** DCFPage
- **Required DTOs:** `DCFLeadListItemDTO[]`
- **UI actions:**
  - Filter by RAG status, funnel stage
  - Tap lead -> `dcf-lead-detail`
  - Back -> `dcf`

### 3.19 DCF Disbursals List — DCFDisbursalsListPage

- **Purpose:** View completed disbursals and commission breakdown
- **Route:** `dcf-disbursals`
- **Entry points:** DCFPage
- **Required DTOs:** `DCFCommissionBreakdownDTO[]`
- **UI actions:** View disbursal list, filter by date range. Back -> `dcf`

### 3.20 DCF Dealer Detail — DCFDealerDetailPage

- **Purpose:** Detailed view of a dealer's DCF performance
- **Route:** `dcf-dealer-detail`
- **Entry points:** DCFDealersListPage, DCFPage
- **Required DTOs:** `DCFDealerOnboardingDTO`, `DCFLeadListItemDTO[]`
- **Props:** `dealerId: string`, `dateRange: string`, `onBack: () => void`
- **UI actions:** View dealer DCF metrics, leads, commission. Back -> `dcf`

### 3.21 DCF Lead Detail — DCFLeadDetailPage

- **Purpose:** Detailed view of a single DCF loan lead
- **Route:** `dcf-lead-detail`
- **Entry points:** DCFLeadsListPage
- **Required DTOs:** `DCFLeadDetailDTO`
- **Props:** `loanId: string`, `onBack: () => void`
- **UI actions:** View loan details, timeline, risk assessment, commission breakdown. Back -> `dcf-leads`

### 3.22 DCF Onboarding Detail — DCFDealerOnboardingDetailPage

- **Purpose:** View onboarding progress for a specific dealer
- **Route:** `dcf-onboarding-detail`
- **Entry points:** DCFPage
- **Required DTOs:** `DCFDealerOnboardingDTO`
- **Props:** `dealerId: string`, `onBack: () => void`
- **UI actions:** View requirements checklist, completion status. Back -> `dcf`

### 3.23 Performance — PerformancePage

- **Purpose:** View performance metrics, SI achievement, incentive summary
- **Route:** `performance`
- **Allowed roles:** KAM, TL
- **Entry points:** HomePage, indirect navigation
- **Required DTOs:** `IncentiveSummaryDTO`, `IncentiveDetailDTO`
- **UI actions:**
  - View SI breakdown by channel (C2B, C2D, GS)
  - View current slab and multiplier
  - Navigate to Leaderboard -> `leaderboard`
  - Open TL Incentive dashboard -> `showTLIncentive` (TL role, renders `TLIncentiveDashboard`/`TLIncentiveMobile`)

### 3.24 Productivity — ProductivityDashboard

- **Purpose:** Detailed productivity metrics (input score, quality score, call/visit breakdown)
- **Route:** `productivity`
- **Entry points:** HomePage "View Productivity"
- **Required DTOs:** `ProductivityDetailDTO`
- **UI actions:** View scores, trends, red flags, evidence. Back -> `home`

### 3.25 Leaderboard — LeaderboardPage

- **Purpose:** KAM/TL ranking by earnings or productivity
- **Route:** `leaderboard`
- **Entry points:** PerformancePage
- **Required DTOs:** `IncentiveLeaderboardItemDTO[]`

### 3.26 Incentive Simulator — IncentiveSimulator

- **Purpose:** What-if analysis for incentive earnings
- **Route:** `incentive-simulator`
- **Entry points:** ProfilePage
- **Required DTOs:** `IncentiveDetailDTO`, `IncentiveScenarioDTO[]`
- **Props:** `userRole: UserRole`, `onClose: () => void`
- **UI actions:** Adjust SI, input score, quality score sliders -> see projected earnings. Close -> `profile`

### 3.27 Admin Home — AdminHomePage

- **Purpose:** Admin landing page with org-wide summary and navigation
- **Route:** `admin-home`
- **Allowed roles:** Admin only
- **Entry points:** Admin bottom nav, login redirect (Admin)
- **UI actions:** Navigate to admin sub-pages (`admin-dealers`, `admin-leads`, `admin-vc`, `admin-dcf`, `admin-dashboard`)

### 3.28 Admin Dealers — AdminDealersPage

- **Purpose:** Org-wide dealer management and analytics
- **Route:** `admin-dealers`
- **Allowed roles:** Admin only
- **Entry points:** Admin bottom nav

### 3.29 Admin Leads — AdminLeadsPage

- **Purpose:** Org-wide lead analytics and management
- **Route:** `admin-leads`
- **Allowed roles:** Admin only
- **Entry points:** Admin bottom nav

### 3.30 Admin V/C — AdminVCPage

- **Purpose:** Org-wide visits & calls analytics, team productivity overview
- **Route:** `admin-vc`
- **Allowed roles:** Admin only
- **Entry points:** Admin bottom nav

### 3.31 Admin DCF — AdminDCFPage

- **Purpose:** Org-wide DCF analytics, funnel metrics, commission tracking
- **Route:** `admin-dcf`
- **Allowed roles:** Admin only
- **Entry points:** Admin bottom nav

### 3.32 Admin Dashboard (Legacy) — AdminWorkspace

- **Purpose:** Comprehensive admin workspace with TL management, targets, exports
- **Route:** `admin-dashboard`
- **Allowed roles:** Admin only
- **Entry points:** AdminHomePage
- **UI actions:**
  - View TL leaderboard -> `admin-tl-leaderboard`
  - View TL detail -> `admin-tl-detail` (with `selectedTLId`)
  - Adjust targets modal
  - Export data modal

### 3.33 Admin TL Detail — TLDetailPage

- **Purpose:** Detailed view of a TL's team performance
- **Route:** `admin-tl-detail`
- **Allowed roles:** Admin only
- **Entry points:** AdminWorkspace, TLLeaderboardPage
- **Props:** `tlId: string`
- **UI actions:**
  - View team KAMs and their metrics
  - Adjust targets
  - Export team data
  - View individual KAM details
  - Back -> `admin-dashboard`

### 3.34 TL Incentive — TLIncentiveDashboard / TLIncentiveMobile

- **Purpose:** TL-specific incentive dashboard with team breakdown
- **Route:** N/A (overlay, controlled by `showTLIncentive` state)
- **Allowed roles:** TL
- **Entry points:** PerformancePage "Open TL Incentive" action
- **Required DTOs:** `TLIncentiveDTO`, `KAMIncentiveDTO[]`
- **UI actions:**
  - View team SI, individual KAM earnings
  - Toggle desktop/mobile view
  - Back -> dismisses overlay

### 3.35 Demo Pages

- **Route:** `demo-location-update`, `demo-visit-feedback`
- **Allowed roles:** Admin only
- **Purpose:** Interactive demos of location update and visit feedback flows

---

## 4. Deep Links & Edge Cases

### 4.1 Notifications "View Lead" — ID Resolution Gap

**Current behavior:**

1. NotificationCenterPage has hardcoded mock alert data with `regNo` values like `"C24-876542"`, `"C24-123456"`, etc.
2. User taps "View Lead" -> sets `selectedLead` with `{ regNo, customer, channel, leadType, currentStage }`
3. `LeadDetailV2AdapterForNotifications` receives these props and attempts lead ID resolution:
   - `getAllLeads()` returns all leads from mock database
   - Checks: `lead.id === regNo` || `lead.regNo === regNo` || `lead.registrationNumber === regNo`
4. Mock database leads have IDs like `"lead-ncr-1"`, `"lead-ncr-2"`, etc. — **no match** with `"C24-876542"` format
5. Fallback: passes `regNo` as `leadId` to `LeadDetailPageV2`
6. `LeadDetailPageV2` calls `getLeadById("C24-876542")` -> returns `undefined`
7. Result: **"Lead not found" fallback UI** with back button

**Future improvement required:**
- Map notification alert IDs to real mock database lead IDs
- OR update mock alerts to use actual lead IDs from the database
- See `docs/DECISIONS/NOTIFICATIONCENTER_LEADDETAIL_MIGRATION.md` Section 7

### 4.2 Navigation State Params — Contextual Filtering

Several screens accept navigation context for pre-filtering:

| Target Screen | Param | Source | Effect |
|--------------|-------|--------|--------|
| `dealers` | `dealersFilter` | HomePage metric cards | Pre-selects filter (e.g., "dormant") |
| `dealers` | `dealersFilterContext` | HomePage metric cards | Pre-sets channel/status filter |
| `dealers` | `dealersNavigationContext` | HomePage | Shows context banner (e.g., "Showing dormant dealers") |
| `leads` | `leadsFilterContext` | HomePage | Pre-sets channel/dateRange filter |
| `dcf-dealers` | `dcfDealersFilterType` | DCFPage | Pre-selects "onboarded" or "leadGiving" |

Context is cleared via `clearDealersContext()` / `clearLeadsContext()` when user manually navigates away.

### 4.3 Role Switch & Navigation Reset

When `activeRole` changes (e.g., Admin starts/stops impersonation):

1. `useEffect` detects `activeRole` change via `navigationKey`
2. Calls `getDefaultRoute(activeRole)` to get new home route
3. Resets `currentPage` to role-appropriate home
4. Clears ALL navigation state: filters, contexts, `showTLIncentive`
5. Source: `navigation/navigationHelper.ts` -> `shouldResetNavigationStack()`

### 4.4 Feedback Origin Tracking

Call/Visit feedback pages track their origin for correct back navigation:

1. Before navigating to `call-feedback` or `visit-feedback`, `feedbackOriginPage` is set to `currentPage`
2. On "Back", `handleFeedbackBack()` restores `currentPage` to `feedbackOriginPage`
3. This allows the same feedback page to be reached from different origins (dealers, visits) and return correctly

### 4.5 Dealer Detail — Inline Rendering (No Dedicated Route)

`DealerDetailPageV2` does NOT have its own route. It renders inline within `DealersPage` when a dealer is selected:

```
DealersPage (route: 'dealers')
  -> user selects dealer
  -> DealersPage renders <DealerDetailPageV2 ... /> instead of dealer list
  -> "Back" returns to dealer list (internal state, no route change)
```

### 4.6 Admin Bottom Nav vs KAM/TL Bottom Nav

App.tsx conditionally renders:
- `AdminBottomNav` when `activeRole === 'Admin'` AND on an admin page (`admin-home`, `admin-dealers`, etc.)
- `BottomNav` for all other cases (KAM/TL pages)

---

## 5. State Machines

### 5.1 Lead Status / Sub-Stage Transitions

Derived from mock data patterns in `data/mockDatabase.ts` and `data/types.ts`:

```
Lead Stages:
  lead_created -> inspection_scheduled -> inspection_done -> 
  negotiation -> stock_in -> sold

Lead Sub-Stages (within each stage):
  pending -> in_progress -> completed -> (next stage)

Overall Status:
  Active | Won | Lost | Expired
```

RAG status indicators:
- **Green:** On track, progressing normally
- **Amber:** Delayed, needs attention
- **Red:** At risk, stuck, or overdue

### 5.2 Visit Lifecycle

```
Not Started -> Check-In (geofence validated) -> In Progress -> 
  Visit Feedback Submitted -> Completed

Productivity Assessment:
  Geofence auto-check -> KAM self-assessment -> TL override (optional)
  
Visit Types: Planned | Unplanned
```

### 5.3 Call Lifecycle

```
Initiated -> Connected / No Answer / Busy / Left VM ->
  Call Feedback -> Productivity Assessment

Productivity Assessment:
  AI transcript analysis -> KAM self-assessment -> TL override (optional)
  
Sentiment: Positive | Neutral | Negative (AI-derived)
```

### 5.4 DCF Lead Funnel

```
Onboarding -> Lead Created -> CIBIL Check -> Doc Collection -> 
  Loan Sanctioned -> Disbursed

RAG Tracking: green (on track) | amber (delayed) | red (at risk)
Commission: Base + Booster (if first disbursal for dealer)
```

### 5.5 Location Update Flow

```
KAM Requests Update ->
  IF first update AND distance < 2km: Auto-Approved
  IF first update AND distance >= 2km: Pending TL Approval (high-risk flagged)
  IF subsequent update: Pending TL Approval

TL Reviews -> Approved | Rejected

While Pending: Check-in disabled for that dealer
```

### 5.6 Auth / Impersonation State Machine

```
Unauthenticated -> Login -> 
  IF profile incomplete: profile-complete
  IF profile complete: role-home

Admin Impersonation:
  Admin (admin-home) -> Start Impersonation (targetUserId, targetRole) ->
    Navigation resets to target role's home ->
    All pages render as target role ->
  Exit Impersonation ->
    Navigation resets to admin-home
```

---

## 6. Test Scenarios (20)

### Authentication & Guards

| # | Scenario | Flow | Expected |
|---|----------|------|----------|
| T1 | Unauthenticated user accesses any protected route | Direct nav to `dealers` | Redirect to `auth-login` |
| T2 | User with incomplete profile logs in | Login success -> RequireProfileComplete | Redirect to `profile-complete` |
| T3 | KAM tries to access admin route | Nav to `admin-home` | Access denied, redirect to `home` (via `hasAccessToRoute`) |
| T4 | Admin starts impersonation as KAM | Admin -> Start Impersonation -> KAM | Navigation resets to `home`, bottom nav shows KAM tabs, all pages render as KAM |

### Core Flows

| # | Scenario | Flow | Expected |
|---|----------|------|----------|
| T5 | KAM views dealer detail | `home` -> `dealers` -> tap dealer | DealerDetailPageV2 renders inline with correct DTOs |
| T6 | KAM creates a lead from dealer detail | `dealers` -> dealer detail -> "Create Lead" | `lead-create` -> fill form -> submit -> navigate to `lead-detail` for new lead |
| T7 | KAM views lead detail from leads list | `leads` -> tap lead card | `lead-detail` -> LeadDetailPageV2 with correct data |
| T8 | TL logs visit feedback from visits page | `visits` -> tap visit -> "Log Feedback" | `visit-feedback` -> VisitFeedbackPage -> back returns to `visits` |
| T9 | KAM logs call feedback from dealer detail | `dealers` -> dealer detail -> "Log Call" | `call-feedback` -> CallFeedbackPage -> back returns to `dealers` |

### DCF Flows

| # | Scenario | Flow | Expected |
|---|----------|------|----------|
| T10 | KAM navigates full DCF funnel | `dcf` -> `dcf-dealers` -> tap dealer -> `dcf-dealer-detail` | Each page renders with correct DTOs; back returns to previous DCF page |
| T11 | KAM onboards dealer to DCF | `dealers` -> dealer detail -> "DCF Onboarding" -> `dcf-onboarding` | Complete form -> toast "Dealer onboarded" -> return to `dealers` |
| T12 | KAM views DCF lead detail | `dcf` -> `dcf-leads` -> tap lead -> `dcf-lead-detail` | DCFLeadDetailPage with loan, timeline, risk, commission data |

### Notification Deep Links

| # | Scenario | Flow | Expected |
|---|----------|------|----------|
| T13 | "View Lead" on notification with unresolvable ID | `notifications` -> tap alert "View Lead" | LeadDetailV2AdapterForNotifications -> regNo lookup fails -> "Lead not found" fallback |
| T14 | Back from notification lead detail | T13 -> tap "Back" | Returns to notification list (selectedLead cleared) |

### Location Update

| # | Scenario | Flow | Expected |
|---|----------|------|----------|
| T15 | KAM first location update (<2km) | `dealers` -> dealer detail -> "Update Location" -> confirm | Auto-approved, success screen, return to `dealers` |
| T16 | KAM second location update | Same as T15 but 2nd time | "Requires TL approval" warning, proof photo required, submit -> pending status |

### Admin Flows

| # | Scenario | Flow | Expected |
|---|----------|------|----------|
| T17 | Admin views TL detail | `admin-home` -> `admin-dashboard` -> tap TL | `admin-tl-detail` with TL team data; back returns to `admin-dashboard` |
| T18 | Admin impersonates then exits | `admin-home` -> impersonate KAM -> see KAM home -> exit | Returns to `admin-home`, nav resets |

### Edge Cases

| # | Scenario | Flow | Expected |
|---|----------|------|----------|
| T19 | Navigate to `lead-detail` with no selectedLeadId | Direct set `currentPage = 'lead-detail'` without setting ID | Falls through to HomePage (fallback) |
| T20 | Contextual filter preserved through navigation | `home` -> metric card (dormant dealers) -> `dealers` | DealersPage shows pre-filtered "dormant" list with context banner |

---

## 7. Live API Integration (Phase A/B/C)

### 7.1 CEP Intelligence System

**Component:** `CEPModal.tsx` (`/components/leads/CEPModal.tsx`)

**Trigger conditions:**
1. User taps "Add CEP" / "Edit CEP" CTA on LeadDetailPageV2
2. Auto-open after CallFeedbackUnified save when CEP is missing

**Fields:**
- Customer Expected Price (₹ numeric input, auto-formatted INR)
- Confidence Level (dropdown: confirmed / estimated / dealer_told / approximate)
- Notes (optional free text)

**Auto-computed:**
- Pricing Alignment panel: CEP vs C24 Quote gap analysis
- Green = margin cushion (CEP < Quote), Red = risk (CEP > Quote)

**Backend:** `PATCH /crm-api/v1/leads/:lead_id/cep`
- Validates cep >= 1000 or null
- Updates lead in DB, returns updated_at

**Frontend flow:**
1. CEP modal opens → user enters price
2. Save → calls `updateLeadCEP()` from `crmApi.ts`
3. Success → local state updates → CEP Pending badge disappears
4. Pricing alignment auto-recalculates

### 7.2 Leaderboard Live

**Endpoint:** `GET /crm-api/v1/leaderboard`

**Rank formula:**
```
stockin_equiv = SI_count + (3 × DCF_disbursed_count)
rank_score = 0.60 × normalize(stockin_equiv) + 0.40 × normalize(projected_achievement%)
```

**UI elements:**
- Your Rank hero card (progress ring + behind text)
- KPI chips: Stock-ins, I2SI%, DCF Disbursed
- Top 3 podium
- Full rankings with LMTD micro-trend markers
- Scope toggle: KAM / TL (for TL/Admin views)

### 7.3 Incentive Engine

**Endpoint:** `GET /crm-api/v1/incentives/summary`

**TL Slab Matrix (₹/SI):**
| Achievement | I2SI <12% | 12-15% | >15% |
|-------------|-----------|--------|------|
| <95% | ₹400 | ₹500 | ₹600 |
| 95-110% | ₹600 | ₹800 | ₹1,000 |
| >110% | ₹800 | ₹1,100 | ₹1,400 |

**Boosters:** I2SI target +₹5,000 | DCF onboarding ₹100/each | DCF GMV × 0.3%
**Score Gate:** ≥70 = 100% | 50-70 = 50% | <50 = 0%

### 7.4 Unified Call Feedback Architecture

**Component:** `CallFeedbackUnified.tsx` (`/components/calls/CallFeedbackUnified.tsx`)

**System rule:** All calls in SuperLeap CRM funnel into this SINGLE form. No screen may create its own call feedback variant.

**Render modes:**
- `mode="page"` → full-screen page with back button
- `mode="sheet"` → bottom-sheet overlay

**Sources:**
- LeadDetailPageV2 → Call button → sheet mode → after save, auto-prompt CEPModal if CEP missing
- DealerDetailPageV2 → Call button → page mode
- Activity (V/C) → Call list → page mode

**Canonical fields:**
A. Call Context — outcome (mandatory: Connected / Not reachable / Busy / Callback)
B. Car Sell Discussion — toggle + outcome + leads estimate
C. DCF Discussion — toggle + status + leads estimate
D. Notes — free text
E. Next Actions — multi-select + follow-up date

### 7.5 Negative Trend Indicators

**Rule:** When current MTD is below LMTD pace OR below target pace, show a subtle "Negative trend" chip.

**Surfaces:**
- TLHomeView: Productivity section header (rose chip with ↓ icon)
- Leaderboard: LMTD delta arrows on each entry
- KAM cards in TL home: Momentum Risk expandable row

**Design:** One-line chip, no clutter — `text-[9px] font-bold text-rose-600 bg-rose-50`

---

## 8. Deprecated Concepts

| Concept | Status | Replacement |
|---------|--------|-------------|
| Token flow / Collect Token | **Removed** | CEP capture |
| Revenue (terminology) | **Removed** | CEP (primary), C24 Quote / LTV (secondary) |
| LeadCard.tsx / LeadCardV3.tsx | Archive candidate | LeadPipelineCard.tsx |
| KAMVisitsViewNew / KAMCallsViewNew | Archive candidate | — |

---

*End of APP_FLOWS.md*