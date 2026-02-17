# V/C Visit Flow Fix - Implementation Summary

## Completed Changes

### 1. Routes & Constants
- ✅ Added `VISIT_CHECKIN` route to `/lib/domain/constants.ts`
- ✅ Added `VISIT_CHECKIN` to `/navigation/routes.ts`

### 2. Data Layer (vcSelectors.ts)
- ✅ Created `createVisit()` - creates NOT_STARTED visit
- ✅ Created `markVisitCheckedIn()` - marks CHECKED_IN + captures GPS + distance
- ✅ Existing `updateVisitFeedback()` - marks COMPLETED
- ✅ Existing `getPendingVisits()` - returns CHECKED_IN visits
- ✅ Existing `getTodayVisits()` - returns COMPLETED visits for today
- ✅ Existing `getVisitsByScope()` - returns COMPLETED visits by date range

### 3. New Components
- ✅ Created `/components/pages/VisitCheckInPage.tsx`:
  - 200m geofence enforcement
  - Auto-navigate to feedback on successful check-in
  - Show distance, geofence radius, status
  - "Update Dealer Location" button when out of range
  - "Open in Maps" button

### 4. Dealer Detail Page
- ✅ Removed "Start Visit" button (lines 205-214)
- ✅ Activity section remains intact (clickable calls/visits history)
- ✅ Call button remains functional

### 5. Visit State Machine
```
NOT_STARTED → createVisit()
    ↓
CHECKED_IN → markVisitCheckedIn() [auto-navigate to feedback]
    ↓
COMPLETED → updateVisitFeedback()
```

## Remaining Implementation (Next Steps)

### 6. Update VisitFeedbackPage.tsx
Need to integrate with centralized selectors:
- Use `getVisitById(visitId)` instead of ActivityContext
- Use `updateVisitFeedback(visitId, feedbackData)` on submit
- Handle both `visitId` and `id` props for backward compatibility

### 7. Update KAMVisitsViewNew.tsx (V/C Module)
Current file is large and needs updates:
- Add "Pending" section at top of Today tab
- Change "Start Visit" to create NOT_STARTED visit, then navigate to VISIT_CHECKIN
- Add "Resume" button for pending visits that navigates to VISIT_FEEDBACK
- Remove inline check-in code (now handled by VisitCheckInPage)

### 8. Update App.tsx Routing
Add new route handling:
```typescript
case 'visit-checkin':
  return selectedVisitId ? (
    <VisitCheckInPage 
      visitId={selectedVisitId} 
      onBack={() => setCurrentPage('visits')}
      onNavigateToFeedback={(visitId) => {
        setSelectedVisitId(visitId);
        setCurrentPage('visit-feedback');
      }}
      onNavigateToLocationUpdate={navigateToDealerLocationUpdate}
    />
  ) : null;
```

### 9. Navigation Handlers in App.tsx
Add:
```typescript
const navigateToVisitCheckIn = (visitId: string) => {
  setSelectedVisitId(visitId);
  setCurrentPage('visit-checkin');
};
```

### 10. Add mock data for testing
Create 2-3 visits in mockDatabase.ts with different states:
- 1 visit with status: 'NOT_STARTED'
- 1 visit with status: 'CHECKED_IN' (for pending/resume)
- 1 visit with status: 'COMPLETED'

## Test Scenarios

### Test 1: Happy Path (Start → Check-in → Feedback → Complete)
1. Navigate to V/C → Visits tab
2. Click "Start Visit" on a suggested dealer
3. **Expected**: Visit created with NOT_STARTED, navigate to Check-In page
4. **Expected**: Check-In page shows distance, geofence status
5. If within 200m, click "Check In"
6. **Expected**: Visit marked CHECKED_IN, auto-navigate to Visit Feedback
7. Fill feedback form and submit
8. **Expected**: Visit marked COMPLETED, navigate back to V/C with completed visit visible

### Test 2: Pending Visit Resume
1. Start a visit and check-in (don't complete feedback)
2. Navigate away from feedback page
3. Go to V/C → Visits → Today tab
4. **Expected**: Pending section visible at top with the checked-in visit
5. Click "Resume" on pending visit
6. **Expected**: Navigate to Visit Feedback page
7. Complete feedback
8. **Expected**: Visit marked COMPLETED, pending section disappears

### Test 3: Check-in Blocked (>200m)
1. Start a visit for a dealer far away (or mock GPS to be far)
2. **Expected**: Check-In button disabled
3. **Expected**: Distance shown, warning message displayed
4. **Expected**: "Update Dealer Location" button visible
5. Click "Update Dealer Location"
6. **Expected**: Navigate to location update page

### Test 4: Dealer Detail - No Start Visit
1. Navigate to any dealer detail page
2. **Expected**: No "Start Visit" button visible
3. **Expected**: Call button still visible
4. **Expected**: Activity tab shows calls & visits history
5. Click on a visit in activity
6. **Expected**: Navigate to Visit Detail page (read-only)

## File Changes Summary

### Modified Files
1. `/lib/domain/constants.ts` - Added VISIT_CHECKIN route
2. `/navigation/routes.ts` - Added VISIT_CHECKIN route
3. `/data/vcSelectors.ts` - Added createVisit() and markVisitCheckedIn()
4. `/components/pages/DealerDetailPage.tsx` - Removed Start Visit button

### New Files
1. `/components/pages/VisitCheckInPage.tsx` - Standalone check-in page with 200m enforcement

### Files To Update (Remaining)
1. `/components/pages/VisitFeedbackPage.tsx` - Integrate with centralized selectors
2. `/components/visits/KAMVisitsViewNew.tsx` - Add Pending section, fix navigation flow
3. `/App.tsx` - Add VISIT_CHECKIN route handling and navigation functions
4. `/data/mockDatabase.ts` - Add test visits with different states

## Architecture Benefits

1. **Single Source of Truth**: All visit state in mockDatabase + vcSelectors
2. **No Scattered Logic**: Visit creation, check-in, completion all centralized
3. **Proper State Machine**: Clear states (NOT_STARTED → CHECKED_IN → COMPLETED)
4. **Easy Testing**: Selectors can be unit tested independently
5. **Audit Trail**: All check-ins store GPS + distance for compliance
6. **Resume Support**: Pending visits (CHECKED_IN but not completed) easily queryable
