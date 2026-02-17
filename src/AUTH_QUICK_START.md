# 🚀 AUTH MODULE - QUICK START GUIDE

## ⚡ FASTEST WAY TO TEST

### **Option 1: Complete Profile User (Recommended)**

1. **Open app** → Login page appears
2. Click **"Demo Credentials"** dropdown
3. Click **"Rajesh Kumar"** card (auto-fills)
4. Click **"Sign in"**
5. ✅ **You're in!** → Home page

**Credentials auto-filled:**
- Email: `kam.rajesh@cars24.com`
- Password: `SuperLeap@123`

---

### **Option 2: New User Experience**

1. **Open app** → Login page
2. Click "Demo Credentials"
3. Click **"New KAM"** card (bottom, shows ⚠ warning)
4. Click "Sign in"
5. → **Profile Complete Page** appears
6. Fill:
   - Name: "Your Name"
   - Phone: "+919876543210"
   - Click "Use my location" (optional)
7. Click **"Save & Continue"**
8. ✅ **You're in!** → Home page

---

## 🎯 KEY FEATURES TO TEST

### **1. Profile Management** (30 seconds)

1. Tap **Menu (☰)** icon (top-left)
2. Tap **user profile card** (shows "View Profile →")
3. Try:
   - ✅ Upload photo (tap camera icon)
   - ✅ Edit name/phone (tap "Edit Profile")
   - ✅ Click "Use location" button

### **2. Change Password** (30 seconds)

1. From Profile page
2. Tap **"Change Password"**
3. Fill:
   - Current: `SuperLeap@123`
   - New: `NewPassword123`
   - Confirm: `NewPassword123`
4. Tap **"Update"**
5. ✅ Success toast appears

### **3. Forgot Password** (1 minute)

1. From Login page, tap **"Forgot password?"**
2. Enter: `kam.rajesh@cars24.com`
3. Tap **"Send OTP"**
4. See OTP displayed: **123456**
5. Enter OTP: `123456`
6. New password: `Test@123`
7. Confirm: `Test@123`
8. Tap **"Reset Password"**
9. ✅ Returns to login

### **4. Logout** (10 seconds)

1. Menu → Profile
2. Scroll down
3. Tap **"Logout"** (red button)
4. Confirm
5. ✅ Returns to Login page

---

## 📱 DEMO CREDENTIALS (COPY-PASTE)

**KAM (Complete Profile):**
```
kam.rajesh@cars24.com
SuperLeap@123
```

**TL (Complete Profile):**
```
tl.priya@cars24.com
SuperLeap@123
```

**Admin (Complete Profile):**
```
admin.ops@cars24.com
SuperLeap@123
```

**New User (Incomplete Profile):**
```
kam.new@cars24.com
SuperLeap@123
```

**Forgot Password OTP:** `123456`

---

## ✅ WHAT TO VERIFY

### **Login Flow:**
- [ ] Login page loads first
- [ ] Demo credentials section works
- [ ] Invalid credentials show error
- [ ] Valid login goes to home
- [ ] Loading spinner shows

### **Profile Complete:**
- [ ] New user forced to complete profile
- [ ] Name + phone required
- [ ] "Use location" button works
- [ ] Shows lat/lng coordinates
- [ ] Save navigates to home

### **Profile Management:**
- [ ] Clickable from menu
- [ ] Shows real user data
- [ ] Photo upload works
- [ ] Edit mode toggles
- [ ] Changes persist after refresh

### **Auth Guards:**
- [ ] Cannot access home while logged out
- [ ] Cannot skip profile completion
- [ ] Logout returns to login

### **Toast Notifications:**
- [ ] Login success
- [ ] Profile saved
- [ ] Password changed
- [ ] Logout success
- [ ] All errors

---

## 🐛 TROUBLESHOOTING

### **Issue: Stuck on login page after entering credentials**
**Solution:** Check browser console for errors. Clear localStorage and refresh.

### **Issue: Profile shows "undefined" or empty**
**Solution:** Logout and login again. Auth provider may not have loaded.

### **Issue: Photo upload doesn't show**
**Solution:** Make sure file is an image (JPG/PNG). Check file size < 5MB.

### **Issue: Location button does nothing**
**Solution:** Wait 1.5 seconds for mock GPS delay. Should show coordinates.

### **Issue: OTP says "expired"**
**Solution:** OTP expires in 5 minutes. Request new OTP.

### **Issue: Can't change password**
**Solution:** Make sure current password is correct: `SuperLeap@123`

---

## 🎬 COMPLETE TEST SCENARIO (5 minutes)

```
1. Open app
   ✅ See Login page

2. Click "Demo Credentials"
   ✅ See 4 users

3. Click "New KAM"
   ✅ Email + password filled

4. Click "Sign in"
   ✅ Profile Complete page appears

5. Fill profile:
   - Name: "Test User"
   - Phone: "+919876543210"
   - Click "Use location"
   ✅ Address + coordinates filled

6. Click "Save & Continue"
   ✅ Home page appears

7. Tap Menu (☰)
   ✅ Drawer opens

8. Tap user profile card
   ✅ Profile page opens

9. Tap camera icon
   - Select a photo
   ✅ Photo preview shows

10. Tap "Edit Profile"
    - Change name to "Updated Name"
    - Tap "Save"
    ✅ Success toast + changes saved

11. Tap "Change Password"
    - Current: SuperLeap@123
    - New: NewPass@123
    - Confirm: NewPass@123
    - Tap "Update"
    ✅ Success toast

12. Tap "Logout"
    - Confirm
    ✅ Back to Login

13. Try login with NEW password:
    - kam.new@cars24.com
    - NewPass@123
    ✅ Login success

14. On Login page, tap "Forgot password?"
    - Enter: kam.rajesh@cars24.com
    - Tap "Send OTP"
    ✅ OTP shown: 123456

15. Enter OTP + new password
    - Tap "Reset Password"
    ✅ Back to Login + success toast

COMPLETE! ✅
```

---

## 📊 KEY METRICS

- **Total Auth Files:** 11 new files
- **Lines of Code:** ~2,000+ lines
- **Seed Users:** 4
- **Auth Routes:** 4
- **Protected Routes:** All existing routes
- **Toast Notifications:** 15+
- **Validation Rules:** 10+
- **Mock Data:** localStorage-based

---

## 🔗 RELATED DOCS

- Full integration guide: `/AUTH_INTEGRATION_COMPLETE.md`
- DCF Lead Detail: `/DCF_LEAD_DETAIL_TEST_GUIDE.md`
- Project handoff: `/PROJECT_HANDOFF_CHATGPT.md`

---

**Need Help?** Check the console for errors or clear localStorage and retry.

**Last Updated:** February 4, 2026  
**Status:** ✅ Ready to test
