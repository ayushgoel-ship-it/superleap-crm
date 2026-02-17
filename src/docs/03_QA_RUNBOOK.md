# SuperLeap CRM - QA Testing Runbook

**Version:** 2.0  
**Last Updated:** February 6, 2026

---

## Table of Contents

1. [Smoke Test Checklist](#smoke-test-checklist)
2. [Critical Flows Test Cases](#critical-flows-test-cases)
3. [Role-Specific Testing](#role-specific-testing)
4. [Debug Playbook](#debug-playbook)
5. [Known Issues](#known-issues)

---

## Smoke Test Checklist

### Pre-Test Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open browser
http://localhost:5173

# 4. Clear localStorage (fresh start)
localStorage.clear()
```

### Basic App Health (5 minutes)

- [ ] App loads without errors (check console for red errors)
- [ ] Login page appears
- [ ] Can login with test credentials (any email/password works - mock)
- [ ] Home page loads after login
- [ ] Bottom navigation shows 5 tabs (KAM view)
- [ ] Hamburger menu opens with menu items
- [ ] Can switch roles (KAM → TL → Admin)
- [ ] Each role shows different bottom nav
- [ ] Can impersonate as different user (Admin → view as KAM)
- [ ] Impersonation banner shows correctly
- [ ] Can exit impersonation

---

## Critical Flows Test Cases

### Flow 1: Calls Module - Attempt → Feedback

**User Story:** As a KAM, I must complete feedback before making another call attempt to the same dealer.

**Test Steps:**

1. **Navigate to Calls/Visits hub:**
   - Click "Visits & Calls" from bottom nav or hamburger menu
   - Switch to "Calls" tab
   - Verify dealer cards show with call CTAs

2. **Attempt first call:**
   - Click "Call Now" on dealer "Daily Motoz"
   - Pre-call screen appears with dealer context
   - Verify past call notes are visible (if any)
   - Click "Start Call" → Opens phone dialer (or mock)
   - Return to app

3. **Submit feedback (mandatory):**
   - Post-call feedback form appears
   - Fill all required fields:
     - Call outcome: "Connected"
     - Car sell discussed: "Yes"
     - Car sell outcome: "Agreed to Share"
     - Expected seller leads: 5
     - DCF discussed: "No"
     - Notes: "Dealer is busy this week"
   - Click "Submit Feedback"
   - Toast: "Feedback submitted successfully"
   - Returns to calls hub

4. **Verify feedback requirement:**
   - Go back to "Daily Motoz" card
   - Should now show "View Feedback" button (not "Call Now")
   - Click "View Feedback" → Shows submitted feedback

5. **Attempt second call to same dealer:**
   - Should NOT be able to call again (feedback already submitted)
   - Can attempt call to different dealer

**Expected Results:**
- ✅ Cannot call same dealer twice without feedback
- ✅ Feedback form is mandatory (submit button disabled until all required fields filled)
- ✅ After feedback, card shows "View Feedback" not "Call Now"
- ✅ Call attempt count tracked (max 3 per dealer per day)

**Failure Scenarios:**
- ❌ If "Call Now" appears after feedback submitted → BUG
- ❌ If can submit feedback with empty required fields → BUG
- ❌ If can make 4+ calls to same dealer → BUG

---

### Flow 2: Visits Module - Check-in → Resume → Complete

**User Story:** As a KAM, I must check in to a visit before completing it, and can resume if interrupted.

**Test Steps:**

1. **Navigate to Visits:**
   - Click "Visits" from bottom nav
   - "Today" tab should be active
   - Verify upcoming visits show

2. **Start visit:**
   - Click "Start Visit" on dealer "Gupta Auto World"
   - Check-in page appears
   - Shows dealer info (name, code, city, address)
   - Mock location shows distance (e.g., "45m away")

3. **Check-in:**
   - Click "Check In" button
   - Geofence validation runs (mock: always succeeds)
   - Toast: "Checked in successfully"
   - In-visit screen appears

4. **In-visit tracking:**
   - Timer starts (e.g., "00:02:35")
   - Discussion checklist shows:
     - Car Sell Discussed
     - DCF Discussed
     - Payout Discussed
   - Can check off items
   - Notes field available
   - "Complete Visit" button at bottom

5. **Close app (simulate interruption):**
   - Close browser tab OR
   - Navigate away from visit page
   - Wait 10 seconds

6. **Resume visit:**
   - Reopen app / return to Visits > Today tab
   - Visit card should show:
     - Green background (in-progress indicator)
     - Elapsed time updated
     - "Resume Visit" button (NOT "Start Visit")
   - Click "Resume Visit"
   - Should return to in-visit screen
   - Timer continues from where it left off

7. **Complete visit:**
   - Click "Complete Visit"
   - Feedback form appears
   - Fill all required fields:
     - Meeting person: "Rajesh Gupta"
     - Car sell discussed: "Yes"
     - Outcome: "Agreed to Share"
     - Expected seller leads: 8
     - Expected inventory leads: 3
     - DCF discussed: "Yes"
     - DCF status: "Interested"
     - Issues: "Need more training on DCF"
     - Next actions: Check "Follow-up call"
   - Click "Submit Feedback"
   - Toast: "Visit completed successfully"
   - Visit card moves to "Completed" state

**Expected Results:**
- ✅ Must check in before completing
- ✅ Visit state persists across page refresh
- ✅ "Resume Visit" appears for in-progress visits in Today tab
- ✅ Timer continues from previous value
- ✅ Cannot complete without mandatory feedback

**Failure Scenarios:**
- ❌ If can complete visit without check-in → BUG
- ❌ If "Resume Visit" doesn't appear after interruption → BUG
- ❌ If timer resets to 00:00:00 on resume → BUG
- ❌ If visit disappears from Today tab after check-in → BUG

---

### Flow 3: Leads Routing - Multiple Entry Points

**User Story:** As a KAM, clicking a lead card from Leads section, Dealer section, or DCF section should open the same LeadDetailPageV2.

**Test Steps:**

1. **From Leads section:**
   - Navigate to "Leads" (bottom nav)
   - Click any lead card (e.g., "DL1CAC1234 - Maruti Swift")
   - LeadDetailPageV2 opens
   - Verify header shows: Back arrow, Reg No, Make/Model, Status badge
   - Verify sections: Customer info, KAM owner, Timeline, CEP
   - Click back arrow → Returns to Leads list

2. **From Dealer section:**
   - Navigate to "Dealers" (bottom nav)
   - Click dealer card "Daily Motoz"
   - Dealer360View opens
   - Click "Leads" tab
   - Click same lead "DL1CAC1234 - Maruti Swift"
   - LeadDetailPageV2 opens (same page as before)
   - Click back arrow → Returns to Dealer360View (NOT Leads list)

3. **From DCF section:**
   - Navigate to "DCF" (bottom nav)
   - Click "Leads" card
   - DCF Leads list opens
   - Click any DCF lead card
   - DCF Lead Detail opens
   - Verify it's a different page (DCFLeadDetailPage, not LeadDetailPageV2)
   - Back arrow → Returns to DCF Leads list

**Expected Results:**
- ✅ Lead cards from Leads section and Dealer section open LeadDetailPageV2
- ✅ Back navigation returns to original context
- ✅ DCF leads open DCFLeadDetailPage (separate page)
- ✅ No "Lead not found" errors

**Failure Scenarios:**
- ❌ If lead card opens blank page → BUG (check console for ID not found)
- ❌ If back arrow goes to wrong page → Navigation bug
- ❌ If DCF lead opens regular LeadDetailPageV2 → Wrong routing

---

### Flow 4: Dealer Detail - Activity Links to V/C Detail

**User Story:** As a KAM, clicking a call/visit entry in dealer detail should open the respective detail page with feedback.

**Test Steps:**

1. **Navigate to Dealer Detail:**
   - Go to "Dealers"
   - Click "Daily Motoz" (or any dealer with calls/visits)
   - DealerDetailPageV2 opens
   - Click "Activity" tab (or "Calls & Visits" tab)

2. **View activity list:**
   - Should show calls and visits mixed, sorted by date
   - Each item shows:
     - Type icon (phone for calls, map pin for visits)
     - Date/time
     - Duration
     - Outcome
     - Notes preview

3. **Click call entry:**
   - Click any call item
   - Should open CallFeedbackPage (or CallDetailPage)
   - Shows call details: Dealer, Date, Duration, Outcome
   - Shows feedback: Car Sell, DCF, Notes
   - Back arrow → Returns to Dealer Detail Activity tab

4. **Click visit entry:**
   - Click any visit item
   - Should open VisitFeedbackPage (or VisitDetailPage)
   - Shows visit details: Dealer, Date, Duration
   - Shows feedback: Meeting person, Car Sell, DCF, Issues, Next actions
   - Back arrow → Returns to Dealer Detail Activity tab

**Expected Results:**
- ✅ Call items open call detail/feedback page
- ✅ Visit items open visit detail/feedback page
- ✅ Back navigation returns to dealer detail
- ✅ All data loads correctly (no "not found" errors)

**Failure Scenarios:**
- ❌ If clicking activity item does nothing → Navigation not wired
- ❌ If opens wrong detail page → ID mismatch
- ❌ If "Call/Visit not found" error → Selector issue

---

### Flow 5: DCF Onboarding - State Machine

**User Story:** As a KAM, I can onboard a dealer to DCF by uploading documents and waiting for approval.

**Test Steps:**

1. **Find non-DCF dealer:**
   - Go to "Dealers"
   - Click dealer WITHOUT "DCF Onboarded" tag (e.g., create test dealer)
   - OR: Remove "DCF Onboarded" tag from dealer in mock data

2. **Open DCF tab:**
   - In DealerDetailPageV2, click "DCF" tab
   - Should show DCF Onboarding Flow in NOT_ONBOARDED state
   - Verify:
     - Info card: "DCF Not Onboarded"
     - Benefits list (4 items)
     - Document requirements preview
     - "Start DCF Onboarding" button (blue CTA)

3. **Initiate onboarding:**
   - Click "Start DCF Onboarding"
   - State changes to PENDING_DOCS
   - Document upload form appears
   - Shows 6 documents:
     - PAN Card (mandatory)
     - GST Certificate (mandatory)
     - Bank Statement (mandatory)
     - Dealer Agreement (mandatory)
     - Address Proof (mandatory)
     - Cancelled Cheque (optional)

4. **Upload documents:**
   - Click "Choose file" on PAN Card
   - Select any file (mock)
   - File name appears with green checkmark
   - Repeat for all 5 mandatory docs
   - Leave optional doc empty
   - Click "Submit Documents"
   - Toast: "Documents submitted successfully"

5. **Approval state:**
   - State changes to PENDING_APPROVAL
   - Shows:
     - Blue loading icon (animated pulse)
     - "Under Review" heading
     - Timeline: "2-3 business days"
     - "What happens next" info card

6. **Simulate rejection (manual state change in console):**
   ```javascript
   // In browser console
   // (This requires component state access - for demo purposes)
   // Normally would be server-driven
   ```
   - State changes to REJECTED
   - Shows:
     - Red alert banner
     - Rejection reason (mock: "PAN card image unclear")
     - "Resubmit Documents" button

7. **Resubmit:**
   - Click "Resubmit Documents"
   - Document upload form appears again
   - Re-upload documents
   - Submit → Back to PENDING_APPROVAL

8. **Simulate approval:**
   - State changes to APPROVED
   - DCF tab now shows normal DCF interface:
     - Loan filters
     - Summary card
     - Loans list

**Expected Results:**
- ✅ State machine flows: NOT_ONBOARDED → PENDING_DOCS → PENDING_APPROVAL → APPROVED
- ✅ Can resubmit after rejection
- ✅ Cannot access DCF loans until APPROVED
- ✅ Document validation (all mandatory required)

**Failure Scenarios:**
- ❌ If can submit without mandatory docs → Validation bug
- ❌ If state doesn't change after actions → State management issue
- ❌ If DCF loans visible in NOT_ONBOARDED state → Conditional rendering bug

---

## Role-Specific Testing

### KAM Role Test Script (10 minutes)

**Login as KAM:**

1. **Home Dashboard:**
   - [ ] Input Score card shows score (0-100) with 4 components
   - [ ] Quick actions: Log Visit, Log Call, Add Lead
   - [ ] Performance metrics: SIs, I2SI%, DCF Disbursals
   - [ ] Incentive calculator card (click → opens simulator)

2. **Dealers:**
   - [ ] List shows own dealers only
   - [ ] Filters work (Channel, Status, Lead Giving)
   - [ ] Dealer card shows: Name, Code, City, Last Visit, MTD performance
   - [ ] Quick actions: Call (tel: link), Route (Google Maps), Create Lead
   - [ ] Click dealer → Opens DealerDetailPageV2

3. **Leads:**
   - [ ] List shows own leads only
   - [ ] Filters work (Channel, Status, Lead Type)
   - [ ] Lead card shows: Reg No, Make/Model, Customer, Stage, CEP
   - [ ] Click lead → Opens LeadDetailPageV2

4. **Visits:**
   - [ ] Today tab shows upcoming visits
   - [ ] Can check in to visit (geofence validation)
   - [ ] In-visit screen shows timer, discussion checklist
   - [ ] Can complete with mandatory feedback

5. **DCF:**
   - [ ] DCF home shows 4 metric cards
   - [ ] Dealers list shows onboarded dealers
   - [ ] Leads list shows DCF loans
   - [ ] Disbursals list shows completed loans

### TL Role Test Script (10 minutes)

**Switch to TL Role:**

1. **Home Dashboard:**
   - [ ] Team overview card (not individual)
   - [ ] Team Input Score (avg of all KAMs)
   - [ ] KAM performance tiles with RAG flags
   - [ ] Time period filters work (D-1, L7D, MTD, Last Month)

2. **Dealers:**
   - [ ] List shows all team dealers (not just own)
   - [ ] KAM filter dropdown available
   - [ ] Filtering by KAM works

3. **Leads:**
   - [ ] List shows all team leads
   - [ ] KAM filter dropdown available

4. **Performance:**
   - [ ] Team metrics visible
   - [ ] KAM tiles clickable → KAM Detail Page

5. **Visits & Calls (Unified):**
   - [ ] Can review team visits/calls
   - [ ] Visit detail shows feedback
   - [ ] Call detail shows feedback
   - [ ] Can approve location updates

6. **DCF:**
   - [ ] Team-level metrics
   - [ ] KAM filter for drill-down

### Admin Role Test Script (5 minutes)

**Switch to Admin Role:**

1. **Admin Dashboard:**
   - [ ] Business KPIs visible (Stock-ins, Revenue, I2SI%, DCF)
   - [ ] Sparkline charts show trends
   - [ ] TL leaderboards visible
   - [ ] Regional panels collapsible

2. **TL Leaderboard:**
   - [ ] Color-coded bands (Green ≥90%, Amber ≥70%, Red <70%)
   - [ ] Sortable by columns
   - [ ] Click TL row → TL Detail Page

3. **TL Detail:**
   - [ ] Performance timeline chart
   - [ ] KAM list with filters
   - [ ] Targets vs actuals

4. **Targets Modal:**
   - [ ] Can edit targets inline
   - [ ] Validation works (positive integers only)
   - [ ] Save confirmation toast

5. **Export Modal:**
   - [ ] Date range picker works
   - [ ] Format selector (CSV, Excel, PDF)
   - [ ] Export button → Toast confirmation (mock download)

---

## Debug Playbook

### Common Issue 1: "Lead not found"

**Symptoms:**
- Clicking lead card opens blank page
- Console error: "Lead with ID xxx not found"

**Checklist:**

1. **Check ID normalization:**
   ```javascript
   // In browser console
   import { normalizeDealerId } from './data/mockDatabase';
   console.log(normalizeDealerId('DLR001')); // Should return canonical ID
   ```

2. **Verify lead exists in mock DB:**
   ```javascript
   import { LEADS } from './data/mockDatabase';
   console.log(LEADS.find(l => l.id === 'lead-ncr-001'));
   ```

3. **Check selector call:**
   ```javascript
   import { getLeadById } from './data/selectors';
   console.log(getLeadById('lead-ncr-001'));
   ```

4. **Verify navigation:**
   - Check if `onNavigateToLeadDetail` is passing correct ID
   - Check if ROUTES.LEAD_DETAIL has `:id` param

**Fix:**
- If ID mismatch → Normalize ID in selector call
- If lead doesn't exist → Add to LEADS array in mockDatabase.ts
- If navigation broken → Check ROUTES constant and navigate function

---

### Common Issue 2: "Visit not found" or "Cannot resume visit"

**Symptoms:**
- Visit disappears after check-in
- "Resume Visit" doesn't work
- Visit state not persisting

**Checklist:**

1. **Check visit state in localStorage:**
   ```javascript
   // In browser console
   console.log(localStorage.getItem('visitState'));
   ```

2. **Verify visit ID:**
   ```javascript
   import { getVisitById } from './data/selectors';
   console.log(getVisitById('visit-1670000000-001'));
   ```

3. **Check state update:**
   - Verify `visitEngine.ts` is updating status correctly
   - Check if `status` field is 'CHECKED_IN' after check-in

4. **Inspect component state:**
   - Use React DevTools
   - Find VisitCheckInPage or InVisitScreen
   - Check `visit.status` value

**Fix:**
- If localStorage empty → State not persisting (check save logic)
- If status not updating → visitEngine.ts bug
- If visit ID mismatch → Check ID generation in mock data

---

### Common Issue 3: "Feedback screen not opening"

**Symptoms:**
- Clicking "Complete Visit" or "Submit Call" does nothing
- Feedback page blank

**Checklist:**

1. **Check navigation route:**
   ```javascript
   import { ROUTES } from './navigation/routes';
   console.log(ROUTES.VISIT_FEEDBACK); // Should be /visits/:id/feedback
   ```

2. **Verify ID is passed:**
   - Check onNavigateToFeedback callback
   - Ensure visit/call ID is included

3. **Check component import:**
   - Verify VisitFeedbackPage or CallFeedbackPage exists
   - Check for import errors in console

**Fix:**
- If route wrong → Update ROUTES constant
- If ID missing → Add ID to navigation call
- If component missing → Create feedback page or check file path

---

### Common Issue 4: "Incentive showing ₹0 despite achievements"

**Symptoms:**
- Input Score ≥75
- Stock-ins ≥90% achievement
- But Total Incentive = ₹0

**Checklist:**

1. **Verify Input Score gate:**
   ```javascript
   import { calculateKAMIncentive } from './lib/incentiveEngine';
   const result = calculateKAMIncentive({
     inputScore: 78,
     stockIns: 124,
     stockInTarget: 150,
     dcfDisbursals: 18,
     i2si: 17.2,
   });
   console.log(result);
   ```

2. **Check Stock-in gate (≥90%):**
   ```javascript
   const siAchievement = 124 / 150; // 0.827 → 82.7%
   console.log(siAchievement >= 0.9); // Should be false
   ```

3. **Understand incentive logic:**
   - Input Score < 75 → ALL incentive = ₹0
   - Stock-ins < 90% achievement → Stock-in incentive = ₹0 (but DCF still counts)
   - I2SI ≤15% → No I2SI bonus

**Fix:**
- If Input Score < 75 → This is correct behavior (gate locked)
- If Stock-ins < 90% → Only DCF incentive should show (not bug)
- If calculation wrong → Check incentiveEngine.ts logic

---

### Common Issue 5: "Admin dashboard shows stale data"

**Symptoms:**
- TL leaderboard doesn't update after changes
- KPIs show old numbers

**Checklist:**

1. **Check if mock data updated:**
   ```javascript
   import { TEAM_LEADS } from './data/mockDatabase';
   console.log(TEAM_LEADS);
   ```

2. **Verify selectors called:**
   - Admin dashboard should call `getAllDealers()`, `getAllLeads()`, etc.
   - Check if selectors return latest data

3. **Check component re-render:**
   - Use React DevTools Profiler
   - Verify component re-renders after data change

**Fix:**
- If mock data not updated → Update TEAM_LEADS in mockDatabase.ts
- If selectors not re-called → Add dependency array to useEffect
- If component not re-rendering → Force re-render with key prop

---

## Known Issues

### Issue 1: Geolocation Permission on HTTPS Only

**Symptom:** Geofence check-in fails with "Geolocation not supported"

**Cause:** `navigator.geolocation` requires HTTPS (or localhost)

**Workaround:**
- Use localhost for development
- Mock geolocation in production:
  ```javascript
  if (!navigator.geolocation) {
    // Mock location
    return { latitude: 28.4595, longitude: 77.0266 };
  }
  ```

---

### Issue 2: File Upload Mock (No Actual Storage)

**Symptom:** Uploaded files (DCF docs, visit photos) disappear on refresh

**Cause:** No backend storage, only client-side File objects

**Workaround:**
- Use FileReader to convert to base64 and store in localStorage (max 5MB)
- Or: Show toast "Mock upload successful" without actual storage

---

### Issue 3: Date Filters Not Affecting Productivity

**Symptom:** Changing date range doesn't update productivity status

**Cause:** Productivity engine uses 7-day window from interaction date, not current date filter

**Expected Behavior:** This is correct - productivity is calculated relative to call/visit date, not filter

---

### Issue 4: Impersonation Banner Overlaps Content

**Symptom:** On small screens, impersonation banner covers top content

**Workaround:**
- Add padding-top to main content when banner visible
- Or: Make banner sticky at bottom instead of top

---

## Test Data Reference

### Mock KAMs

- **Amit Verma** (kam-ncr-01) - NCR region, TL: Priya Mehta
- **Sneha Kapoor** (kam-ncr-02) - NCR region, TL: Priya Mehta
- **Rajesh Singh** (kam-west-01) - West region, TL: Vikram Patel

### Mock Dealers

- **Daily Motoz** (DR080433) - Gurugram, KAM: Amit Verma, Status: Active, DCF: Onboarded
- **Gupta Auto World** (GGN-001) - Gurgaon, KAM: Amit Verma, Status: Active, DCF: Onboarded
- **Sharma Motors** (GGN-002) - Gurgaon, KAM: Sneha Kapoor, Status: Active, DCF: Onboarded

### Mock Leads

- **DL1CAC1234** - Maruti Swift 2020, Dealer: Daily Motoz, Channel: C2B, Stage: Stock-in
- **HR26DK5678** - Hyundai i20 2019, Dealer: Gupta Auto World, Channel: GS, Stage: Inspection

### Mock DCF Leads

- **DCF-LN-982341** (Green) - Rajesh Verma, Dealer: Gupta Auto World, Status: DISBURSED
- **DCF-LN-982780** (Amber) - Priya Sharma, Dealer: Sharma Motors, Status: APPROVAL PENDING
- **DCF-LN-983210** (Red) - Amit Kumar, Dealer: New City Autos, Status: PENDING (delayed)

---

**End of QA Runbook**

For detailed business logic, see `/docs/01_PRD.md`.  
For architecture details, see `/docs/02_TRD_ARCHITECTURE.md`.
