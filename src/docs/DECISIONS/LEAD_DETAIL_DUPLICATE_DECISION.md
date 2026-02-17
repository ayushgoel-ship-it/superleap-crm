# Lead Detail Duplicate Resolution — Phase 2C Decision

**Date:** February 9, 2026  
**Task:** Resolve duplication between `Lead360View.tsx`, `LeadDetailPage.tsx` (v1), and `LeadDetailPageV2.tsx`  
**Status:** COMPLETE — Lead360View archived, LeadDetailPage v1 KEPT (active via NotificationCenter), LeadDetailPageV2 confirmed canonical for main flow

---

## 1. Route Mounting Analysis

### LEAD_DETAIL route

```ts
// navigation/routes.ts line 26
LEAD_DETAIL: AppRoute.LEAD_DETAIL  // = 'lead-detail'
```

### Router Mapping (App.tsx)

```tsx
// App.tsx line 585-587
case 'lead-detail':
  return selectedLeadId ? (
    <LeadDetailPageV2 leadId={selectedLeadId} onBack={handleLeadDetailBack} userRole={userRole} />
  ) : (
    <HomePage ... />
  );
```

### Result

| File | Imported by | Rendered in JSX? | Mounted? |
|------|-------------|-----------------|----------|
| **Lead360View.tsx** (`/components/leads/`) | Nobody (0 imports) | NO | **NO** |
| **LeadDetailPage.tsx** (`/components/pages/`) | App.tsx (dead import, removed), LeadsPage.tsx (not mounted), **NotificationCenterPage.tsx (MOUNTED)** | YES — NotificationCenterPage line 35 | **YES** |
| **LeadDetailPageV2.tsx** (`/components/pages/`) | App.tsx (mounted), LeadsPageV3.tsx (mounted) | YES — App.tsx line 587, LeadsPageV3 internal | **YES — CANONICAL** |

---

## 2. Import Graph

### Lead360View.tsx
| Importer | Active? |
|----------|---------|
| (none) | N/A |

**0 imports → SAFE TO ARCHIVE**

### LeadDetailPage.tsx (v1)
| Importer | Renders? | Active? |
|----------|----------|---------|
| ~~App.tsx line 43~~ | Dead import (removed) | Removed in Phase 2C |
| `/components/pages/LeadsPage.tsx` line 20 | YES (line 199) | **NO** — LeadsPage itself has 0 imports (LeadsPageV3 is mounted instead) |
| `/components/pages/NotificationCenterPage.tsx` line 4 | YES (line 35) | **YES** — NotificationCenterPage mounted at App.tsx `'notifications'` case |

**1 active render path → CANNOT ARCHIVE**

### LeadDetailPageV2.tsx
| Importer | Renders? | Active? |
|----------|----------|---------|
| App.tsx line 44 | YES (line 587) | YES — `'lead-detail'` case |
| `/components/pages/LeadsPageV3.tsx` line 18 | YES (internal) | YES — LeadsPageV3 is mounted at `'leads'` case |

---

## 3. Prop Interface Comparison

### LeadDetailPage v1 (used by NotificationCenterPage)

```tsx
<LeadDetailPage
  regNo={selectedLead.regNo}
  customer={selectedLead.customer}
  channel={selectedLead.channel}
  leadType={selectedLead.leadType}
  currentStage={selectedLead.currentStage}
  onBack={() => setSelectedLead(null)}
/>
```

### LeadDetailPageV2 (used by App.tsx + LeadsPageV3)

```tsx
<LeadDetailPageV2
  leadId={selectedLeadId}
  onBack={handleLeadDetailBack}
  userRole={userRole}
/>
```

**Different prop signatures.** V1 receives individual lead fields; V2 receives a `leadId` and looks up data internally. Migration would require NotificationCenterPage to change how it passes data — out of scope for zero-UI-change constraint.

---

## 4. Decision

### Lead360View → ARCHIVE (0 imports)

### LeadDetailPage v1 → KEEP (active via NotificationCenterPage)

### LeadDetailPageV2 → CANONICAL for main leads flow

**Actions taken:**
1. Archived `/components/leads/Lead360View.tsx` → `/_archive_code/`
2. Removed dead import of `LeadDetailPage` from `App.tsx` (was imported but never rendered in App.tsx)
3. `LeadDetailPage.tsx` v1 remains in place (actively rendered by NotificationCenterPage)
4. `LeadDetailPageV2.tsx` remains canonical and untouched

**Future work (not in scope):**
- Migrate NotificationCenterPage from LeadDetailPage v1 to LeadDetailPageV2 (requires prop interface change)
- After migration, LeadDetailPage v1 can be archived
- LeadsPage.tsx (v1) has 0 imports — candidate for future archive

**Verification:**
```bash
grep -r "from.*Lead360View" --include="*.tsx"        # 0 results
grep -r "<LeadDetailPage " --include="*.tsx"          # 2 results (LeadsPage + NotificationCenter)
grep -r "<LeadDetailPageV2" --include="*.tsx"         # 2 results (App.tsx + LeadsPageV3)
```

---

**End of Decision Document**
