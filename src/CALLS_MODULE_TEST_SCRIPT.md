# Calls Module - Quick Test Script

## Test Environment Setup

Today's date: **February 5, 2026**

---

## Test 1: Verify Mock Data Exists

### Test Case: Check 3 Test Dealers
```typescript
import { CALLS } from './data/mockDatabase';
import { getCallById, getTodayCallsForUser } from './data/selectors';

// Should find 3 calls from Feb 5, 2026
const dailyMotozCall = getCallById('call-20260205-001');
const guptaAutoCall = getCallById('call-20260205-002');
const sharmaMotorsCall = getCallById('call-20251222-001');

console.assert(dailyMotozCall !== undefined, 'Daily Motoz call should exist');
console.assert(guptaAutoCall !== undefined, 'Gupta Auto call should exist');
console.assert(sharmaMotorsCall !== undefined, 'Sharma Motors call should exist');

// Check statuses
console.assert(dailyMotozCall.feedbackStatus === 'PENDING', 'Daily Motoz feedback should be pending');
console.assert(guptaAutoCall.feedbackStatus === 'SUBMITTED', 'Gupta Auto feedback should be submitted');
console.assert(sharmaMotorsCall.feedbackStatus === 'SUBMITTED', 'Sharma Motors feedback should be submitted');

console.log('✅ Test 1 PASSED: Mock data exists with correct statuses');
```

**Expected Output**:
```
✅ Test 1 PASSED: Mock data exists with correct statuses
```

---

## Test 2: Create New Call Attempt

### Test Case: KAM makes a call
```typescript
import { createCallAttempt, getCallById } from './data/selectors';

const beforeCount = CALLS.length;

const newCall = createCallAttempt({
  dealerId: 'dealer-ncr-001', // Daily Motoz
  kamId: 'kam-ncr-001', // Amit Verma
  phone: '+919876543210',
});

const afterCount = CALLS.length;

// Assertions
console.assert(afterCount === beforeCount + 1, 'Call count should increase by 1');
console.assert(newCall.feedbackStatus === 'PENDING', 'New call should have PENDING feedback');
console.assert(newCall.callStatus === 'ATTEMPTED', 'New call should have ATTEMPTED status');
console.assert(newCall.recordingStatus === 'AVAILABLE', 'Recording should be AVAILABLE');
console.assert(newCall.dealerName === 'Daily Motoz', 'Dealer name should match');
console.assert(newCall.kamName === 'Amit Verma', 'KAM name should match');
console.assert(newCall.recordingUrl?.includes('recording-'), 'Recording URL should be generated');

console.log('✅ Test 2 PASSED: Call attempt created successfully');
console.log('   Call ID:', newCall.id);
console.log('   Duration:', newCall.duration);
console.log('   Recording:', newCall.recordingUrl);
```

**Expected Output**:
```
✅ Test 2 PASSED: Call attempt created successfully
   Call ID: call-1738742400000-010
   Duration: 0m 0s
   Recording: recording-call-1738742400000-010.mp3
```

---

## Test 3: End Call Attempt

### Test Case: Mark call as ended
```typescript
import { endCallAttempt, getCallById } from './data/selectors';

const callId = 'call-20260205-001'; // Daily Motoz call
const durationSec = 272; // 4m 32s

const updatedCall = endCallAttempt(callId, { durationSec });

// Assertions
console.assert(updatedCall !== undefined, 'Call should be found');
console.assert(updatedCall.durationSec === 272, 'Duration should be set');
console.assert(updatedCall.callEndTime !== null, 'End time should be set');
console.assert(updatedCall.duration === '4m 32s', 'Duration string should be formatted');

console.log('✅ Test 3 PASSED: Call ended successfully');
console.log('   End Time:', updatedCall.callEndTime);
console.log('   Duration:', updatedCall.duration);
```

**Expected Output**:
```
✅ Test 3 PASSED: Call ended successfully
   End Time: 2026-02-05T...Z
   Duration: 4m 32s
```

---

## Test 4: Submit Call Feedback

### Test Case: KAM submits structured feedback
```typescript
import { submitCallFeedback, getCallById } from './data/selectors';

const callId = 'call-20260205-001'; // Daily Motoz call (currently PENDING)

const feedbackPayload = {
  callOutcome: 'CONNECTED' as const,
  carSell: {
    discussed: true,
    outcome: 'AGREED_TO_SHARE' as const,
    expectedSellerLeadsPerWeek: 3,
    expectedInventoryLeadsPerWeek: 2,
  },
  dcf: {
    discussed: true,
    status: 'INTERESTED' as const,
    expectedDCFLeadsPerMonth: 4,
  },
  notes: 'Dealer is very interested in both Car Sell and DCF. Will follow up next week.',
  nextActions: {
    followUpCall: true,
    scheduleVisit: false,
    shareTraining: true,
    scheduleDCFdemo: true,
    followUpDate: '2026-02-12T00:00:00Z',
  },
};

const updatedCall = submitCallFeedback(callId, feedbackPayload);

// Assertions
console.assert(updatedCall !== undefined, 'Call should be found');
console.assert(updatedCall.feedbackStatus === 'SUBMITTED', 'Feedback should be SUBMITTED');
console.assert(updatedCall.feedbackSubmittedAt !== undefined, 'Submission timestamp should be set');
console.assert(updatedCall.callStatus === 'CONNECTED', 'Call status should be CONNECTED');
console.assert(updatedCall.outcome === 'Connected', 'Legacy outcome should be mapped');

// Check feedback structure
console.assert(updatedCall.feedback?.carSell.discussed === true, 'Car sell should be discussed');
console.assert(updatedCall.feedback?.carSell.outcome === 'AGREED_TO_SHARE', 'Car sell outcome should match');
console.assert(updatedCall.feedback?.carSell.expectedSellerLeadsPerWeek === 3, 'Expected seller leads should match');
console.assert(updatedCall.feedback?.dcf.discussed === true, 'DCF should be discussed');
console.assert(updatedCall.feedback?.dcf.status === 'INTERESTED', 'DCF status should match');
console.assert(updatedCall.feedback?.nextActions?.followUpCall === true, 'Follow-up call action should be set');

console.log('✅ Test 4 PASSED: Feedback submitted successfully');
console.log('   Feedback Status:', updatedCall.feedbackStatus);
console.log('   Call Status:', updatedCall.callStatus);
console.log('   Car Sell Outcome:', updatedCall.feedback?.carSell.outcome);
console.log('   DCF Status:', updatedCall.feedback?.dcf.status);
```

**Expected Output**:
```
✅ Test 4 PASSED: Feedback submitted successfully
   Feedback Status: SUBMITTED
   Call Status: CONNECTED
   Car Sell Outcome: AGREED_TO_SHARE
   DCF Status: INTERESTED
```

---

## Test 5: Get Today's Calls for KAM

### Test Case: Retrieve all calls made today
```typescript
import { getTodayCallsForUser } from './data/selectors';

const kamId = 'kam-ncr-001'; // Amit Verma
const todayCalls = getTodayCallsForUser(kamId, 'today');

// Assertions
console.assert(todayCalls.length >= 2, 'Should have at least 2 calls today');
console.assert(todayCalls.every(c => c.callDate === '2026-02-05'), 'All calls should be from today');
console.assert(todayCalls.every(c => c.kamId === kamId), 'All calls should belong to the KAM');

// Check sorted by time (descending)
const times = todayCalls.map(c => new Date(`${c.callDate} ${c.callTime}`).getTime());
for (let i = 1; i < times.length; i++) {
  console.assert(times[i - 1] >= times[i], 'Calls should be sorted by time descending');
}

// Count pending vs submitted
const pending = todayCalls.filter(c => c.feedbackStatus === 'PENDING');
const submitted = todayCalls.filter(c => c.feedbackStatus === 'SUBMITTED');

console.log('✅ Test 5 PASSED: Today calls retrieved successfully');
console.log('   Total calls:', todayCalls.length);
console.log('   Pending feedback:', pending.length);
console.log('   Feedback submitted:', submitted.length);
```

**Expected Output**:
```
✅ Test 5 PASSED: Today calls retrieved successfully
   Total calls: 2
   Pending feedback: 0-1 (depends on Test 4)
   Feedback submitted: 1-2 (depends on Test 4)
```

---

## Test 6: Get Calls for TL with Filters

### Test Case: TL views calls with filters
```typescript
import { getCallsForTL } from './data/selectors';

const tlId = 'tl-ncr-001'; // Rajesh Kumar

// Test 1: All calls today
const allToday = getCallsForTL(tlId, { timeScope: 'today' });
console.assert(allToday.every(c => c.tlId === tlId), 'All calls should belong to TL');

// Test 2: Only pending feedback
const pendingToday = getCallsForTL(tlId, {
  timeScope: 'today',
  feedbackStatus: 'PENDING',
});
console.assert(pendingToday.every(c => c.feedbackStatus === 'PENDING'), 'All calls should have pending feedback');

// Test 3: Only submitted feedback
const submittedToday = getCallsForTL(tlId, {
  timeScope: 'today',
  feedbackStatus: 'SUBMITTED',
});
console.assert(submittedToday.every(c => c.feedbackStatus === 'SUBMITTED'), 'All calls should have submitted feedback');

// Test 4: Filter by specific KAM
const kamCalls = getCallsForTL(tlId, {
  timeScope: 'today',
  kamId: 'kam-ncr-001',
});
console.assert(kamCalls.every(c => c.kamId === 'kam-ncr-001'), 'All calls should belong to specific KAM');

console.log('✅ Test 6 PASSED: TL filters working correctly');
console.log('   All today:', allToday.length);
console.log('   Pending:', pendingToday.length);
console.log('   Submitted:', submittedToday.length);
console.log('   Specific KAM:', kamCalls.length);
```

**Expected Output**:
```
✅ Test 6 PASSED: TL filters working correctly
   All today: 2
   Pending: 0-1
   Submitted: 1-2
   Specific KAM: 2
```

---

## Test 7: Submit TL Review

### Test Case: TL adds coaching notes
```typescript
import { submitTLReview, getCallDetailDTO } from './data/selectors';

const callId = 'call-20260205-002'; // Gupta Auto call (with feedback)

const review = {
  comment: 'Great job on getting the lead commitment! Make sure to follow up on the promised date.',
  flagged: true,
  markedForReview: false,
  tlId: 'tl-ncr-001',
  tlName: 'Rajesh Kumar',
};

const updatedCall = submitTLReview(callId, review);

// Assertions
console.assert(updatedCall !== undefined, 'Call should be found');
console.assert(updatedCall.tlReview !== undefined, 'TL review should be set');
console.assert(updatedCall.tlReview?.comment === review.comment, 'Comment should match');
console.assert(updatedCall.tlReview?.flagged === true, 'Flagged should be true');
console.assert(updatedCall.tlReview?.tlName === 'Rajesh Kumar', 'TL name should match');
console.assert(updatedCall.tlReview?.reviewedAt !== undefined, 'Review timestamp should be set');

// Verify using getCallDetailDTO
const detailDTO = getCallDetailDTO(callId);
console.assert(detailDTO?.tlReview?.comment === review.comment, 'DTO should include TL review');

console.log('✅ Test 7 PASSED: TL review submitted successfully');
console.log('   TL:', detailDTO?.tlReview?.tlName);
console.log('   Comment:', detailDTO?.tlReview?.comment);
console.log('   Flagged:', detailDTO?.tlReview?.flagged);
console.log('   Reviewed At:', detailDTO?.tlReview?.reviewedAt);
```

**Expected Output**:
```
✅ Test 7 PASSED: TL review submitted successfully
   TL: Rajesh Kumar
   Comment: Great job on getting the lead commitment! Make sure to follow up on the promised date.
   Flagged: true
   Reviewed At: 2026-02-05T...Z
```

---

## Test 8: Get Call Detail DTO

### Test Case: Retrieve full call details with relationships
```typescript
import { getCallDetailDTO } from './data/selectors';

const callId = 'call-20260205-002'; // Gupta Auto call

const callDetail = getCallDetailDTO(callId);

// Assertions
console.assert(callDetail !== undefined, 'Call detail should be found');
console.assert(callDetail.dealer !== undefined, 'Dealer should be included');
console.assert(callDetail.kam !== undefined, 'KAM should be included');
console.assert(callDetail.dealer?.name === 'Gupta Auto World', 'Dealer name should match');
console.assert(callDetail.kam?.name === 'Amit Verma', 'KAM name should match');
console.assert(callDetail.feedback !== undefined, 'Feedback should be included');
console.assert(callDetail.tlReview !== undefined, 'TL review should be included (if submitted)');

console.log('✅ Test 8 PASSED: Call detail DTO retrieved successfully');
console.log('   Dealer:', callDetail.dealer?.name);
console.log('   KAM:', callDetail.kam?.name);
console.log('   Feedback Status:', callDetail.feedbackStatus);
console.log('   TL Review:', callDetail.tlReview ? 'Yes' : 'No');
```

**Expected Output**:
```
✅ Test 8 PASSED: Call detail DTO retrieved successfully
   Dealer: Gupta Auto World
   KAM: Amit Verma
   Feedback Status: SUBMITTED
   TL Review: Yes
```

---

## Test 9: Validate 60-Day Cap

### Test Case: Ensure getAllCallsForUser caps at 60 days
```typescript
import { getAllCallsForUser } from './data/selectors';

const kamId = 'kam-ncr-001'; // Amit Verma

// Test with default 60 days
const all60Days = getAllCallsForUser(kamId, 'last-60d', 60);

// Test with 30 days
const all30Days = getAllCallsForUser(kamId, 'last-30d', 30);

// Test with 7 days
const all7Days = getAllCallsForUser(kamId, 'last-7d', 7);

// Assertions
const now = new Date('2026-02-05');
const date60DaysAgo = new Date(now);
date60DaysAgo.setDate(date60DaysAgo.getDate() - 60);
const date60Str = date60DaysAgo.toISOString().split('T')[0];

const date30DaysAgo = new Date(now);
date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
const date30Str = date30DaysAgo.toISOString().split('T')[0];

console.assert(all60Days.every(c => c.callDate >= date60Str), 'All calls should be within 60 days');
console.assert(all30Days.every(c => c.callDate >= date30Str), 'All calls should be within 30 days');

console.log('✅ Test 9 PASSED: 60-day cap working correctly');
console.log('   Last 60 days:', all60Days.length);
console.log('   Last 30 days:', all30Days.length);
console.log('   Last 7 days:', all7Days.length);
```

**Expected Output**:
```
✅ Test 9 PASSED: 60-day cap working correctly
   Last 60 days: 3-4
   Last 30 days: 2-3
   Last 7 days: 2-3
```

---

## Test 10: Validate Feedback Structure Completeness

### Test Case: Ensure feedback has all required fields
```typescript
import { getCallById } from './data/selectors';

const callId = 'call-20260205-002'; // Gupta Auto call (with complete feedback)
const call = getCallById(callId);

// Assertions
console.assert(call?.feedback !== undefined, 'Feedback should exist');

const feedback = call.feedback!;

// Call outcome
console.assert(feedback.callOutcome !== undefined, 'Call outcome should be set');
console.assert(['CONNECTED', 'NOT_REACHABLE', 'BUSY', 'CALL_BACK'].includes(feedback.callOutcome), 'Call outcome should be valid');

// Car Sell
console.assert(feedback.carSell !== undefined, 'Car sell should be defined');
console.assert(typeof feedback.carSell.discussed === 'boolean', 'Car sell discussed should be boolean');

if (feedback.carSell.discussed) {
  console.assert(feedback.carSell.outcome !== undefined, 'Car sell outcome should be set if discussed');
  console.assert(['AGREED_TO_SHARE', 'ALREADY_SHARING', 'HESITANT', 'NOT_INTERESTED'].includes(feedback.carSell.outcome!), 'Car sell outcome should be valid');
}

// DCF
console.assert(feedback.dcf !== undefined, 'DCF should be defined');
console.assert(typeof feedback.dcf.discussed === 'boolean', 'DCF discussed should be boolean');

if (feedback.dcf.discussed) {
  console.assert(feedback.dcf.status !== undefined, 'DCF status should be set if discussed');
  console.assert(['ALREADY_ONBOARDED', 'INTERESTED', 'NEEDS_DEMO', 'NOT_INTERESTED'].includes(feedback.dcf.status!), 'DCF status should be valid');
}

// Next Actions
if (feedback.nextActions) {
  const hasAnyAction = feedback.nextActions.followUpCall || 
                      feedback.nextActions.scheduleVisit || 
                      feedback.nextActions.shareTraining || 
                      feedback.nextActions.scheduleDCFdemo;
  
  if (hasAnyAction) {
    console.assert(feedback.nextActions.followUpDate !== null && feedback.nextActions.followUpDate !== undefined, 'Follow-up date should be set if actions selected');
  }
}

console.log('✅ Test 10 PASSED: Feedback structure is complete and valid');
console.log('   Call Outcome:', feedback.callOutcome);
console.log('   Car Sell:', feedback.carSell.discussed ? feedback.carSell.outcome : 'Not discussed');
console.log('   DCF:', feedback.dcf.discussed ? feedback.dcf.status : 'Not discussed');
console.log('   Next Actions:', feedback.nextActions ? 'Set' : 'Not set');
```

**Expected Output**:
```
✅ Test 10 PASSED: Feedback structure is complete and valid
   Call Outcome: CONNECTED
   Car Sell: AGREED_TO_SHARE
   DCF: ALREADY_ONBOARDED
   Next Actions: Set
```

---

## Summary

All 10 tests validate:
1. ✅ Mock data exists
2. ✅ Call creation works
3. ✅ Call ending works
4. ✅ Feedback submission works
5. ✅ Today calls retrieval works
6. ✅ TL filters work
7. ✅ TL review works
8. ✅ Call detail DTO works
9. ✅ 60-day cap works
10. ✅ Feedback structure is complete

---

## Running the Tests

To run these tests in your development environment:

```bash
# Option 1: Browser Console
# Open browser dev tools and paste each test

# Option 2: Node.js (if configured)
node --loader ts-node/esm CALLS_MODULE_TEST_SCRIPT.ts

# Option 3: Add to package.json
{
  "scripts": {
    "test:calls": "ts-node -r tsconfig-paths/register CALLS_MODULE_TEST_SCRIPT.ts"
  }
}
```

**Note**: These are unit tests for the data layer. UI integration tests should follow once the pages are wired up in App.tsx.
