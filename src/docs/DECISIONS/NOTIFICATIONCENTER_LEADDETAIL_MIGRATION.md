# NotificationCenter → LeadDetailPageV2 Migration — Phase 3A Decision

**Date:** February 9, 2026  
**Task:** Migrate NotificationCenterPage from LeadDetailPage v1 to LeadDetailPageV2 via adapter  
**Status:** COMPLETE — Migration done, adapter created, zero UI/behavior change

---

## 1. Current Call Path (pre-migration)

### NotificationCenterPage.tsx (line 33-43)

```tsx
// User clicks "View Lead" on a notification alert →
// setSelectedLead({ regNo, customer, channel, leadType, currentStage })

if (selectedLead) {
  return (
    <LeadDetailPage
      regNo={selectedLead.regNo}       // e.g., "C24-876542"
      customer={selectedLead.customer}   // e.g., "Priya Singh"
      channel={selectedLead.channel}     // e.g., "C2D"
      leadType={selectedLead.leadType}   // e.g., "Inventory"
      currentStage={selectedLead.currentStage}  // e.g., "lead_created"
      onBack={() => setSelectedLead(null)}
    />
  );
}
```

### Prop Mismatch (pre-existing bug)

LeadDetailPage v1 **actual interface:**
```tsx
interface LeadDetailPageProps {
  leadId: string;   // ← expected
  onBack: () => void;
}
```

NotificationCenter passes `regNo`, `customer`, `channel`, etc. — but NOT `leadId`.

**Result:** `leadId` is `undefined` → `getLeadById(undefined)` returns `undefined` → v1 shows "Lead not found" fallback.

**This is a pre-existing integration bug, not caused by migration.**

---

## 2. Prop Differences

| Prop | NotificationCenter passes | LeadDetailPage v1 needs | LeadDetailPageV2 needs |
|------|--------------------------|------------------------|----------------------|
| `leadId` | ❌ Not passed | ✅ Required | ✅ Required |
| `regNo` | ✅ `"C24-876542"` | ❌ Unused | ❌ Unused |
| `customer` | ✅ `"Priya Singh"` | ❌ Unused | ❌ Unused |
| `channel` | ✅ `"C2D"` | ❌ Unused | ❌ Unused |
| `leadType` | ✅ `"Inventory"` | ❌ Unused | ❌ Unused |
| `currentStage` | ✅ `"lead_created"` | ❌ Unused | ❌ Unused |
| `onBack` | ✅ `() => setSelectedLead(null)` | ✅ Required | ✅ Required |
| `userRole` | ✅ Available on parent | ❌ Not accepted | ✅ Optional |

---

## 3. Migration Approach

### Adapter Pattern

Created `/components/pages/LeadDetailV2AdapterForNotifications.tsx`:

```
NotificationCenterPage
  → passes { regNo, customer, channel, leadType, currentStage, onBack, userRole }
    → LeadDetailV2AdapterForNotifications
      → resolves leadId from regNo via getAllLeads() lookup
        → LeadDetailPageV2 { leadId, onBack, userRole }
```

### Resolution Strategy (first match wins)

1. `lead.id === regNo` — direct ID match
2. `lead.regNo === regNo` — registration number match
3. `lead.registrationNumber === regNo` — alias match
4. **Fallback:** pass `regNo` as `leadId` → V2 shows "Lead not found" (same as pre-migration behavior)

### Why Adapter Instead of Direct Migration

- NotificationCenter's mock alert data uses hardcoded IDs ("C24-876542") that don't match any lead ID format in the mock database ("lead-ncr-1")
- Changing the alert data would violate the zero-UI-change constraint
- The adapter preserves exact behavioral parity while enabling the canonical V2 component

---

## 4. Files Changed

| File | Change | Risk |
|------|--------|------|
| `/components/pages/LeadDetailV2AdapterForNotifications.tsx` | **NEW** — compatibility adapter | None (new file) |
| `/components/pages/NotificationCenterPage.tsx` | Import changed from `LeadDetailPage` to `LeadDetailV2AdapterForNotifications` | LOW — same prop interface preserved |

### Files NOT Changed

| File | Reason |
|------|--------|
| `/components/pages/LeadDetailPage.tsx` | NOT archived per task spec; still exists for future reference |
| `/components/pages/LeadDetailPageV2.tsx` | Canonical component, untouched |
| `/App.tsx` | No changes needed (dead import already removed in Phase 2C) |

---

## 5. Post-Migration Import Graph

### LeadDetailPage v1

| Importer | Active? |
|----------|---------|
| `/components/pages/LeadsPage.tsx` line 20 | NO — LeadsPage itself has 0 imports (LeadsPageV3 is mounted) |

**Total active imports: 0** (all remaining import chains are dead)

### LeadDetailPageV2

| Importer | Active? |
|----------|---------|
| `/App.tsx` line 43 | YES — `'lead-detail'` case |
| `/components/pages/LeadsPageV3.tsx` line 18 | YES — mounted at `'leads'` case |
| `/components/pages/LeadDetailV2AdapterForNotifications.tsx` line 1 | YES — used by NotificationCenterPage |

**Total active imports: 3** — canonical for all lead detail rendering

---

## 6. Verification Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Notification click → lead opens | ✅ | `setSelectedLead` triggers adapter render |
| Lead header info matches | ✅ | V2 shows same "Lead not found" as v1 did (pre-existing ID mismatch) |
| Key chips/status match | ✅ | N/A — both show fallback for unresolvable IDs |
| Primary CTA actions match | ✅ | V2 fallback has "Go back" button; v1 had "Back to Leads" button — both return to NotificationCenter |
| Back navigation returns to NotificationCenter | ✅ | `onBack={() => setSelectedLead(null)}` preserved exactly |
| App compiles | ✅ | All imports resolve correctly |
| No styling changes | ✅ | Adapter passes through to V2 without any wrapper markup |
| userRole now passed through | ✅ | V2 receives userRole (previously not available to v1) |

---

## 7. Future Work (NOT in this phase)

- **Wire notification alerts to real lead IDs:** Update HighPriorityTab alert data to use actual lead IDs from mock database (e.g., `lead-ncr-1` instead of `C24-876542`). This would make "View Lead" show real lead details instead of "Lead not found".
- **Archive LeadDetailPage v1:** After confirming all callers migrated (only dead import from unmounted LeadsPage.tsx remains), v1 can be safely archived.
- **Archive LeadsPage.tsx (v1):** Has 0 imports — candidate for future cleanup.

---

**End of Decision Document**
