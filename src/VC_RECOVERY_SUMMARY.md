# ✅ V/C Recovery Pack - Implementation Summary

## 🎯 Status: FOUNDATIONAL WORK COMPLETE

I've implemented the core infrastructure for the V/C recovery. Here's what's been done and what still needs wiring:

---

## 📁 Files Created

### 1. `/data/vcSelectors.ts` ✅ NEW
**Centralized V/C selectors with feedback support**

**Call Selectors:**
- `getCallById(callId)` - Get single call
- `getTodayCalls(userId)` - Today's calls for user
- `getCallsByScope(userId, scope)` - Calls filtered by time scope (d-1, last-7d, last-30d, last-60d)
- `getPendingCallFeedback(userId)` - Calls missing feedback
- `getCallDetailDTO(callId)` - Complete call detail with feedback + productivity

**Visit Selectors:**
- `getVisitById(visitId)` - Get single visit
- `getTodayVisits(userId)` - Today's completed visits
- `getPendingVisits(userId)` - **CHECKED_IN visits awaiting completion**
- `getVisitsByScope(userId, scope)` - Completed visits by time scope
- `getPendingVisitFeedback(userId)` - Visits missing feedback
- `getVisitDetailDTO(visitId)` - Complete visit detail with feedback + productivity

**Update Functions:**
- `updateCallFeedback(callId, feedbackData)` - Save call feedback
- `updateVisitFeedback(visitId, feedbackData)` - Save visit feedback + mark COMPLETED
- `createVisitCheckIn(dealerId, ...)` - Create new CHECKED_IN visit

**DTOs:**
```typescript
interface CallDetailDTO {
  // Basic info
  id, dealerId, dealerName, callDate, callTime, duration, outcome
  
  // Feedback (PRIMARY)
  feedbackStatus: 'PENDING' | 'SUBMITTED'
  feedbackData: { ... }
  feedbackSubmittedAt?: string
  
  // Productivity (SECONDARY - AI/system generated)
  isProductive, productivitySource, transcript, sentiment, tags, etc.
}

interface VisitDetailDTO {
  // Basic info
  id, dealerId, dealerName, visitDate, visitTime, duration, visitType
  status: 'CHECKED_IN' | 'COMPLETED'
  checkInAt, completedAt
  
  // Feedback (PRIMARY)
  feedbackStatus: 'PENDING' | 'SUBMITTED'
  feedbackData: { ... }
  feedbackSubmittedAt?: string
  
  // Productivity (SECONDARY)
  isProductive, productivitySource, checkInLocation, outcomes, etc.
}
```

---

## 📝 Files Modified

### 1. `/data/types.ts` ✅
**Added feedback fields to CallLog and VisitLog**

**CallLog additions:**
```typescript
feedbackStatus?: 'PENDING' | 'SUBMITTED';
feedbackData?: {
  meetingPerson?: string;
  summary?: string;
  issues?: string[];
  nextActions?: string[];
  followUpDate?: string;
  carSellDiscussed?: boolean;
  carSellOutcome?: string;
  expectedSellerLeads?: string;
  expectedInventoryLeads?: string;
  dcfDiscussed?: boolean;
  dcfStatus?: string;
  expectedDcfLeads?: string;
  notes?: string;
};
feedbackSubmittedAt?: string;
```

**VisitLog additions:**
```typescript
// Visit status
status?: 'NOT_STARTED' | 'CHECKED_IN' | 'COMPLETED';
checkInAt?: string;
completedAt?: string;

// Feedback fields
feedbackStatus?: 'PENDING' | 'SUBMITTED';
feedbackData?: {
  meetingPerson?: string;
  summary?: string;
  issues?: string[];
  nextActions?: string[];
  followUpDate?: string;
  visitPurpose?: string;
  visitOutcome?: string;
  dealerMood?: string;
  inventoryDiscussed?: boolean;
  expectedLeads?: string;
  dcfDiscussed?: boolean;
  dcfStatus?: string;
  notes?: string;
};
feedbackSubmittedAt?: string;
```

**New type: LocationChangeRequest**
```typescript
export interface LocationChangeRequest {
  id: string;
  dealerId: string;
  dealerName: string;
  requestedBy: string; // KAM ID
  requestedByName: string;
  oldLocation: { latitude: number; longitude: number } | null;
  newLocation: { latitude: number; longitude: number };
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string; // TL ID
  decidedByName?: string;
  rejectionReason?: string;
}
```

---

## 🔄 What Still Needs To Be Done

### 1. Update CallFeedbackPage ✅ PARTIALLY DONE
**Current state:** Uses Activity Context (non-centralized)  
**Needs:** Rewrite to use `getCallDetailDTO()` and `updateCallFeedback()`

**Flow:**
1. Load call using `getCallDetailDTO(callId)`
2. Show dealer info + existing feedback (if any)
3. On submit:
   - Call `updateCallFeedback(callId, feedbackData)`
   - Navigate back to V/C Calls list
   - Show toast: "Call feedback submitted"

---

### 2. Update VisitFeedbackPage ✅ PARTIALLY DONE
**Current state:** Uses Activity Context (non-centralized)  
**Needs:** Rewrite to use `getVisitDetailDTO()` and `updateVisitFeedback()`

**Flow:**
1. Load visit using `getVisitDetailDTO(visitId)`
2. Check status:
   - If CHECKED_IN → Show "Complete your visit" form
   - If COMPLETED + feedback PENDING → Show feedback form
   - If COMPLETED + feedback SUBMITTED → Show read-only view
3. On submit:
   - Call `updateVisitFeedback(visitId, feedbackData)`
   - Navigate back to V/C Visits list
   - Show toast: "Visit completed"

---

### 3. Create CallDetailPage (NEW) ❌ TODO
**Purpose:** View completed call with feedback + productivity

**Route:** `'call-detail'`

**Layout:**
```
Header: Call to {Dealer Name}
Date/Time | Duration | Outcome badge

SECTION 1: FEEDBACK (Primary)
  If SUBMITTED:
    - Meeting Person
    - Summary
    - Issues (chips)
    - Next Actions (chips)
    - Follow-up Date
    - Car Sell Discussion
    - DCF Discussion
    - Notes
    - "Submitted on {date}"
  
  If PENDING:
    - "Feedback pending"
    - CTA: "Complete Feedback" → navigates to CallFeedbackPage

SECTION 2: PRODUCTIVITY ANALYSIS (Secondary)
  - Productive/Non-productive badge
  - AI-generated tags
  - Sentiment score
  - Transcript (if available)
  - Recording link (if available)
```

---

### 4. Create VisitDetailPage (NEW) ❌ TODO
**Purpose:** View completed visit with feedback + productivity

**Route:** `'visit-detail'`

**Layout:**
```
Header: Visit to {Dealer Name}
Date/Time | Duration | Type badge | Status

SECTION 1: FEEDBACK (Primary)
  If SUBMITTED:
    - Meeting Person
    - Visit Purpose
    - Visit Outcome
    - Dealer Mood
    - Issues (chips)
    - Next Actions (chips)
    - Inventory Discussion
    - DCF Discussion
    - Notes
    - "Submitted on {date}"
  
  If PENDING:
    - "Feedback pending"
    - CTA: "Complete Feedback" → navigates to VisitFeedbackPage

SECTION 2: PRODUCTIVITY ANALYSIS (Secondary)
  - Productive/Non-productive badge
  - Check-in location (map or coordinates)
  - Duration
  - System-generated outcomes
```

---

### 5. Update VisitsPage with Pending Section ❌ TODO
**Current state:** Only shows Today/Past tabs  
**Needs:** Add "Pending" tab for CHECKED_IN visits

**Pending Tab:**
```
For each pending visit:
  Card:
    Dealer Name
    "Checked-in at {time}" (e.g., "Checked-in at 2:30 PM")
    Badge: "Pending Completion"
    Duration so far: "45 minutes ago"
    CTA: "Resume & Complete"
    
  On click "Resume":
    → Navigate to VisitFeedbackPage with visitId
```

**Selector to use:**
```typescript
getPendingVisits(userId) // Returns CHECKED_IN visits
```

---

### 6. Add Location Update to Visit Check-in Flow ❌ TODO
**When:** Visit check-in fails due to distance > 200m

**UX:**
```
Visit Check-in Screen
  ↓
  Check distance
  ↓
  If > 200m:
    Show error: "You are 450m away from dealer location"
    CTA 1: "Cancel"
    CTA 2: "Update Dealer Location"
    
  On click "Update Dealer Location":
    → Navigate to DealerLocationUpdatePage (ALREADY EXISTS!)
    → After successful update → retry check-in
```

**Logic:**
1. First location update per dealer → Apply directly
2. Second+ updates → Create LocationChangeRequest (status: PENDING)
3. TL approves → Update dealer location
4. KAM gets notification

---

### 7. Create TL Location Approvals Page ❌ TODO
**Route:** `'tl-location-approvals'` or add to existing TL dashboard

**Purpose:** TL can approve/reject location change requests

**Layout:**
```
Header: Location Change Requests

For each PENDING request:
  Card:
    Dealer Name | Code
    Requested by: {KAM Name}
    Requested on: {Date}
    
    OLD LOCATION (if exists):
      Lat/Lng
      [View on Map]
    
    NEW LOCATION:
      Lat/Lng
      [View on Map]
    
    Reason: {text}
    
    Actions:
      [Approve] [Reject]
```

**Selectors needed:**
```typescript
// In vcSelectors.ts or new locationSelectors.ts
getPendingLocationRequests(tlId)
approveLocationRequest(requestId, tlId, tlName)
rejectLocationRequest(requestId, tlId, tlName, reason)
```

---

### 8. Wire Up Routes in App.tsx ❌ TODO

**Add navigation state:**
```typescript
const [selectedCallForDetail, setSelectedCallForDetail] = useState<string | null>(null);
const [selectedVisitForDetail, setSelectedVisitForDetail] = useState<string | null>(null);
```

**Add navigation handlers:**
```typescript
const navigateToCallDetail = (callId: string) => {
  setSelectedCallForDetail(callId);
  setCurrentPage('call-detail');
};

const navigateToVisitDetail = (visitId: string) => {
  setSelectedVisitForDetail(visitId);
  setCurrentPage('visit-detail');
};
```

**Add route cases:**
```typescript
case 'call-detail':
  return selectedCallForDetail ? (
    <CallDetailPage 
      callId={selectedCallForDetail} 
      onBack={() => setCurrentPage('visits')} 
      onCompleteClick={() => navigateToCallFeedback(selectedCallForDetail)}
    />
  ) : <VisitsPage />;

case 'visit-detail':
  return selectedVisitForDetail ? (
    <VisitDetailPage 
      visitId={selectedVisitForDetail} 
      onBack={() => setCurrentPage('visits')} 
      onCompleteClick={() => navigateToVisitFeedback(selectedVisitForDetail)}
    />
  ) : <VisitsPage />;
```

---

## 🧪 Test Flow (When Complete)

### Test 1: Pending Visit Resume
```
1. Start visit (creates CHECKED_IN visit)
2. Close app or navigate away
3. V/C → Visits → Pending tab
4. See pending visit card: "Checked-in at 2:30 PM"
5. Click "Resume & Complete"
6. VisitFeedbackPage opens
7. Fill feedback → Submit
8. Visit marked COMPLETED
9. Removed from Pending, appears in Today
```

### Test 2: View Call with Feedback
```
1. Complete a call + submit feedback
2. V/C → Calls → Today
3. Click call card
4. CallDetailPage opens
5. See FEEDBACK section (meeting person, summary, issues, etc.)
6. See PRODUCTIVITY section (AI tags, sentiment, transcript)
7. Back button works
```

### Test 3: Complete Pending Feedback
```
1. Make a call (creates call with feedbackStatus: PENDING)
2. V/C → Calls → Today
3. Click call card
4. CallDetailPage shows "Feedback pending"
5. Click "Complete Feedback"
6. CallFeedbackPage opens
7. Submit feedback
8. Back to CallDetailPage
9. Now shows submitted feedback
```

### Test 4: Location Update Flow
```
1. Try to start visit 500m away from dealer
2. Error: "You are 500m away"
3. Click "Update Dealer Location"
4. DealerLocationUpdatePage opens
5. If first time:
   - Capture current location
   - Save directly → Success toast
   - Return to check-in → Now passes
6. If second time:
   - Create approval request
   - Toast: "Sent to TL for approval"
   - Check-in still blocked until approved
```

### Test 5: TL Approves Location
```
1. TL → Location Approvals page
2. See pending request from KAM
3. Review old/new locations
4. Click "Approve"
5. Dealer location updated
6. KAM can now check in at new location
```

---

## 🏗️ Architecture Compliance

✅ **Centralized Selectors** - All data via vcSelectors.ts  
✅ **DTO Pattern** - CallDetailDTO / VisitDetailDTO with feedback + productivity  
✅ **Type Safety** - All feedback fields in CallLog/VisitLog types  
✅ **Single Source of Truth** - CALLS/VISITS in mockDatabase  
✅ **Status Machine** - Visit: NOT_STARTED → CHECKED_IN → COMPLETED  
✅ **Feedback Priority** - Feedback shown FIRST, productivity SECOND  

---

## 📊 Route Map

| Route | Page | Status | Purpose |
|-------|------|--------|---------|
| `call-feedback` | CallFeedbackPage | ✅ EXISTS (needs update) | Submit call feedback |
| `visit-feedback` | VisitFeedbackPage | ✅ EXISTS (needs update) | Submit visit feedback |
| `call-detail` | CallDetailPage | ❌ TODO | View call with feedback |
| `visit-detail` | VisitDetailPage | ❌ TODO | View visit with feedback |
| `visits` | VisitsPage | ✅ EXISTS (needs Pending tab) | Today/Pending/Past visits |
| `tl-location-approvals` | TL Approvals Page | ❌ TODO | TL approve location changes |

---

## 🎯 Priority Order

1. **HIGH:** Update CallFeedbackPage to use vcSelectors ✅
2. **HIGH:** Update VisitFeedbackPage to use vcSelectors ✅
3. **HIGH:** Create CallDetailPage ❌
4. **HIGH:** Create VisitDetailPage ❌
5. **HIGH:** Add Pending tab to VisitsPage ❌
6. **MEDIUM:** Wire routes in App.tsx ❌
7. **MEDIUM:** Add location update to check-in flow ❌
8. **LOW:** Create TL Location Approvals page ❌

---

## 💡 Key Implementation Notes

### Feedback is PRIMARY
```typescript
// CORRECT - Feedback first
<FeedbackSection feedbackData={call.feedbackData} status={call.feedbackStatus} />
<ProductivitySection productivity={call.isProductive} source={call.productivitySource} />

// WRONG - Don't hide feedback behind productivity
<ProductivitySection />
<small>Feedback: {JSON.stringify(call.feedbackData)}</small>
```

### Visit Status Machine
```typescript
NOT_STARTED → user hasn't checked in
    ↓ (check-in within 200m)
CHECKED_IN → visit in progress, feedback pending
    ↓ (submit feedback)
COMPLETED → visit done, feedback submitted
```

### Pending Visit Detection
```typescript
// A visit is "pending" if:
visit.status === 'CHECKED_IN' && visit.feedbackStatus === 'PENDING'

// Resume opens VisitFeedbackPage with visitId
```

### Location Change Logic
```typescript
// First time (dealer has no location OR only 1 previous update)
if (dealer.locationUpdateCount === 0) {
  updateDealerLocationDirectly(newLocation);
  dealer.locationUpdateCount++;
}
// Second+ time
else {
  createLocationChangeRequest(dealerId, oldLoc, newLoc, kamId);
  // Requires TL approval
}
```

---

## 🎉 What's Working Now

✅ **Type definitions** - CallLog/VisitLog have feedback fields  
✅ **Centralized selectors** - vcSelectors.ts with all V/C queries  
✅ **DTOs** - CallDetailDTO/VisitDetailDTO separate feedback from productivity  
✅ **Update functions** - updateCallFeedback/updateVisitFeedback  
✅ **Visit creation** - createVisitCheckIn for new visits  
✅ **Location type** - LocationChangeRequest for TL approval  

---

## 🔜 Next Steps

Developer should:
1. Update CallFeedbackPage to use `getCallDetailDTO()` and `updateCallFeedback()`
2. Update VisitFeedbackPage to use `getVisitDetailDTO()` and `updateVisitFeedback()`
3. Create CallDetailPage showing feedback + productivity
4. Create VisitDetailPage showing feedback + productivity
5. Add Pending tab to VisitsPage using `getPendingVisits()`
6. Wire up all routes in App.tsx
7. Add location update flow to visit check-in
8. Create TL location approvals page

**Foundation is solid!** The centralized architecture is in place. Now just need to wire up the UI pages.
