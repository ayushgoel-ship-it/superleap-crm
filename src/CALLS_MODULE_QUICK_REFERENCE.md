# Calls Module - Quick Reference Card

## 📦 Files Overview

| File | Purpose | Status |
|------|---------|--------|
| `/data/types.ts` | CallLog interface with feedback structure | ✅ Updated |
| `/data/selectors.ts` | 8 new call management functions | ✅ Added |
| `/data/mockDatabase.ts` | 3 test dealers with different states | ✅ Updated |
| `/components/pages/CallFeedbackPageNew.tsx` | Mandatory feedback screen | ✅ Created |
| `/components/pages/TLCallDetailPage.tsx` | TL review + recording | ✅ Created |
| `/lib/domain/constants.ts` | TL_CALL_DETAIL route | ✅ Added |
| `/navigation/routes.ts` | ROUTES constants | ✅ Updated |

---

## 🔧 Key Selectors

```typescript
import { 
  createCallAttempt,      // Create new call
  endCallAttempt,         // End call + set duration
  submitCallFeedback,     // Submit structured feedback
  getTodayCallsForUser,   // Get today's calls
  getAllCallsForUser,     // Get all calls (60-day cap)
  getCallsForTL,          // TL view with filters
  getCallDetailDTO,       // Full call details
  submitTLReview          // TL coaching notes
} from './data/selectors';
```

---

## 🎯 Quick Implementations

### 1. "Call Now" Button
```typescript
import { createCallAttempt } from '../../data/selectors';

const handleCallNow = (dealer) => {
  const call = createCallAttempt({
    dealerId: dealer.id,
    kamId: currentUser.id,
    phone: dealer.phone,
  });
  
  window.location.href = `tel:${dealer.phone}`;
  setActiveCallId(call.id);
  setShowCallEndSheet(true);
};
```

### 2. "I Ended the Call" Handler
```typescript
import { endCallAttempt } from '../../data/selectors';
import { ROUTES } from '../../navigation/routes';

const handleCallEnded = () => {
  const durationSec = Math.floor(Math.random() * 270) + 30;
  endCallAttempt(activeCallId, { durationSec });
  navigate(ROUTES.CALL_FEEDBACK, { callId: activeCallId });
};
```

### 3. Today's Calls (3 States)
```typescript
import { getTodayCallsForUser } from '../../data/selectors';

const calls = getTodayCallsForUser(user.id, 'today');

calls.map(call => {
  if (call.feedbackStatus === 'PENDING') {
    // RED: "Enter Feedback" button
    return <Button onClick={() => navigate(ROUTES.CALL_FEEDBACK, { callId: call.id })}>
      Enter Feedback
    </Button>;
  } else {
    // GREEN: "View Feedback" button
    return <Button onClick={() => navigate(ROUTES.CALL_DETAIL, { callId: call.id })}>
      View Feedback
    </Button>;
  }
});
```

### 4. TL Calls View
```typescript
import { getCallsForTL } from '../../data/selectors';
import { ROUTES } from '../../navigation/routes';

const calls = getCallsForTL(tlUser.id, {
  timeScope: 'today',
  feedbackStatus: filterStatus, // PENDING | SUBMITTED | undefined
});

// Card CTA
<Button onClick={() => navigate(ROUTES.TL_CALL_DETAIL, { callId: call.id })}>
  View Call
</Button>
```

### 5. App.tsx Routing
```typescript
import { CallFeedbackPageNew } from './components/pages/CallFeedbackPageNew';
import { TLCallDetailPage } from './components/pages/TLCallDetailPage';
import { ROUTES } from './navigation/routes';

// In your routing switch/if-else
case ROUTES.CALL_FEEDBACK:
  return <CallFeedbackPageNew 
    callId={params.callId} 
    onBack={() => navigate(ROUTES.HOME)} 
  />;

case ROUTES.TL_CALL_DETAIL:
  return <TLCallDetailPage 
    callId={params.callId} 
    onBack={() => navigate(ROUTES.HOME)} 
  />;
```

---

## 📊 Test Data (Ready to Use)

| Dealer | Call ID | Date | Status | Purpose |
|--------|---------|------|--------|---------|
| Daily Motoz | `call-20260205-001` | Today 10:30 AM | `PENDING` ⚠️ | Test Enter Feedback |
| Gupta Auto World | `call-20260205-002` | Today 11:15 AM | `SUBMITTED` ✅ | Test View Feedback |
| Sharma Motors | `call-20251222-001` | 45 days ago | `SUBMITTED` | Test Dormant |

---

## 🔍 Feedback Structure

```typescript
const feedbackPayload = {
  callOutcome: 'CONNECTED',
  
  carSell: {
    discussed: true,
    outcome: 'AGREED_TO_SHARE',
    expectedSellerLeadsPerWeek: 3,
    expectedInventoryLeadsPerWeek: 2,
  },
  
  dcf: {
    discussed: true,
    status: 'ALREADY_ONBOARDED',
    expectedDCFLeadsPerMonth: 5,
  },
  
  notes: 'Optional notes here',
  
  nextActions: {
    followUpCall: true,
    scheduleVisit: false,
    shareTraining: true,
    scheduleDCFdemo: true,
    followUpDate: '2026-02-12T00:00:00Z',
  },
};

submitCallFeedback(callId, feedbackPayload);
```

---

## 🎨 UI States

### Call Card States
1. **Not Attempted**: Blue "Call now" button
2. **Pending Feedback**: Red badge + "Enter Feedback" button
3. **Submitted**: Green badge + "View Feedback" button

### Colors
- Pending: `bg-red-100 text-red-700 border-red-200`
- Submitted: `bg-green-100 text-green-700 border-green-200`

---

## ⚠️ Important Rules

1. **Mandatory Feedback**: Cannot skip after call ends
2. **No Blocking**: Can make multiple calls with pending feedback
3. **60-Day Cap**: getAllCallsForUser respects maxDays parameter
4. **Feedback ≠ Productivity**: Separate concerns
5. **TL Review**: Stored separately, doesn't override productivity

---

## 🚀 Routes

```typescript
ROUTES.CALL_FEEDBACK     // KAM feedback entry
ROUTES.CALL_DETAIL       // KAM call detail
ROUTES.TL_CALL_DETAIL    // TL review page
```

---

## 📝 Validation Rules

### Call Outcome (Mandatory)
- CONNECTED
- NOT_REACHABLE
- BUSY
- CALL_BACK

### Car Sell Outcome (If discussed = true)
- AGREED_TO_SHARE
- ALREADY_SHARING
- HESITANT
- NOT_INTERESTED

### DCF Status (If discussed = true)
- ALREADY_ONBOARDED
- INTERESTED
- NEEDS_DEMO
- NOT_INTERESTED

### Next Actions
- If ANY checkbox selected → Follow-up date is MANDATORY

---

## 🧪 Quick Test Commands

```typescript
// Test 1: Create call
const call = createCallAttempt({
  dealerId: 'dealer-ncr-001',
  kamId: 'kam-ncr-001',
  phone: '+919876543210',
});

// Test 2: Submit feedback
const updated = submitCallFeedback('call-20260205-001', {
  callOutcome: 'CONNECTED',
  carSell: { discussed: true, outcome: 'AGREED_TO_SHARE' },
  dcf: { discussed: false },
});

// Test 3: Get today's calls
const todayCalls = getTodayCallsForUser('kam-ncr-001', 'today');
console.log(todayCalls.length); // Should be 2+

// Test 4: TL review
const reviewed = submitTLReview('call-20260205-002', {
  comment: 'Great job!',
  flagged: false,
  tlId: 'tl-ncr-001',
  tlName: 'Rajesh Kumar',
});
```

---

## 📚 Documentation

- Full details: `/CALLS_MODULE_COMPLETE.md`
- Test script: `/CALLS_MODULE_TEST_SCRIPT.md`
- This reference: `/CALLS_MODULE_QUICK_REFERENCE.md`

---

## ✅ Checklist for Integration

- [ ] Add "Call now" button (createCallAttempt + tel: link)
- [ ] Add "I ended the call" sheet (endCallAttempt + navigate)
- [ ] Update Today tab to show 3 states
- [ ] Add banner: "X calls pending feedback"
- [ ] Update TL view with "View Call" CTA
- [ ] Add CALL_FEEDBACK route to App.tsx
- [ ] Add TL_CALL_DETAIL route to App.tsx
- [ ] Test end-to-end flow
- [ ] Verify no inline mock arrays (use selectors)
- [ ] Confirm 60-day cap works

---

## 🎯 Next Developer Action

**Priority 1**: Wire up "Call now" button in Today/Suggested tabs  
**Priority 2**: Add route handlers to App.tsx  
**Priority 3**: Test complete flow: Call → Dialer → Feedback → Today  

---

**Status**: 🟢 **READY FOR INTEGRATION**

All data layer complete. UI pages complete. Routes defined. Mock data ready.
