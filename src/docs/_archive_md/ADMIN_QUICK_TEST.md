## ARCHIVED: Merged into /docs/03_QA_RUNBOOK.md and /docs/02_TRD_ARCHITECTURE.md
**Do not update this file. Update the canonical documentation in /docs/ instead.**

---

# 🧪 ADMIN REGION PANEL - 2 MINUTE QUICK TEST

**Date**: February 4, 2026  
**Purpose**: Fast validation that all Admin features work  

---

## ⚡ 30-SECOND BASIC TEST

### **Test 1: Admin Login → Admin Home**
```
1. Open app
2. Login: admin.ops@cars24.com / SuperLeap@123
3. ✅ CHECK: Lands on "Admin Home" page
4. ✅ CHECK: Bottom nav shows: [Home] [Dealers] [Leads] [V/C] [DCF]
5. ✅ CHECK: Top shows AdminScopeBar with Region selector
6. ✅ CHECK: Business Summary cards visible
```

**Expected Result:**
- Page title: "Admin Home"
- 5 tabs in bottom nav (NOT the KAM 5 tabs)
- Region selector shows "All Regions"
- Stock-ins card shows: 569/590 (96.4%)

---

## ⏱️ 2-MINUTE FULL TEST

### **Test 2: Region Filtering**
```
1. On Admin Home
2. Click "All Regions" dropdown
3. ✅ CHECK: See 4 regions (NCR, West, South, East)
4. Select "NCR" only
5. ✅ CHECK: Stock-ins updates to 165/180
6. ✅ CHECK: Chip appears: [NCR ×]
7. Select "West" also
8. ✅ CHECK: Chip appears: [NCR ×] [West ×]
9. ✅ CHECK: Label shows "2 Regions"
10. ✅ CHECK: Stock-ins shows 313/335 (NCR+West sum)
```

**Expected Result:**
- Region chips update live
- Metrics re-aggregate instantly
- TL Leaderboard filters to show only NCR+West TLs

---

### **Test 3: Bottom Nav Navigation**
```
1. Click "Dealers" tab
2. ✅ CHECK: Navigate to Admin Dealers page
3. ✅ CHECK: AdminBottomNav persists (Dealers tab blue)
4. ✅ CHECK: Region filter persists (NCR, West)
5. Click "Leads" tab
6. ✅ CHECK: Navigate to Admin Leads
7. Click "V/C" tab
8. ✅ CHECK: Navigate to Admin V/C
9. Click "DCF" tab
10. ✅ CHECK: Navigate to Admin DCF
11. Click "Home" tab
12. ✅ CHECK: Back to Admin Home
```

**Expected Result:**
- All 5 tabs navigate correctly
- AdminBottomNav stays visible
- Filters persist across pages

---

### **Test 4: Routing Guard (Critical)**
```
1. On Admin Home
2. Open drawer (☰)
3. Click "Home" menu item
4. ✅ CHECK: Stays on Admin Home (does NOT go to KAM home)
5. Open drawer again
6. Click "Dealers" menu item
7. ✅ CHECK: Goes to Admin Dealers (not KAM dealers)
```

**Expected Result:**
- Admin NEVER lands on KAM/TL pages
- Routing guard auto-redirects

---

### **Test 5: Impersonation Flow**
```
1. On Admin Home
2. Open drawer (☰)
3. Click "KAM" button (in View As section)
4. ✅ CHECK: Impersonation picker opens
5. Select Region: NCR
6. Select TL: Rajesh Kumar
7. Select KAM: Amit Verma
8. ✅ CHECK: Badge appears "Impersonating: Amit Verma (KAM)"
9. ✅ CHECK: Navigate to KAM home page
10. ✅ CHECK: Bottom nav switches to KAM nav (5 tabs different icons)
11. Click "Stop" in badge
12. ✅ CHECK: Back to Admin Home
13. ✅ CHECK: AdminBottomNav returns
14. ✅ CHECK: Badge disappears
```

**Expected Result:**
- Impersonation picker works
- Bottom nav switches between Admin/KAM
- Badge shows/hides correctly

---

### **Test 6: Demo Pages Still Work**
```
1. On Admin Home
2. Open drawer (☰)
3. Scroll to "DEMO FEATURES" section
4. Click "Location Update Demo"
5. ✅ CHECK: Demo page loads
6. ✅ CHECK: Bottom nav is NOT AdminBottomNav (shows KAM nav)
7. Go back to Admin Home
8. ✅ CHECK: AdminBottomNav returns
```

**Expected Result:**
- Demo pages accessible
- Demo pages don't break
- Bottom nav switches appropriately

---

## 🎯 PASS/FAIL CRITERIA

### **✅ PASS IF:**
- [ ] Admin lands on admin-home on login
- [ ] AdminBottomNav has 5 tabs (Home, Dealers, Leads, V/C, DCF)
- [ ] Region multi-select updates metrics
- [ ] All 5 admin pages navigate correctly
- [ ] Routing guard prevents Admin from accessing KAM pages
- [ ] Impersonation works (badge appears, bottom nav switches)
- [ ] Demo pages still accessible

### **❌ FAIL IF:**
- Admin lands on KAM home on login
- Bottom nav shows wrong tabs
- Region filter doesn't update metrics
- Routing guard doesn't redirect
- Impersonation breaks
- Demo pages inaccessible

---

## 🐛 TROUBLESHOOTING

### **Issue: Admin lands on KAM home**
**Fix:** Check `handleLoginSuccess` in App.tsx
```typescript
if (role === 'ADMIN') {
  setCurrentPage('admin-home'); // Must be admin-home, not 'home'
}
```

### **Issue: Bottom nav shows KAM tabs instead of Admin tabs**
**Fix:** Check conditional rendering in App.tsx
```typescript
{activeRole === 'Admin' && (currentPage === 'admin-home' || ...) ? (
  <AdminBottomNav ... />
) : (
  <BottomNav ... />
)}
```

### **Issue: Region filter doesn't update metrics**
**Fix:** Check `getAggregatedRegionMetrics` function
```typescript
const metrics = getAggregatedRegionMetrics(selectedRegions);
```

### **Issue: Routing guard not working**
**Fix:** Check useEffect in App.tsx
```typescript
useEffect(() => {
  if (activeRole === 'Admin') {
    // Redirect map...
  }
}, [activeRole, currentPage]);
```

---

## 📊 TEST RESULTS TEMPLATE

```
Date: _____________
Tester: _____________

[ ] Test 1: Admin Login → Admin Home
[ ] Test 2: Region Filtering
[ ] Test 3: Bottom Nav Navigation
[ ] Test 4: Routing Guard
[ ] Test 5: Impersonation Flow
[ ] Test 6: Demo Pages

Overall Result: PASS / FAIL

Notes:
_____________________________
_____________________________
_____________________________
```

---

## ✅ EXPECTED VALUES (Quick Reference)

### **All Regions (Default):**
- Stock-ins: 569 / 590 (96.4%)
- DCF Count: 156 / 146 (106.8%)
- DCF Value: ₹1,560L / ₹1,460L (106.8%)
- I2SI%: ~42.2%
- Input Score: ~85.0

### **NCR Only:**
- Stock-ins: 165 / 180 (91.7%)
- DCF Count: 52 / 45 (115.6%)
- DCF Value: ₹520L / ₹450L (115.6%)

### **West Only:**
- Stock-ins: 148 / 155 (95.5%)
- DCF Count: 41 / 38 (107.9%)
- DCF Value: ₹410L / ₹380L (107.9%)

### **South Only:**
- Stock-ins: 158 / 145 (109.0%)
- DCF Count: 39 / 35 (111.4%)
- DCF Value: ₹390L / ₹350L (111.4%)

### **East Only:**
- Stock-ins: 98 / 110 (89.1%)
- DCF Count: 24 / 28 (85.7%)
- DCF Value: ₹240L / ₹280L (85.7%)

### **NCR + West:**
- Stock-ins: 313 / 335 (93.4%)
- DCF Count: 93 / 83 (112.0%)
- DCF Value: ₹930L / ₹830L (112.0%)

---

**Status**: ✅ Ready for Testing  
**Time Required**: 2 minutes  
**Critical Tests**: 6  
**Pass Criteria**: All 6 tests pass
