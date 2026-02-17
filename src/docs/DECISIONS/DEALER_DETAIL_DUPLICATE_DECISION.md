# Dealer Detail Duplicate Resolution — Phase 2C Decision

**Date:** February 9, 2026  
**Task:** Resolve duplication between `Dealer360View.tsx` and `DealerDetailPageV2.tsx`  
**Status:** COMPLETE — Dealer360View archived, DealerDetailPageV2 confirmed canonical

---

## 1. Route Mounting Analysis

### No dedicated DEALER_DETAIL route exists

The routes.ts file has no `DEALER_DETAIL` route constant. Dealer detail is rendered **inline** by `DealersPage.tsx` when a dealer is selected (not via top-level routing).

### Rendering Evidence (DealersPage.tsx)

```tsx
// DealersPage.tsx line 235 (approx)
if (selectedDealer) {
  return (
    <DealerDetailPageV2
      dealerName={selectedDealer.name}
      dealerCode={selectedDealer.code}
      ...
    />
  );
}
```

### Result

| File | Imported? | Rendered in JSX? | Mounted? |
|------|-----------|-----------------|----------|
| **Dealer360View.tsx** (`/components/dealers/`) | YES — DealersPage.tsx line 8 (dead import) | **NO — 0 JSX renders** | **NO** |
| **DealerDetailPageV2.tsx** (`/components/pages/`) | YES — DealersPage.tsx line 9 | **YES — DealersPage.tsx line 235** | **YES** |

**Canonical: `DealerDetailPageV2.tsx`**

---

## 2. Import Graph

### Dealer360View.tsx

| Importer | Type | Active? |
|----------|------|---------|
| `/components/pages/DealersPage.tsx` line 8 | Dead import (never rendered) | Removed in Phase 2C |

Post-cleanup: **0 imports**.

### DealerDetailPageV2.tsx

| Importer | Type | Active? |
|----------|------|---------|
| `/components/pages/DealersPage.tsx` line 9 | Render (line 235) | YES — mounted via App.tsx `'dealers'` case |

---

## 3. Parity Checklist

| Section | Dealer360View | DealerDetailPageV2 |
|---------|--------------|-------------------|
| **Architecture** | Uses centralized `dtoSelectors`, `LeadList`, `ROUTES` | Uses inline mock data + tabs |
| **Tabs** | Overview, Leads, Activity, DCF | Overview, Leads, Calls & Visits, DCF |
| **Time Filters** | D-1, D-7, LM, L6M, MTD (via TimeScope) | Today, D-1, MTD, Last Month |
| **Quick Actions** | Call, WhatsApp | Call, WhatsApp, Create Lead, More |
| **Lead Detail Nav** | Click through to LeadDetail via props | Click through to LeadDetail via props |
| **DCF Tab** | Loan list + onboarding CTA | Loan list + onboarding CTA |

Both are feature-complete dealer detail screens. DealerDetailPageV2 is the one actually rendered.

---

## 4. Decision

### Verdict: ARCHIVE Dealer360View

**Actions taken:**
1. Removed dead import of `Dealer360View` from `DealersPage.tsx` line 8
2. Archived `/components/dealers/Dealer360View.tsx` to `/_archive_code/components/dealers/Dealer360View.tsx`
3. `DealerDetailPageV2.tsx` remains canonical and untouched

**Verification:**
```bash
grep -r "from.*Dealer360View" --include="*.tsx"   # 0 results
grep -r "<DealerDetailPageV2" --include="*.tsx"    # 1 result (DealersPage.tsx)
```

---

**End of Decision Document**
