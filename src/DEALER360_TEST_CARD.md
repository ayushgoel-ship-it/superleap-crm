# Dealer360 v2 - Quick Test Card 🧪

## 5-Step Manual Test Flow

### ✅ Test 1: Geo-Gating (200m radius)

```
Action: Open Daily Motoz → Click "Start Visit"
Expected:
  - Browser asks for location permission
  - If WITHIN 200m: "Location verified! Starting visit check-in..."
  - If OUTSIDE 200m: "You are 1.2km away. Move within 200m..."
  - If no permission: "Location permission denied..."
Pass: [ ] Success toast when within 200m
Pass: [ ] Error toast with distance when outside 200m
Pass: [ ] Navigate to visit check-in only if within 200m
```

---

### ✅ Test 2: Call Flow

```
Action: Open Daily Motoz → Click "Call" button
Expected:
  - tel: link opens (dialer on mobile)
  - Navigate to Call Feedback screen
  - Fill feedback → Submit
  - Call appears in Activity tab
  - Click call → Opens Call Detail page
Pass: [ ] Dialer opens
Pass: [ ] Call logging screen appears
Pass: [ ] Call appears in Activity tab after submit
Pass: [ ] Call detail shows feedback + productivity
```

---

### ✅ Test 3: Time Filters + Data Updates

```
Action: Open Daily Motoz → Overview tab
Steps:
  1. Default filter: D-7
  2. Verify metrics (Inspections, Stock-ins, DCF Leads, DCF Disb)
  3. Click "MTD" → 250ms loading → metrics update
  4. Switch to Leads tab → filter shows: D-1, MTD, LM, L6M
  5. Switch to Activity tab → filter shows: D-1, D-7, LM, L6M
  6. Change filter → activity list updates
Pass: [ ] Loading spinner on filter change
Pass: [ ] Metrics update correctly
Pass: [ ] Filter persists across tabs
Pass: [ ] Leads tab has MTD option
```

---

### ✅ Test 4: Clickable Activity (No WhatsApp)

```
Action: Open Daily Motoz → Activity tab
Expected:
  - Only Calls and Visits shown (NO WhatsApp)
  - Each item has hover state (border + shadow)
  - Click Call → Navigate to Call Detail
  - Click Visit → Navigate to Visit Detail
Pass: [ ] No WhatsApp activity
Pass: [ ] Call item clickable → Call Detail page
Pass: [ ] Visit item clickable → Visit Detail page
Pass: [ ] Hover state works
Pass: [ ] External link icon visible
```

---

### ✅ Test 5: DCF Onboarding Flow

```
Action: Open Sharma Motors (not DCF onboarded) → DCF tab
Steps:
  1. See "Start DCF Onboarding" CTA
  2. Click "Begin Onboarding Process"
  3. Navigate to DCF Onboarding Form
  4. Fill 18 required fields
  5. Upload 6 required documents
  6. Submit form
  7. Success toast → Navigate back to Dealer Detail
  8. DCF tab now shows onboarding status tracker
  9. Dealer has "DCF Onboarded" tag
Pass: [ ] Onboarding CTA shown when not onboarded
Pass: [ ] Form has all 18 fields + 8 uploads
Pass: [ ] Validation works (try submitting empty)
Pass: [ ] Submit success → dealer status updates
Pass: [ ] Status tracker appears after onboarding
```

---

## Quick Checklist (90 seconds)

```
[ ] 1. Start Visit enforces 200m geo-gate
[ ] 2. Call button opens dialer + logging
[ ] 3. Activity tab: no WhatsApp, items clickable
[ ] 4. Leads tab: cards clickable, MTD filter exists
[ ] 5. DCF tab: onboarding CTA → form → status tracker
[ ] 6. Time filters: D-1, D-7, LM, L6M (+ MTD for Leads)
[ ] 7. Overview: 4 primary metrics + 3 secondary
[ ] 8. Quick Actions: only "Start Visit" + "Create Lead"
[ ] 9. All navigation uses ROUTES constants
[ ] 10. No inline mock data in Dealer360View
```

---

## Error Cases to Test

### Location Errors

```
1. Location permission denied
   → "Location permission denied. Please enable location access..."

2. Location unavailable (GPS off)
   → "Location unavailable. Please check your device settings..."

3. Location timeout (slow GPS)
   → "Location request timed out. Please try again."

4. Dealer location missing
   → "Dealer location not available. Cannot start visit."
```

### Data Errors

```
1. Dealer not found
   → "Dealer not found" + Go Back button

2. No activities in timeframe
   → "No activity found for selected time period"

3. No leads in timeframe
   → "No leads found for selected time period"

4. No DCF loans
   → "No DCF loans found for selected time period"
```

---

## Route Navigation Check

```
Verify these routes work:

From Dealer360View:
  → ROUTES.VISIT_FEEDBACK (Start Visit)
  → ROUTES.CALL_FEEDBACK (Call button)
  → ROUTES.CALL_DETAIL (Activity → Call item)
  → ROUTES.VISIT_DETAIL (Activity → Visit item)
  → ROUTES.LEAD_DETAIL (Leads → Lead card)
  → ROUTES.DCF_LEAD_DETAIL (DCF → Loan card)
  → ROUTES.DCF_ONBOARDING_FORM (DCF → Onboarding CTA)

From Detail Pages:
  → Back to Dealer360View (Close button)
```

---

## Data Flow Verification

```
Check data comes from selectors:

1. Dealer header info
   → getDealerDTO(dealerId)

2. Metrics for selected time filter
   → getDealerMetricsForScope(dealerId, timeScope)

3. Activity list
   → getDealerActivitiesForScope(dealerId, timeScope)

4. Leads list
   → getDealerLeadsForScope(dealerId, timeScope)

5. DCF loans list
   → getDealerDCFLoansForScope(dealerId, timeScope)

6. Complete scoped data
   → getDealer360ForScope(dealerId, { timeScope })
```

---

## Performance Check

```
[ ] Loading spinner appears on filter change
[ ] Spinner duration: ~250ms (not instant, not slow)
[ ] No jank/flicker when switching tabs
[ ] Smooth animations (button hover, card hover)
[ ] Toast notifications clear and readable
[ ] No console errors
[ ] No console warnings about missing keys
```

---

## Regression Check (Things That Should Still Work)

```
[ ] DealerQuickActionsCard removed "Add DCF Lead" button
[ ] Issues tab completely removed from tabs
[ ] WhatsApp activity completely removed from Activity tab
[ ] Tags display correctly (Top Dealer, DCF Onboarded, etc.)
[ ] Segment badge shows (A/B/C with correct colors)
[ ] Phone/WhatsApp buttons work from header
[ ] Back button closes Dealer360View
```

---

## Browser/Device Tests

### Desktop
```
[ ] Chrome: All features work
[ ] Firefox: All features work
[ ] Safari: All features work
[ ] Edge: All features work
```

### Mobile
```
[ ] iOS Safari: Location permission works, tel: link opens dialer
[ ] Android Chrome: Location permission works, tel: link opens dialer
[ ] Responsive layout: tabs scroll, buttons stack
```

---

## Acceptance Sign-Off

```
Feature Owner: __________________  Date: __________
QA Tester: ______________________  Date: __________
Product Manager: ________________  Date: __________

Ready for Production: [ ] YES  [ ] NO

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Quick Test Complete!** ✅

Pass all 5 tests → Ready for deployment
Any test fails → Check DEALER360_V2_COMPLETE.md for implementation details
