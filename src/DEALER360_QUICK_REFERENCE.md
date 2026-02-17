# Dealer360 Quick Reference Guide 🚀

## Usage Examples

### 1. Opening Dealer Detail

```typescript
import { Dealer360View } from './components/dealers/Dealer360View';
import { useAuth } from './auth/authContext';

function DealersPage() {
  const { activeRole, isImpersonating } = useAuth();
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  return (
    <>
      {/* Dealer cards... */}
      
      {selectedDealer && (
        <Dealer360View
          dealer={selectedDealer}
          role={activeRole}
          isImpersonating={isImpersonating}
          onClose={() => setSelectedDealer(null)}
          onNavigateToCallDetail={(callId) => navigate(ROUTES.CALL_DETAIL, { state: { callId } })}
          onNavigateToVisitDetail={(visitId) => navigate(ROUTES.VISIT_DETAIL, { state: { visitId } })}
          onNavigateToLeadDetail={(leadId) => navigate(ROUTES.LEAD_DETAIL, { state: { leadId } })}
          onNavigateToDCFDetail={(dcfLeadId) => navigate(ROUTES.DCF_LEAD_DETAIL, { state: { dcfLeadId } })}
          onNavigateToDCFOnboarding={(dealerId) => navigate(ROUTES.DCF_ONBOARDING_FORM, { state: { dealerId } })}
        />
      )}
    </>
  );
}
```

### 2. Opening Lead Detail

```typescript
import { LeadDetailPage } from './components/pages/LeadDetailPage';

function LeadDetailRoute() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const leadId = state?.leadId || 'default-lead';

  return (
    <LeadDetailPage
      leadId={leadId}
      onBack={() => navigate(-1)}
      onNavigateToDealer={(dealerId) => {
        // Open Dealer360View for this dealer
        setSelectedDealer(getDealerById(dealerId));
      }}
    />
  );
}
```

### 3. Opening DCF Onboarding Form

```typescript
import { DCFOnboardingFormPage } from './components/pages/DCFOnboardingFormPage';

function DCFOnboardingRoute() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const dealer = getDealerById(state?.dealerId);

  return (
    <DCFOnboardingFormPage
      dealerId={dealer.id}
      dealerName={dealer.name}
      dealerCode={dealer.code}
      onBack={() => navigate(-1)}
      onSubmitSuccess={() => {
        // Update dealer status
        dealer.tags.push('DCF Onboarded');
        // Navigate back to dealer detail
        navigate(-1);
      }}
    />
  );
}
```

---

## Time Scope Mapping

```typescript
// UI Value → Data Key
const SCOPE_MAP = {
  'd-1': 'd-1',           // Yesterday
  'last-7d': 'last-7d',   // Last 7 days
  'mtd': 'mtd',           // Month to date
  'last-month': 'last-30d', // Last month (30 days)
  'last-6m': 'last-6m',   // Last 6 months
};

// Usage
const metrics = dealer.metrics[SCOPE_MAP[timeScope]];
```

---

## Quick Actions Callbacks

```typescript
<DealerQuickActionsCard
  // Required props
  dealerId="dealer-ncr-001"
  dealerName="Daily Motoz"
  dealerCode="DR080433"
  dealerCity="Gurgaon"
  role="KAM"
  
  // Optional location data
  dealerLat={28.4595}
  dealerLng={77.0266}
  dealerPhone="+919876543210"
  dealerAddress="123 MG Road, Gurgaon"
  
  // Callbacks
  onVisitStarted={(visitId) => {
    console.log('Visit started:', visitId);
    // Refresh activity list
    // Update metrics
  }}
  onLeadCreated={(leadId) => {
    console.log('Lead created:', leadId);
    // Refresh leads list
    // Update metrics
  }}
/>
```

---

## DCF Status Check

```typescript
// Check if dealer is DCF onboarded
const isDCFOnboarded = dealer.tags?.includes('DCF Onboarded');

if (!isDCFOnboarded) {
  // Show onboarding CTA
  <Button onClick={() => navigate(ROUTES.DCF_ONBOARDING_FORM)}>
    Begin Onboarding Process
  </Button>
} else {
  // Show onboarding status + DCF loans
  <DCFOnboardingStatus dealerId={dealer.id} />
  <DCFLoansList dealerId={dealer.id} scope={timeScope} />
}
```

---

## Navigation Props

All navigation is handled via callbacks:

```typescript
interface Dealer360ViewProps {
  dealer: Dealer;
  onClose: () => void;
  role?: 'KAM' | 'TL' | 'ADMIN';
  isImpersonating?: boolean;
  
  // Navigation callbacks
  onNavigateToCallDetail?: (callId: string) => void;
  onNavigateToVisitDetail?: (visitId: string) => void;
  onNavigateToLeadDetail?: (leadId: string) => void;
  onNavigateToDCFDetail?: (dcfLeadId: string) => void;
  onNavigateToDCFOnboarding?: (dealerId: string) => void;
}
```

---

## Filter States

```typescript
// Dealer360View internal state
const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'leads' | 'dcf'>('overview');
const [timeScope, setTimeScope] = useState<DealerTimeScope>('last-7d');
const [leadsTimeScope, setLeadsTimeScope] = useState<DealerTimeScope>('mtd');

// Time scope persists across tab changes
// Leads tab has its own scope (includes MTD)
```

---

## DCF Onboarding Form Validation

```typescript
// Required fields (15 total)
const requiredFields = [
  'employeeEmail',
  'leadSourceChannel',
  'department',
  'cityName',
  'c2bDealerCode',
  'dealershipName',
  'ownerName',
  'ownerPhone',
  'ownerEmail',
  'ownershipType',
  'cibilConsentUCDID',
  'address',
  'boardInstalled',
  'dealerType',
];

// Required documents (5 base + 1 conditional)
const requiredDocuments = [
  'gstCertificate',
  'aadhaarFront',
  'aadhaarBack',
  'panCard',
  'businessProof',
  'dealerSelfie',
];

// Conditional
if (ownershipType === 'Partnership Firm' || ownershipType === 'Pvt. Ltd. Company') {
  requiredDocuments.push('additionalDocs');
}
```

---

## Color Coding Reference

### Channel Badges
```typescript
const channelColors = {
  'C2B': 'bg-blue-100 text-blue-700',
  'C2D': 'bg-purple-100 text-purple-700',
  'GS': 'bg-green-100 text-green-700',
};
```

### Status Badges
```typescript
const statusColors = {
  'Stock-in': 'bg-green-100 text-green-700',
  'PLL': 'bg-amber-100 text-amber-700',
  'PR': 'bg-amber-100 text-amber-700',
  'Inspected': 'bg-blue-100 text-blue-700',
};
```

### DCF Status
```typescript
const dcfStatusColors = {
  'Disbursed': 'bg-green-100 text-green-700',
  'Approved': 'bg-blue-100 text-blue-700',
  'Docs Pending': 'bg-amber-100 text-amber-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
};
```

### Dealer Segment
```typescript
const segmentColors = {
  'A': 'bg-green-100 text-green-700',
  'B': 'bg-blue-100 text-blue-700',
  'C': 'bg-gray-100 text-gray-700',
};
```

---

## Metric Calculations

### Overview Tab
```typescript
// Primary metrics (from dealer.metrics[scope])
const inspections = dealer.metrics[scope].inspections;
const stockIns = dealer.metrics[scope].sis;
const dcfLeads = dealer.metrics[scope].dcf;
const dcfDisbursement = dcfLeads * 250000; // ₹2.5L avg per DCF

// Secondary metrics (derived)
const calls = Math.floor(dealer.metrics[scope].leads * 1.5);
const visits = Math.floor(dealer.metrics[scope].inspections * 0.5);
const t2siPercent = dealer.metrics[scope].leads > 0 
  ? Math.round((dealer.metrics[scope].sis / dealer.metrics[scope].leads) * 100) 
  : 0;
```

---

## Empty States

### Activity Tab
```typescript
{activities.length === 0 && (
  <div className="text-center py-8 text-gray-500">
    <p>No activity found for selected time period</p>
  </div>
)}
```

### Leads Tab
```typescript
{leads.length === 0 && (
  <div className="text-center py-8 text-gray-500">
    <p>No leads found for selected time period</p>
  </div>
)}
```

### DCF Tab
```typescript
{dcfLoans.length === 0 && isDCFOnboarded && (
  <div className="text-center py-8 text-gray-500">
    <p>No DCF loans found for selected time period</p>
  </div>
)}
```

---

## Testing Quick Checks

### ✅ Overview Tab
- [ ] Shows 4 primary metrics (Inspections, Stock-ins, DCF Leads, DCF Disb)
- [ ] Shows 3 secondary metrics (Calls, Visits, T2SI%)
- [ ] Shows funnel chart
- [ ] Quick Actions has 2 buttons only
- [ ] Time filter changes metrics

### ✅ Activity Tab
- [ ] Shows only Calls and Visits (no WhatsApp)
- [ ] Each item is clickable
- [ ] Hover state works
- [ ] Empty state shows when no data

### ✅ Leads Tab
- [ ] Time filter includes MTD
- [ ] Lead cards show all info (ID, channel, car, status, revenue, date)
- [ ] Cards are clickable
- [ ] Empty state shows when no data

### ✅ DCF Tab
- [ ] Shows onboarding CTA if not onboarded
- [ ] Shows status tracker if onboarded
- [ ] DCF loan cards are clickable
- [ ] Empty state shows when no data

### ✅ DCF Onboarding Form
- [ ] All 15 text fields present
- [ ] All 8 upload fields present
- [ ] Validation works
- [ ] Conditional fields show correctly
- [ ] Submit creates success toast
- [ ] Navigate back updates dealer status

---

## Common Issues & Solutions

### Issue: "Location error: {}"
**Solution**: Check DealerQuickActionsCard error handling (already fixed)

### Issue: Time filter not updating data
**Solution**: Ensure `timeScope` state is passed to all tab components

### Issue: Navigation not working
**Solution**: Check that all navigation callbacks are provided in parent component

### Issue: DCF onboarding not updating dealer
**Solution**: Ensure `onSubmitSuccess` callback updates dealer.tags array

### Issue: Empty state always showing
**Solution**: Check that mock data includes items for selected time scope

---

## Next Steps (Backend Integration)

1. **Replace mock data with API calls**
   ```typescript
   // Before
   const activities = mockActivities;
   
   // After
   const activities = await getDealerActivitiesDTO(dealerId, timeScope);
   ```

2. **Add loading states**
   ```typescript
   const [isLoading, setIsLoading] = useState(true);
   
   useEffect(() => {
     fetchDealerData().finally(() => setIsLoading(false));
   }, [dealerId, timeScope]);
   ```

3. **Add error handling**
   ```typescript
   try {
     const data = await api.getDealerDetail(dealerId);
   } catch (error) {
     toast.error('Failed to load dealer details');
   }
   ```

4. **Add real-time updates**
   ```typescript
   // After visit/lead creation, refresh dealer data
   onVisitStarted={() => {
     refreshDealerMetrics();
     refreshActivityList();
   }}
   ```

---

## Quick Copy-Paste Snippets

### Open Dealer360 from card click
```typescript
<DealerCard
  dealer={dealer}
  onClick={() => setSelectedDealer(dealer)}
/>

{selectedDealer && (
  <Dealer360View
    dealer={selectedDealer}
    onClose={() => setSelectedDealer(null)}
    {...navigationCallbacks}
  />
)}
```

### Navigate to lead detail
```typescript
navigate(ROUTES.LEAD_DETAIL, { 
  state: { leadId: 'C24-876543' } 
});
```

### Navigate to DCF onboarding
```typescript
navigate(ROUTES.DCF_ONBOARDING_FORM, { 
  state: { 
    dealerId: dealer.id,
    dealerName: dealer.name,
    dealerCode: dealer.code,
  } 
});
```

### Check DCF status
```typescript
const isDCFOnboarded = dealer.tags?.includes('DCF Onboarded');
```

---

**Quick Reference Complete!** 📚
