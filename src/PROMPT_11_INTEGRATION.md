# Prompt 11 — Integration Guide

## Quick Integration Steps

### 1. Update App.tsx (Required)

Add the impersonation banner at the root:

```tsx
import { ImpersonationBanner, ImpersonationBannerSpacer } from './components/auth/ImpersonationBanner';
import { AuthProvider } from './auth/authContext';

function App() {
  return (
    <AuthProvider>
      {/* Add impersonation banner */}
      <ImpersonationBanner />
      <ImpersonationBannerSpacer />
      
      {/* Rest of your app */}
      <YourAppContent />
    </AuthProvider>
  );
}
```

### 2. Add Impersonation Panel to Admin Home (Required)

```tsx
import { ImpersonationPanel } from './components/auth/ImpersonationPanel';

function AdminHomePage() {
  return (
    <div>
      {/* Add at top of admin home */}
      <div className="mb-6">
        <ImpersonationPanel />
      </div>
      
      {/* Rest of admin dashboard */}
      <YourAdminContent />
    </div>
  );
}
```

### 3. Add Audit Log Route (Optional but Recommended)

```tsx
import { AuditLogViewer } from './components/auth/AuditLogViewer';

// In your router:
<Route path="/admin/audit-log" element={<AuditLogViewer />} />
```

### 4. Replace Permission Checks (Gradually)

**Find all instances of**:
```tsx
if (profile?.role === 'ADMIN') { ... }
if (userRole === 'TL') { ... }
```

**Replace with**:
```tsx
import { canPerformAction } from './auth/permissions';
import { useAuth } from './auth/authContext';

const { authRole, activeRole } = useAuth();
if (canPerformAction(authRole, activeRole, 'VIEW_ADMIN_SUMMARY')) { ... }
```

### 5. Add Route Guards (Critical)

Protect admin routes:

```tsx
import { AdminRoute, TLRoute, KAMRoute } from './components/auth/RouteGuard';

// Admin routes
<Route path="/admin/*" element={
  <AdminRoute>
    <AdminLayout />
  </AdminRoute>
} />

// TL routes
<Route path="/tl/*" element={
  <TLRoute>
    <TLLayout />
  </TLRoute>
} />

// KAM routes
<Route path="/kam/*" element={
  <KAMRoute>
    <KAMLayout />
  </KAMRoute>
} />
```

---

## Testing Checklist

After integration, test these scenarios:

### ✅ Admin Tests
- [ ] Admin can log in
- [ ] Admin sees impersonation panel on home page
- [ ] Admin can select TL and start impersonation
- [ ] Banner appears when impersonating
- [ ] Admin sees TL home page when impersonating as TL
- [ ] Admin can exit impersonation via banner
- [ ] Admin returns to admin home after exit
- [ ] Admin can view audit log
- [ ] Admin sees impersonation events in audit log

### ✅ TL Tests
- [ ] TL can log in
- [ ] TL does NOT see impersonation panel
- [ ] TL cannot access `/admin/*` routes (redirected)
- [ ] TL can approve location changes
- [ ] TL can view team visit coverage

### ✅ KAM Tests
- [ ] KAM can log in
- [ ] KAM cannot access `/admin/*` routes (redirected)
- [ ] KAM cannot access `/tl/*` routes (redirected)
- [ ] KAM can request dealer location updates
- [ ] KAM cannot approve location changes

### ✅ Audit Log Tests
- [ ] Login events are logged
- [ ] Logout events are logged
- [ ] Impersonation start events are logged
- [ ] Impersonation exit events are logged
- [ ] Route blocked events are logged
- [ ] Audit log can be exported to CSV
- [ ] Audit log shows correct timestamps

---

## Common Issues & Fixes

### Issue 1: Banner Not Showing

**Symptom**: Admin impersonates but banner doesn't appear

**Fix**: Make sure `<ImpersonationBanner />` is at the root level of your app, not inside a route

```tsx
// ❌ Wrong
<Routes>
  <Route path="*" element={<ImpersonationBanner />} />
</Routes>

// ✅ Correct
<ImpersonationBanner />
<Routes>
  ...
</Routes>
```

### Issue 2: Permission Denied Even for Admin

**Symptom**: Admin gets "permission denied" errors

**Fix**: Check that you're using `authRole` for permission checks, not `activeRole`

```tsx
// ❌ Wrong - uses activeRole (will fail when impersonating)
if (canPerformAction(activeRole, activeRole, 'IMPERSONATE')) { ... }

// ✅ Correct - uses authRole for real role check
if (canPerformAction(authRole, activeRole, 'IMPERSONATE')) { ... }
```

### Issue 3: Stale Admin Page After Impersonation

**Symptom**: Admin sees old admin page after exiting impersonation

**Fix**: Make sure navigation reset is happening in App.tsx:

```tsx
useEffect(() => {
  if (isImpersonating) {
    // Redirect to active role's home
    navigate(getDefaultRoute(activeRole!));
  } else if (authRole === 'ADMIN') {
    // Return to admin home
    navigate('/admin/home');
  }
}, [isImpersonating, activeRole, authRole]);
```

### Issue 4: Audit Log Not Persisting

**Symptom**: Audit events disappear on refresh

**Fix**: Audit log uses localStorage. Check browser console for quota errors:

```typescript
// In browser console:
localStorage.getItem('superleap_audit_log');

// Should return JSON string with events
```

---

## Quick Demo Script

**For showcasing Prompt 11 to stakeholders**:

1. **Login as Admin**
   - Email: `admin@cars24.com`
   - Password: `password123`

2. **Show Admin Home**
   - Point out: "This is the admin dashboard"
   - Point out: "See the impersonation panel here"

3. **Start Impersonation**
   - Select: "Team Lead"
   - Choose: "Rajesh Kumar (NCR)"
   - Click: "Start Impersonation"
   - Point out: "See the amber banner at top?"
   - Point out: "Now I'm seeing what Rajesh sees"

4. **Navigate Around**
   - Open dealers page
   - Open visits page
   - Point out: "All pages show the banner"
   - Point out: "I can see Rajesh's data"

5. **Exit Impersonation**
   - Click: "Exit Impersonation" in banner
   - Point out: "Back to admin view instantly"

6. **Show Audit Log**
   - Navigate to: `/admin/audit-log`
   - Point out: "See the impersonation events logged"
   - Point out: "Start time, end time, duration"
   - Click: "Export CSV" to download

7. **Show Permission Blocking**
   - Logout
   - Login as KAM (amit.verma@cars24.com / password123)
   - Try to access: `/admin/home` (via URL)
   - Point out: "Redirected to KAM home"
   - Point out: "Toast error: 'Access denied'"

---

## Production Deployment Notes

### Before Going Live:

1. **Update localStorage keys** to use your production prefix:
   ```typescript
   const LS_IMPERSONATION_KEY = 'prod_superleap_impersonation';
   const LS_AUDIT_LOG_KEY = 'prod_superleap_audit_log';
   ```

2. **Add backend audit logging**:
   ```typescript
   // In logAuditEvent():
   if (process.env.NODE_ENV === 'production') {
     await fetch('/api/audit-log', {
       method: 'POST',
       body: JSON.stringify(event)
     });
   }
   ```

3. **Add permission validation on backend**:
   ```typescript
   // Every API call should check:
   const canAccess = await validatePermission(
     req.user.authRole,
     req.user.activeRole,
     req.action
   );
   if (!canAccess) {
     throw new ForbiddenError();
   }
   ```

4. **Add rate limiting**:
   - Max 10 impersonations per hour per admin
   - Max 100 audit log exports per day
   - Max 1000 permission checks per minute

5. **Enable real-time notifications**:
   - Send email when admin impersonates
   - Send Slack notification for failed permission checks
   - Alert security team for suspicious activity

---

## Next Steps

After completing Prompt 11 integration:

1. ✅ Test all acceptance criteria
2. ✅ Update existing permission checks
3. ✅ Add route guards to all routes
4. ✅ Test with real users
5. ✅ Review audit logs
6. → **Ready for Prompt 12: Play Store Readiness**

---

**Questions?** Check `/PROMPT_11_COMPLETE.md` for full documentation.
