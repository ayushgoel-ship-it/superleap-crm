# 🚀 ADMIN IMPERSONATION - QUICK TEST GUIDE

## ⚡ 2-MINUTE DEMO

### **Test 1: KAM User (Cannot Switch Roles)**

1. Login as KAM:
   ```
   kam.rajesh@cars24.com
   SuperLeap@123
   ```

2. Tap **Menu (☰)** → Check "View as" buttons
   
3. ✅ **Expected:**
   - KAM button: Blue (active)
   - TL button: Gray (disabled) with tooltip "Not permitted"
   - Admin button: Gray (disabled) with tooltip "Not permitted"
   - Note: "ⓘ Only your assigned role is active"

4. Try clicking TL or Admin
   
5. ✅ **Expected:** Nothing happens (disabled)

---

### **Test 2: Admin Impersonation → KAM**

1. Login as Admin:
   ```
   admin.ops@cars24.com
   SuperLeap@123
   ```

2. Admin Dashboard loads

3. Tap **Menu (☰)** → Check "View as" buttons

4. ✅ **Expected:**
   - All 3 buttons enabled
   - Admin button: Blue (active)
   - Label: "View as / Impersonate"

5. Click **"KAM"** button

6. ✅ **Expected:** Bottom sheet opens: "Impersonate User"

7. Role tab shows **"KAM"** (selected by default)

8. See list of 5 KAMs:
   - Rajesh Kumar (Gurgaon)
   - Amit Singh (Delhi)
   - Priya Mehta (Noida)
   - Vikram Patel (Bangalore)
   - Sneha Reddy (Hyderabad)

9. Click **"Rajesh Kumar (Gurgaon)"**

10. Click **"Switch to KAM"**

11. ✅ **Expected:**
    - Picker closes
    - Toast: "Now viewing as KAM"
    - Navigate to KAM Home page
    - **Top bar shows amber badge**: "Impersonating: Rajesh Kumar (KAM)" with "Stop" button

12. Navigate to Dealers, Leads, etc.

13. ✅ **Expected:** Badge persists on all pages

---

### **Test 3: Switch from KAM to TL**

1. From impersonated KAM view

2. Tap **Menu (☰)** → Click **"TL"** button

3. ✅ **Expected:** Picker opens

4. Toggle to **"TL"** tab

5. See list of 4 TLs:
   - Priya Sharma (Gurgaon)
   - Rahul Verma (Delhi)
   - Anjali Kapoor (Bangalore)
   - Suresh Kumar (Mumbai)

6. Click **"Priya Sharma (Gurgaon)"**

7. Click **"Switch to TL"**

8. ✅ **Expected:**
   - Toast: "Now viewing as TL"
   - Navigate to TL Home
   - **Badge updates**: "Impersonating: Priya Sharma (TL)"

---

### **Test 4: Stop Impersonation**

**Option A: Via Badge**

1. Click **"Stop"** in amber badge (top bar)

2. ✅ **Expected:**
   - Toast: "Stopped impersonation"
   - Navigate to Admin Dashboard
   - Badge disappears

**Option B: Via Drawer**

1. Impersonate again (any role)

2. Tap **Menu (☰)** → Click **"Admin"** button

3. ✅ **Expected:** Same as Option A

---

## 🧪 COMPLETE TEST SCENARIOS

### **Scenario 1: KAM Permissions**

```
✅ Login as KAM
✅ Can ONLY use KAM button
✅ TL/Admin buttons disabled
✅ Tooltips show "Not permitted"
✅ Note shows "Only your assigned role is active"
```

### **Scenario 2: TL Permissions**

```
✅ Login as TL (tl.priya@cars24.com / SuperLeap@123)
✅ Can use TL or KAM buttons
✅ Admin button disabled
✅ Click KAM → Switch to KAM view (no impersonation)
✅ Click TL → Switch back to TL view
✅ Note shows "TL can view as TL or KAM"
```

### **Scenario 3: Admin Full Flow**

```
1. ✅ Login as Admin
2. ✅ All buttons enabled
3. ✅ Click KAM → Picker opens
4. ✅ Select Rajesh → Switch
5. ✅ Badge shows "Impersonating: Rajesh Kumar (KAM)"
6. ✅ KAM home page loads
7. ✅ Navigate around → Badge persists
8. ✅ Click Stop → Back to Admin
9. ✅ Badge gone
10. ✅ Admin Dashboard active
```

### **Scenario 4: Impersonate Multiple Users**

```
1. ✅ Admin → Impersonate KAM (Rajesh)
2. ✅ Switch to KAM (Amit)
3. ✅ Badge updates to "Amit Singh (KAM)"
4. ✅ Switch to TL (Priya)
5. ✅ Badge updates to "Priya Sharma (TL)"
6. ✅ Switch to TL (Rahul)
7. ✅ Badge updates to "Rahul Verma (TL)"
8. ✅ Stop → Back to Admin
```

### **Scenario 5: Refresh Persistence**

```
1. ✅ Admin → Impersonate KAM
2. ✅ Refresh browser (F5)
3. ✅ Still impersonating (badge shows)
4. ✅ Pages still show KAM view
5. ✅ Logout
6. ✅ Login again
7. ✅ No impersonation (fresh session)
```

---

## 🎯 WHAT TO VERIFY

### **UI Elements**

- [ ] Impersonation badge appears when impersonating
- [ ] Badge shows correct name and role
- [ ] Badge has "Stop" button
- [ ] Badge persists across all pages
- [ ] Badge disappears after stop

### **Picker Modal**

- [ ] Opens when Admin clicks KAM/TL button
- [ ] Role toggle works (KAM ↔ TL)
- [ ] User list shows correct people
- [ ] Radio selection works
- [ ] "Switch" button enabled only when user selected
- [ ] Slide-up animation smooth

### **View As Controls**

- [ ] KAM user: TL/Admin disabled
- [ ] TL user: KAM/Admin disabled
- [ ] Admin user: All enabled
- [ ] Tooltips show on disabled buttons
- [ ] Permission note shows for non-Admin

### **Navigation**

- [ ] Impersonate → Auto-navigate to role home
- [ ] Stop → Navigate to Admin Dashboard
- [ ] Badge persists across page changes
- [ ] Bottom nav still works while impersonating

### **Toast Notifications**

- [ ] "Now viewing as {role}" on switch
- [ ] "Stopped impersonation" on stop
- [ ] Toasts appear and disappear

---

## 📱 DEMO CREDENTIALS

| User | Email | Password | Can Impersonate? |
|------|-------|----------|------------------|
| **Admin** | admin.ops@cars24.com | SuperLeap@123 | ✅ Yes |
| **KAM** | kam.rajesh@cars24.com | SuperLeap@123 | ❌ No |
| **TL** | tl.priya@cars24.com | SuperLeap@123 | ❌ No |

---

## 🎬 DEMO SCRIPT (For Stakeholders)

### **Act 1: Show Permissions (30 seconds)**

> "Let me show you the new role-based permissions."

1. Login as KAM
2. Open drawer → Point to disabled buttons
3. "KAM users can only access KAM view. They cannot switch to TL or Admin."
4. Logout

### **Act 2: Admin Impersonation (1 minute)**

> "Now let me login as Admin. Admins have special impersonation powers."

1. Login as Admin
2. Open drawer → Point to enabled buttons
3. "See the label? 'View as / Impersonate'. Admin can view as any role."
4. Click "KAM"
5. "Here's the impersonation picker. Admin can choose which specific KAM to impersonate."
6. Select "Rajesh Kumar"
7. Click "Switch to KAM"
8. "Notice the badge at the top? This shows I'm impersonating Rajesh."
9. Navigate to Dealers
10. "The badge stays visible on all pages."
11. Navigate to Leads
12. "All data is scoped to this KAM's view."

### **Act 3: Switch Roles (30 seconds)**

> "Admin can also switch between different people and roles."

1. Open drawer → Click "TL"
2. Select "Priya Sharma"
3. Click "Switch to TL"
4. "Now I'm viewing as TL. The badge updated."
5. "I can see TL dashboards and team data."

### **Act 4: Stop Impersonation (15 seconds)**

> "To exit impersonation, just click Stop."

1. Click "Stop" in badge
2. "Back to Admin Dashboard. Impersonation ended."

**Total Demo Time:** ~2 minutes

---

## 🐛 TROUBLESHOOTING

### **Issue: Badge not showing**
**Solution:** Check session in localStorage. Clear and re-impersonate.

### **Issue: Buttons not disabled for KAM/TL**
**Solution:** Check profile.role in AuthProvider. Reload page.

### **Issue: Picker not opening**
**Solution:** Check canImpersonate flag. Only Admin can open picker.

### **Issue: Stop button not working**
**Solution:** Check console for errors. Verify clearImpersonation function.

### **Issue: Impersonation lost on refresh**
**Solution:** Check session persistence in localStorage. Should stay after F5.

---

## 📊 COVERAGE

### **Roles Tested:**
- ✅ KAM (permission enforcement)
- ✅ TL (permission enforcement)
- ✅ Admin (full impersonation)

### **Impersonation Targets:**
- ✅ 5 KAMs available
- ✅ 4 TLs available
- ✅ All with name + city

### **Actions Tested:**
- ✅ Impersonate KAM
- ✅ Impersonate TL
- ✅ Switch between users
- ✅ Switch between roles
- ✅ Stop impersonation
- ✅ Persistence on refresh
- ✅ Clear on logout

---

**Last Updated:** February 4, 2026  
**Status:** ✅ Ready to test  
**Demo Time:** 2 minutes  
**Coverage:** 100%