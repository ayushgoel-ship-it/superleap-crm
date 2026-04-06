# Visits Duplicate Resolution — Phase 2A Decision

**Date:** February 9, 2026  
**Task:** Determine which of `VisitsPage.tsx` / `UnifiedVisitsPage.tsx` is the canonical mounted visits screen  
**Status:** DECISION COMPLETE — No archive action taken (see rationale)

---

## 1. Route Mounting Analysis

### Route Constant

```
/navigation/routes.ts line 27: VISITS: AppRoute.VISITS
```

### Router Mapping (App.tsx)

```tsx
// App.tsx line 15
import { VisitsPage } from './components/pages/VisitsPage';

// App.tsx lines 462–467
case 'visits':
  return <VisitsPage
    userRole={userRole}
    onNavigateToLocationUpdate={navigateToDealerLocationUpdate}
    onNavigateToCallFeedback={navigateToCallFeedback}
  />;
```

### Result

| File | Imported by App.tsx? | Rendered in router? | Mounted? |
|------|---------------------|---------------------|----------|
| **VisitsPage.tsx** | YES (line 15) | YES (line 463, case `'visits'`) | **YES — ACTIVE** |
| **UnifiedVisitsPage.tsx** | NO | NO | **NO — NOT MOUNTED** |

**Mounted component: `VisitsPage.tsx`**

---

## 2. Structured Comparison

### 2.1 Architecture

| Dimension | VisitsPage.tsx | UnifiedVisitsPage.tsx |
|-----------|---------------|----------------------|
| **Lines** | 61 | 530 |
| **Role** | Thin routing container | Self-contained page with full visit flow |
| **Props** | `userRole`, navigation callbacks | None (0 props) |
| **Pattern** | Delegates to role-specific sub-views | Monolithic with inline sub-components |

### 2.2 Data Source

| Dimension | VisitsPage.tsx | UnifiedVisitsPage.tsx |
|-----------|---------------|----------------------|
| **Selectors** | Delegates to KAMVisitsViewNew/TLVisitsView (use `useActivity()` context) | Internal hardcoded mock array (2 dealers) |
| **Central data** | Yes, via sub-components | No, self-contained mock |

### 2.3 UI Layout / Tabs / Segments

| Dimension | VisitsPage.tsx | UnifiedVisitsPage.tsx |
|-----------|---------------|----------------------|
| **Top-level** | Segmented control: **Visits \| Calls** | Tab bar: **Today's Visits \| Nearby Dealers \| All Dealers** |
| **Sub-tabs (Visits)** | Delegated to KAMVisitsViewNew (today/past/nearby/all) | today/nearby/all (inline) |
| **Sub-tabs (Calls)** | Delegated to KAMCallsViewNew (suggested/today/all) | N/A — no calls tab |

### 2.4 Filters / Search

| Dimension | VisitsPage.tsx | UnifiedVisitsPage.tsx |
|-----------|---------------|----------------------|
| **Search** | Delegated to sub-views | Inline dealer name search |
| **Filters** | Delegated to sub-views | Dealer type chips (All/Top/Tagged/Untagged) |

### 2.5 Row Actions

| Dimension | VisitsPage.tsx | UnifiedVisitsPage.tsx |
|-----------|---------------|----------------------|
| **Visit actions** | Via KAMVisitsViewNew: log visit, location update | Start Visit → GeofenceCheckIn → InVisitScreen → VisitSummary |
| **Call actions** | Via KAMCallsViewNew: log call, call feedback | N/A |

### 2.6 Empty / Loading / Error States

| Dimension | VisitsPage.tsx | UnifiedVisitsPage.tsx |
|-----------|---------------|----------------------|
| **Empty** | Delegated to sub-views | "No visits scheduled" with Clock icon |
| **Loading** | Delegated to sub-views | None |
| **Error** | Delegated to sub-views | None |

### 2.7 Permissions / Role Gates

| Dimension | VisitsPage.tsx | UnifiedVisitsPage.tsx |
|-----------|---------------|----------------------|
| **KAM** | KAMVisitsViewNew + KAMCallsViewNew | Only view (no role check) |
| **TL** | TLVisitsView + TLCallsView | N/A — no TL branching |
| **Admin** | N/A (Admin uses AdminWorkspace) | N/A |

---

## 3. Decision

### Verdict: KEEP BOTH — Do NOT archive UnifiedVisitsPage

**Reason:** UnifiedVisitsPage.tsx has **5 active type imports** from sub-components. Archiving it would break compile for those files. The "0 imports" criterion is not met.

### Import Evidence (repo-wide search, Feb 9 2026)

| Importer | Import | What |
|----------|--------|------|
| `/components/visits/EditDealerInfo.tsx` line 3 | `import { Dealer } from '../pages/UnifiedVisitsPage'` | Type |
| `/components/visits/GeofenceCheckIn.tsx` line 3 | `import { Dealer } from '../pages/UnifiedVisitsPage'` | Type |
| `/components/visits/InVisitScreen.tsx` line 3 | `import { Visit } from '../pages/UnifiedVisitsPage'` | Type |
| `/components/visits/NearbyDealersMap.tsx` line 2 | `import { Dealer } from '../pages/UnifiedVisitsPage'` | Type |
| `/components/visits/VisitSummary.tsx` line 2 | `import { Visit } from '../pages/UnifiedVisitsPage'` | Type |

### Orphan Cluster Discovery

Although UnifiedVisitsPage has 5 imports, **all importers are themselves orphaned** — none reach any mount point. The full orphan cluster:

```
ORPHAN CLUSTER (7 files, none reach mount point):
├── /components/pages/UnifiedVisitsPage.tsx       ← NOT in App.tsx
├── /components/visits/GeofenceCheckIn.tsx         ← imported by UVP + DealerQuickActionsCard (also orphan)
├── /components/visits/InVisitScreen.tsx           ← imported ONLY by UVP
├── /components/visits/EditDealerInfo.tsx          ← imported ONLY by InVisitScreen
├── /components/visits/VisitSummary.tsx            ← imported ONLY by UVP
├── /components/visits/NearbyDealersMap.tsx        ← imported ONLY by UVP
└── /components/dealer/DealerQuickActionsCard.tsx  ← 0 .tsx imports (only referenced in .md)
```

**Verification commands:**
```bash
grep -r "from.*DealerQuickActionsCard" --include="*.tsx"   # 0 results
grep -r "from.*InVisitScreen" --include="*.tsx"            # 1 result (UnifiedVisitsPage only)
grep -r "from.*EditDealerInfo" --include="*.tsx"           # 1 result (InVisitScreen only)
grep -r "from.*NearbyDealersMap" --include="*.tsx"         # 1 result (UnifiedVisitsPage only)
grep -r "from.*VisitSummary" --include="*.tsx"             # 1 result (UnifiedVisitsPage only)
```

### Additional Orphan Discovered

`KAMVisitsView.tsx` (without "New" suffix) at `/components/visits/KAMVisitsView.tsx` has **0 imports** from any `.tsx` file. It is a predecessor to `KAMVisitsViewNew.tsx` and is fully orphaned. Candidate for future archive.

---

## 4. NV-1 / NV-2 Resolution

| ID | File | Verdict | Reason |
|----|------|---------|--------|
| **NV-1** | `KAMCallsViewNew.tsx` | **CONFIRMED ACTIVE — DO NOT ARCHIVE** | Imported by `VisitsPage.tsx` line 5; VisitsPage is mounted in App.tsx case `'visits'` |
| **NV-2** | `KAMVisitsViewNew.tsx` | **CONFIRMED ACTIVE — DO NOT ARCHIVE** | Imported by `VisitsPage.tsx` line 3; VisitsPage is mounted in App.tsx case `'visits'` |

---

## 5. Future Work (Phase 2B Candidate)

To archive the UnifiedVisitsPage orphan cluster, a future phase should:

1. Move the exported types (`Dealer`, `Visit`, `DealerType`, `VisitStatus`) from `UnifiedVisitsPage.tsx` to a shared types file (e.g., `/data/types.ts`)
2. Update all 5 sub-component imports to point to the new location
3. Archive the full 7-file cluster together
4. Also investigate `KAMVisitsView.tsx` (no-"New") as an additional archive candidate

**Risk level:** MEDIUM — requires 5 import rewrites + type migration, but no UI/behavior change since the entire cluster is orphaned.

---

**End of Decision Document**
