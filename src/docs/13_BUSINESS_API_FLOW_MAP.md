# Business API Flow Map

**Date:** April 10, 2026  
**Purpose:** Authoritative D2 mapping from current screen behavior to target backend-owned business capabilities  
**Status:** Phase 1 D2 complete

---

## Scope And Defaults

- Main scope covers all mounted non-demo business and operational flows in the current app shell, including the admin desktop management console.
- Demo-only routes and removed routes are excluded from the main matrix.
- Auth and access-request workflows are captured in a short appendix, not in the main business-flow matrix.
- Capability IDs are workflow-oriented and intentionally not final URL designs.
- Target capability vocabulary:
  - `READ:<domain>:<intent>` for synchronous reads/query projections
  - `CMD:<domain>:<intent>` for synchronous user-initiated business commands
  - `JOB:<domain>:<intent>` for async processing, fan-out, bulk work, or export generation
- All target capabilities assume backend-owned auth, authorization, business logic, and data shaping.

## Capability Catalog

| Capability ID | Intent | Primary Surfaces |
| --- | --- | --- |
| `READ:dashboard:home-summary` | Role-aware home bootstrap with performance and dealer drill cards | `home` |
| `READ:dealer:portfolio` | Dealer list, filters, and scoped portfolio browsing | `dealers` |
| `READ:dealer:detail-360` | Dealer 360 detail with activity, leads, DCF, and action context | Dealer detail inline |
| `READ:lead:pipeline` | Lead list, filters, and scoped pipeline counts | `leads` |
| `READ:lead:detail` | Lead detail, pricing context, and journey state | `lead-detail` |
| `READ:activity:workspace` | Calls/visits feed, active state, and role-aware activity KPIs | `visits`, activity shells |
| `READ:notification:inbox` | Actionable alerts and deep-link metadata | `notifications` |
| `READ:dcf:hub-summary` | DCF summary metrics and navigation hub | `dcf` |
| `READ:dcf:dealer-directory` | DCF dealer lists and dealer selection context | `dcf-dealers` |
| `READ:dcf:lead-pipeline` | DCF lead/disbursal list views | `dcf-leads`, `dcf-disbursals` |
| `READ:dcf:detail-family` | DCF dealer, loan, and onboarding detail views | DCF detail routes |
| `READ:performance:summary` | Incentive and achievement summary | `performance` |
| `READ:productivity:detail` | Productivity detail and evidence | `productivity` |
| `READ:leaderboard:ranking` | Ranked KAM/TL performance views | `leaderboard`, admin TL ranking |
| `READ:incentive:scenario-projection` | What-if incentive simulation | `incentive-simulator` |
| `READ:admin:analytics-suite` | Admin overview and analytics across dealers, leads, activity, DCF, and TL drill-downs | `admin-home`, `admin-dealers`, `admin-leads`, `admin-vc`, `admin-dcf`, legacy admin TL/detail views |
| `READ:admin:user-management` | User workspace preload data | `admin-users` |
| `READ:admin:target-management` | Target workspace preload data | `admin-targets` |
| `READ:admin:hierarchy-management` | Hierarchy workspace preload data | `admin-hierarchy` |
| `READ:admin:export-catalog` | Export presets and custom export metadata | `admin-reports` |
| `READ:admin:config-and-audit` | Incentive config and audit history | `admin-settings` |
| `CMD:lead:pricing-update` | Capture or update CEP/LTV pricing data | Lead detail pricing CTA |
| `CMD:lead:create` | Create a new dealer lead | `lead-create` |
| `CMD:dealer:log-untagged` | Register an untagged dealer for field activity | KAM activity start tab |
| `CMD:dealer:top-tag-toggle` | Mark or unmark a dealer as top priority | Dealer detail |
| `CMD:call:register` | Start/log a call attempt | Dealer detail, lead detail, activity start |
| `CMD:call:submit-feedback` | Submit call outcome and follow-up context | Call feedback flows |
| `CMD:visit:start` | Start/check in to a visit | Activity start / visit execution |
| `CMD:visit:complete` | Complete a visit with feedback and proof metadata | Visit finish / visit feedback |
| `CMD:dcf:onboarding-submit` | Submit dealer onboarding to DCF workflow | `dcf-onboarding` |
| `CMD:dealer:location-update` | Set initial dealer location or request a location change | `dealer-location-update` |
| `CMD:notification:mark-read` | Persist notification acknowledgement | `notifications` |
| `CMD:admin:user-create` | Create a user and initial assignment | `admin-users` |
| `CMD:admin:user-manage` | Update, deactivate, or reactivate a user | `admin-users` |
| `CMD:admin:target-update` | Edit target values | `admin-targets` |
| `CMD:admin:target-initialize-month` | Seed targets for a month | `admin-targets` |
| `CMD:admin:hierarchy-manage` | Reassign KAM teams and dealer ownership | `admin-hierarchy` |
| `CMD:admin:dealer-kam-bulk-import` | Validate/apply dealer-KAM mappings at scale | `admin-hierarchy` |
| `CMD:admin:export-request` | Request a CSV export | `admin-reports` |
| `CMD:admin:config-update` | Update incentive slabs/rules | `admin-settings` |
| `JOB:notification:fanout` | Build and deliver notification records after business events | Internal |
| `JOB:activity:visit-proof-processing` | Upload/validate visit proof assets and retry failed submissions | Internal |
| `JOB:admin:csv-export` | Generate and audit export files | Internal |
| `JOB:admin:dealer-kam-bulk-import` | Execute bulk ownership changes after validation | Internal |

## Main Flow Matrix

### Read Flows

| Flow ID | Actor(s) | Source Screen(s) | Entry Trigger | Intent | Current Implementation Source | Inputs | Outputs / UI Result | Permissions + Data Scope | Side Effects | Sync / Async | Client Scope | Target Capability | Target Processor / Job | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `R1` | KAM, TL, Admin via impersonation | `HomePage` | Bottom nav home, login redirect, role reset | Show role-aware dashboard summary and drill-entry cards | `HomePage` + `metricsFromDB` + selector/DTO helpers | Active actor, role, default time window | KPI cards, quick actions, dealer drill links | KAM self scope; TL team scope; Admin only through impersonated actor | None beyond navigation context | Sync | `web+app` | `READ:dashboard:home-summary` | — | Should bundle dashboard, productivity, and incentive summary in one backend bootstrap read. |
| `R2` | KAM, TL, Admin via impersonation | `DealersPage` list view | Dealers tab, home drill cards | Browse and filter dealer portfolio | `DealersPage` + selectors/runtimeDB + inline filter context | Actor scope, search, tags, segment, status, context filters | Filtered dealer cards and banners | KAM own dealers; TL team dealers; Admin impersonated scope | None | Sync | `web+app` | `READ:dealer:portfolio` | — | Backend should expose workflow filters, not raw table columns. |
| `R3` | KAM, TL, Admin via impersonation | `DealerDetailPageV2` inline detail | Tap dealer card | Show dealer 360 with metrics, activity, leads, and DCF context | `DealerDetailPageV2` + selectors + canonical metrics + local activity context | Dealer id/code, actor scope, selected period | Inline 360 detail, timelines, action CTA context | Same scope as dealer portfolio | None | Sync | `web+app` | `READ:dealer:detail-360` | — | Target payload should include all action prerequisites so child pages do not re-query tables directly. |
| `R4` | KAM, TL, Admin via impersonation | `LeadsPageV3` | Leads tab, home navigation | Browse and filter lead pipeline | `LeadsPageV3` + `leadAdapter` + selector layer | Actor scope, channel, stage, status, search, filter context | Lead cards, counts, empty state | KAM own leads; TL team leads; Admin impersonated scope | None | Sync | `web+app` | `READ:lead:pipeline` | — | Includes CEP-pending filtering behavior. |
| `R5` | KAM, TL, Admin via impersonation | `LeadDetailPageV2` | Lead card tap, dealer detail, notifications adapter | Show full lead detail and pricing context | `LeadDetailPageV2` + lead selectors + local CEP state | Lead id | Lead overview, timeline, pricing alignment, CTA state | Assigned actor, manager, or impersonated admin scope | None | Sync | `web+app` | `READ:lead:detail` | — | Target read should support notification deep links with canonical ids. |
| `R6` | KAM, TL, Admin | `ActivityPage` -> `KAMActivityShell` / `TLActivityShell` / `AdminActivityShell` | Activity tab, indirect admin route | Read role-aware calls/visits feed and current activity state | Activity shells + `ActivityContext` + `visit.api` reads + runtime selectors | Actor, role, TL/KAM filters, time scope, dealer filter | Activity feed, summary strip, active visit/call state, scoped filters | KAM self; TL team/KAM scope; Admin org/TL/KAM filtered scope | Poll/focus refresh only | Sync | `web+app` | `READ:activity:workspace` | — | Primary direct-admin surface is `admin-vc`; the generic activity route still hosts mounted role-aware shells. |
| `R7` | KAM, TL | `NotificationCenterPage` | Bell icon | List alerts and deep-link into action context | Component-local mock alerts + lead-detail adapter fallback | Actor, selected alert | Grouped notification list and deep link CTA | Current actor only | Mark-read is local only today | Sync | `web+app` | `READ:notification:inbox` | `JOB:notification:fanout` | Current inbox is mock-backed; target must own actor-scoped records and canonical target ids. |
| `R8` | KAM, TL, Admin via impersonation | `DCFPage` | DCF tab | Show DCF summary and navigation hub | `DCFPage` + canonical DCF metrics + selectors | Actor scope, date range | Summary cards, nav cards, trend context | KAM own dealer scope; TL team scope; Admin impersonated scope | None | Sync | `web+app` | `READ:dcf:hub-summary` | — | Separate from list/detail capabilities. |
| `R9` | KAM, TL, Admin via impersonation | `DCFDealersListPage` | DCF hub -> dealers | List onboarded or lead-giving DCF dealers | DCF dealer list page + selectors/adapters | Actor scope, filter type, date range | Dealer list and detail navigation | Same DCF scope as hub | None | Sync | `web+app` | `READ:dcf:dealer-directory` | — | Needs business-oriented filtering, not raw onboarding flags. |
| `R10` | KAM, TL, Admin via impersonation | `DCFLeadsListPage`, `DCFDisbursalsListPage` | DCF hub -> leads/disbursals | Browse DCF leads and disbursal outcomes | DCF list pages + adapters/runtime data | Actor scope, stage/status/date filters | Lead list, disbursal list, detail navigation | Same DCF scope as hub | None | Sync | `web+app` | `READ:dcf:lead-pipeline` | — | Disbursals are a filtered projection of the broader DCF lead flow. |
| `R11` | KAM, TL, Admin via impersonation | `DCFDealerDetailPage`, `DCFLeadDetailPage`, `DCFDealerOnboardingDetailPage` | DCF list/detail navigation | Show dealer, loan, and onboarding detail views | DCF detail pages + runtime/adapters | Dealer id or loan id, actor scope, date range | Detail KPIs, timelines, commission or onboarding status | Same DCF scope as hub | None | Sync | `web+app` | `READ:dcf:detail-family` | — | Target backend may split this family into multiple endpoints, but the capability family is one D2 concern. |
| `R12` | KAM, TL | `PerformancePage` and TL incentive overlay entry | Home nav, internal CTA | Show achievement, payout, and slab status | `PerformancePage` + `metricsFromDB` + runtimeDB | Actor, role, current period | Incentive cards, SI breakdown, TL incentive entrypoint | KAM self; TL team/self summary | None | Sync | `web+app` | `READ:performance:summary` | — | TL overlay is part of the same business domain, even though it is not a route. |
| `R13` | KAM, TL | `ProductivityDashboard` | Home CTA | Show productivity detail and evidence | `ProductivityDashboard` + `ActivityContext` | Actor, period | Scores, trends, evidence, red flags | KAM self; TL team scope | None | Sync | `web+app` | `READ:productivity:detail` | — | Should consume the same underlying activity facts as the activity workspace. |
| `R14` | KAM, TL, Admin | `LeaderboardPage`, legacy admin TL ranking surfaces | Performance CTA, legacy admin drill | Rank KAMs/TLs by performance | `LeaderboardPage` + canonical metrics + selector helpers | Scope, time window, region/team/current actor | Rank hero, podium, full ranking list | KAM self-visible board; TL team/role board; Admin broader ranking view | None | Sync | `web+app` | `READ:leaderboard:ranking` | — | Admin TL leaderboard can consume the same ranking family with broader scope. |
| `R15` | KAM, TL | `IncentiveSimulator` | Profile -> simulator | Run what-if payout scenarios | `IncentiveSimulator` + local formulas/current metrics | Actor, scenario inputs, current baseline | Projected earnings and delta views | Self-service for current scoped actor | None | Sync | `web+app` | `READ:incentive:scenario-projection` | — | Target should keep incentive logic backend-owned even if the UI remains interactive. |
| `R16` | Admin | `AdminHomePage`, `AdminDealersPage`, `AdminLeadsPage`, `AdminVCPage`, `AdminDCFPage`, `TLDetailPage`, legacy `AdminWorkspace` | Admin nav, TL detail drill | Show org-wide analytics across dealers, leads, activity, DCF, and TL performance | Admin pages + `runtimeDB` + `adminOrgData` + `metricsFromDB` + canonical metrics | Time period, region, TL, page-level filters, selected TL | KPI dashboards, rankings, filtered lists, detail drills | Admin only; all-region default with region/TL narrowing | None | Sync | `web+app` | `READ:admin:analytics-suite` | — | D2 treats the legacy TL/detail surfaces as part of the same admin analytics family. |
| `R17` | Admin | `AdminUsersPage` | Desktop admin nav | Load user-management workspace state | `AdminUsersPage` + direct Supabase reads + team preload | Search, role filter | User table, team options, blocker modal inputs | Admin only | None on read | Sync | `web-only` | `READ:admin:user-management` | — | Read workspace must be separate from create/update commands. |
| `R18` | Admin | `AdminTargetsPage` | Desktop admin nav | Load target-management workspace state | `AdminTargetsPage` + direct Supabase reads + rollup computation | Month, tab (`core` / `dcf`) | Editable grid, team rollups, unsaved state | Admin only | None on read | Sync | `web-only` | `READ:admin:target-management` | — | Backend should return both rows and rollup-ready metadata. |
| `R19` | Admin | `AdminHierarchyPage` | Desktop admin nav | Load hierarchy-management workspace state | `AdminHierarchyPage` + direct Supabase reads + selector lookups | Tab, search, city/KAM filters, selected rows | Org tree, reassignment tables, preview context | Admin only | None on read | Sync | `web-only` | `READ:admin:hierarchy-management` | — | Covers org tree, KAM↔TL, and dealer↔KAM management surfaces. |
| `R20` | Admin | `AdminReportsPage` | Desktop admin nav | Load export presets and field catalog | `AdminReportsPage` + static catalog + export command helper | Entity selection, field list, filter metadata | Preset cards and custom export builder | Admin only | None until export is requested | Sync | `web-only` | `READ:admin:export-catalog` | — | Backend should eventually own canonical exportable field catalogs. |
| `R21` | Admin | `AdminSettingsPage` | Desktop admin nav | Load incentive config and audit history | `AdminSettingsPage` + direct Supabase reads | Selected tab, existing rules/slabs | Editable settings tables and audit log | Admin only | None on read | Sync | `web-only` | `READ:admin:config-and-audit` | — | Read model should bundle rules, slabs, and recent audit events. |

### Command Flows

| Flow ID | Actor(s) | Source Screen(s) | Entry Trigger | Intent | Current Implementation Source | Inputs | Outputs / UI Result | Permissions + Data Scope | Side Effects | Sync / Async | Client Scope | Target Capability | Target Processor / Job | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `C1` | KAM, TL, Admin via impersonation | `LeadDetailPageV2` + `CEPModal` | Add/Edit CEP or LTV CTA, auto-open after call flow | Capture or update pricing signal | `CEPModal` + `LeadDetailPageV2` + `crmApi.updateLeadCEP()` | Lead id, CEP/LTV amount, confidence, notes, channel | Updated pricing panel, CTA state, pending badge cleared | Assigned actor or scoped manager/admin | Persist pricing data and refresh detail state | Sync | `web+app` | `CMD:lead:pricing-update` | — | Current implementation persists amount only; confidence and notes remain local UI state. |
| `C2` | KAM, TL | `LeadCreatePage` | Dealer detail -> Create Lead | Create a new dealer lead | `LeadCreatePage` direct insert to `leads_raw` | Dealer id, channel, customer, vehicle, expected price, notes | Success toast and navigation to lead detail | Scoped dealer access only | Creates lead, advances workflow, may fan out alerts | Sync | `web+app` | `CMD:lead:create` | `JOB:notification:fanout` | Target command should return canonical lead id and initial workflow state. |
| `C3` | KAM | `KAMStartTab` / `UntaggedDealerSheet` | “Log untagged dealer” CTA | Register an untagged dealer for field activity | `UntaggedDealerSheet` + `createUntaggedDealer()` | Name, phone, optional city/region/address/notes | Untagged dealer becomes available to activity flow | KAM self scope | Creates/upserts untagged dealer registry record | Sync | `web+app` | `CMD:dealer:log-untagged` | — | This is an operational business flow, not just helper data entry. |
| `C4` | KAM, TL, Admin via impersonation | `DealerDetailPageV2` | Top dealer toggle | Mark or unmark dealer as top priority | Local toggle + `setDealerIsTop()` write | Dealer code, target flag | Badge/button state updates | Visible scoped dealer only | Updates dealer priority flag | Sync | `web+app` | `CMD:dealer:top-tag-toggle` | — | Target should keep this as a business label, not a raw table write from the screen. |
| `C5` | KAM, TL, Admin via impersonation | `KAMStartTab`, `DealerDetailPageV2`, `LeadDetailPageV2` | Call action / dialer entry | Register a call attempt and seed follow-up feedback flow | `useCanonicalCallFlow` + `ActivityContext.addCall()` + `visit.api.registerCall()` | Dealer identity, actor, optional phone/duration/context | Pending call row, feedback modal/page, refreshed activity strip | Scoped dealer access; mainly KAM-owned execution | Persists call attempt and opens device dialer | Sync | `app-only` | `CMD:call:register` | — | All call entrypoints should converge on one business command family. |
| `C6` | KAM, TL, Admin via impersonation | `UnifiedFeedbackModal`, `CallFeedbackPage` | Save call feedback | Capture call outcome, productivity, and next steps | `submitCallFeedback()` + `ActivityContext.updateCall()` | Call id, outcome, notes, productivity context, lead/DCF discussion, rating, follow-up info | Completed call state, toasts, refreshed activity | Call owner or scoped reviewer | Updates call record; may open CEP prompt; may create downstream tasks/alerts | Sync | `web+app` | `CMD:call:submit-feedback` | `JOB:notification:fanout` | `LeadDetailPageV2` currently re-registers a call before feedback; target should remove duplicate command paths. |
| `C7` | KAM | Activity visit execution surfaces | Start/resume visit / check-in | Start a field visit with location context | `ActivityContext.addVisit()` + `visit.api.startVisit()` | Dealer identity, actor, geo coordinates, verification context | Active visit state and pinned finish action | KAM self on scoped dealer | Creates visit row and active visit state | Sync | `app-only` | `CMD:visit:start` | — | Visit start is a field-execution capability, not a generic CRUD insert. |
| `C8` | KAM | `VisitsTabContent`, `VisitFeedbackPage` | Finish Visit -> submit feedback | Complete a visit and persist unified feedback | `VisitsTabContent.handleSubmitFeedback()` + `visit.api.submitVisitFeedback()` + optional `uploadVisitPhoto()` | Visit id, interaction feedback, notes, rating, optional proof/photo metadata | Visit closes, success toast, activity refresh | KAM self on active visit | Writes feedback/check-out, optional proof upload, retry-queue fallback on failure | Sync | `app-only` | `CMD:visit:complete` | `JOB:activity:visit-proof-processing` | Current UI splits finish intent and feedback modal, but the business write happens at feedback submission. |
| `C9` | KAM, TL | `DCFOnboardingPage` | Dealer detail -> DCF Onboarding | Submit a dealer onboarding package to the DCF program | `DCFOnboardingPage` direct insert to `dcf_onboarding` | Dealer id, submitter, onboarding form values, doc metadata | Success toast and return to dealers | Scoped dealer access | Creates onboarding request/record and eventual onboarding state | Sync | `web+app` | `CMD:dcf:onboarding-submit` | `JOB:notification:fanout` | Current form captures more fields than are persisted; target API should own the full workflow contract. |
| `C10` | KAM | `DealerLocationUpdatePage` | Dealer detail / activity -> Update Location | Set initial dealer location or request a change | `DealerLocationUpdatePage` direct `dealers_master` update or `location_change_requests` insert | Dealer id, actor, lat/lng, address, current-state branch | Success toast and return to dealers; pending-approval messaging when needed | KAM submit only; TL/Admin approval happens later | Immediate location write for first set or creation of approval request | Sync | `app-only` | `CMD:dealer:location-update` | `JOB:notification:fanout` | Flow docs mention proof-photo gating; current implementation only persists coordinates/address. |
| `C11` | KAM, TL | `NotificationCenterPage` | Mark-as-read action | Acknowledge an alert | Local notification component state only | Notification id | Visual read state | Current actor only | No persisted side effect today | Sync | `web+app` | `CMD:notification:mark-read` | — | Target backend should persist per-user read state. |
| `C12` | Admin | `AdminUsersPage` | Add User form submit | Create a user with initial assignment and temporary credential | `mgmtRepo.createUser()` | Email, name, phone, role, team, region, city | Credential modal, success toast, refreshed list | Admin only | Creates user, temp password, must-reset flag, cache invalidation, audit | Sync | `web-only` | `CMD:admin:user-create` | `JOB:notification:fanout` | Business command should own onboarding-side effects instead of the browser. |
| `C13` | Admin | `AdminUsersPage` | Edit, deactivate, reactivate actions | Manage existing user lifecycle | `updateUser()` + `deactivateUser(dry_run)` | User id, profile patch or lifecycle action | Updated list, blocker modal, success/error toast | Admin only | Metadata update, blocker checks, active-flag changes, audit | Sync | `web-only` | `CMD:admin:user-manage` | — | Dry-run blocker evaluation is part of the same business command family. |
| `C14` | Admin | `AdminTargetsPage` | Cell edit save | Update target values | `updateTarget()` | Target id, numeric patch | Saved grid and refreshed rollups | Admin only | Target mutation, audit log, cache invalidation | Sync | `web-only` | `CMD:admin:target-update` | — | Should remain a business command, not a table patch from the grid. |
| `C15` | Admin | `AdminTargetsPage` | Initialize Month CTA | Seed targets for a month | `initializeMonth()` | Target month, optional source month | Insert counts and refreshed target grid | Admin only | Bulk target generation | Sync | `web-only` | `CMD:admin:target-initialize-month` | — | Bulk month seeding is a distinct business workflow from cell edits. |
| `C16` | Admin | `AdminHierarchyPage` | Team reassignment, dealer reassignment preview/apply | Manage KAM↔TL and dealer↔KAM ownership changes | `updateUser()` + `reassignDealers(dry_run/apply)` | Selected KAM/dealers, target team/KAM, dry-run flag | Preview modal, impact counts, refreshed hierarchy | Admin only | Reporting-line updates, dealer reassignment, impact preview, cache invalidation | Preview sync; larger apply should become async | `web-only` | `CMD:admin:hierarchy-manage` | `JOB:admin:dealer-kam-bulk-import` | One business family with both validation and apply paths. |
| `C17` | Admin | `AdminHierarchyPage` bulk upload | Dry Run / Apply bulk upload | Validate and apply dealer-KAM mappings at scale | `bulkUpload('dealer_kam_mapping', rows, dry_run)` | Parsed CSV rows, dry-run/apply mode | Row errors, success counts, refreshed mappings | Admin only | Batch ownership changes | Dry-run sync; apply async | `web-only` | `CMD:admin:dealer-kam-bulk-import` | `JOB:admin:dealer-kam-bulk-import` | Target should keep validation and execution separate but within one workflow family. |
| `C18` | Admin | `AdminReportsPage` | Preset export or custom export submit | Generate a CSV export | `exportToCsv()` + `downloadCsv()` | Entity, selected fields, filters, date range | Downloaded CSV and row-count toast | Admin only | Generates file and audit/export log entry | Async | `web-only` | `CMD:admin:export-request` | `JOB:admin:csv-export` | Export generation should become job-backed even if the request is user-triggered. |
| `C19` | Admin | `AdminSettingsPage` | Edit slab/rule cell | Update incentive slabs and rules | Direct page-level table writes + audit inserts | Rule/slab id, field, new value | Updated settings table and refreshed audit view | Admin only | Config mutation and audit log write | Sync | `web-only` | `CMD:admin:config-update` | — | Current UI writes config directly; target backend should own validation and audit policy. |

## Auth And Access Appendix

| Flow ID | Actor(s) | Surface | Intent | Inputs | Outputs / UI Result | Permissions / Scope | Sync / Async | Target Capability | Phase Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `A1` | Unauthenticated user | `LoginPage` | Establish authenticated session and actor context | Email, password | Session established, role-based redirect | Public entry; result becomes actor-scoped session | Sync | `CMD:auth:login` | Final contract belongs to Phase 6 auth/security work. |
| `A2` | Unauthenticated or recovering user | `ForgotPasswordPage`, `ResetPasswordPage`, force-reset screen | Start and complete password reset | Email, OTP/token, new password | Password reset success, fresh-login requirement | Public/recovery flow only | Sync | `CMD:auth:password-reset` | Keep out of main business matrix; document only for dependency awareness. |
| `A3` | Authenticated user with incomplete profile | `ProfileCompletePage`, `ProfilePage` | Complete required profile data and maintain profile info | Name, phone, city, related profile fields | Guard cleared, profile shown/updated | Current actor only | Sync | `CMD:auth:profile-complete` | Treated as auth-adjacent profile lifecycle, not a core business API. |
| `A4` | Unauthenticated requester | `SignupPage` | Submit access request | Name, email, phone, role, city, region | Success state for pending request | Public entry | Sync | `CMD:access:request-submit` | Access-request workflow belongs to auth/security appendix. |
| `A5` | Admin | `AdminApprovalPanel` | Approve or reject access request | Request id, action, rejection reason | Temp password on approval or rejection confirmation | Admin only | Sync | `CMD:access:request-review` | Mounted in both shells, but intentionally documented as an access-request flow, not a business-domain flow. |

## Exclusions

- Demo pages: `demo-location-update`, `demo-visit-feedback`
- Removed routes documented in `APP_FLOWS.md`
- Pure routing/guard wrappers and chrome-only surfaces with no distinct business capability:
  `RequireAuth`, `RequireProfileComplete`, `MobileTopBar`, `BottomNav`, `AdminDesktopShell`
- Legacy backend route behavior capture belongs to D3, not D2

## Coverage Checklist

| D2 Requirement | Covered In |
| --- | --- |
| Identify all read flows: dashboard, dealers, leads, calls, visits, notifications, admin views | Read flow matrix rows `R1`-`R21` |
| Identify all write flows: visit start/end/feedback, call logging, lead creation, onboarding, admin updates, exports | Command flow matrix rows `C1`-`C19` |
| Document inputs, outputs, permissions, and side effects for each flow | Matrix columns for both read and command sections |
| Mark which flows are synchronous and which should become async | `Sync / Async` and `Target Processor / Job` columns |
| Define which flows are web-only, app-only, or internal | `Client Scope` column plus capability catalog jobs |
| Keep auth/access flows visible without mixing them into the main business matrix | Auth and access appendix rows `A1`-`A5` |

## Assumptions And Defaults

- `APP_FLOWS.md` remains useful for user journeys, but this D2 document is the canonical source for backend capability mapping because it also covers mounted admin desktop management routes that the older flow doc does not fully enumerate.
- Where the current UI splits a workflow into multiple local steps but only persists on the final step, D2 maps the target capability to the business outcome rather than the intermediate UI state.
- Notification fan-out, export generation, and large-scale bulk mapping are the only flows that should default to async processors at this stage.
- Capability IDs are intentionally stable architecture labels, not final endpoint URLs or DTO names.
