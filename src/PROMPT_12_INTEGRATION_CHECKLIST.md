# Prompt 12 — Integration Checklist

## ✅ Immediate Actions (Do First)

### 1. Wrap App in ErrorBoundary
```tsx
// In your main.tsx or App.tsx root
import { ErrorBoundary } from './components/system/ErrorBoundary';

<ErrorBoundary>
  <AuthProvider>
    <App />
  </AuthProvider>
</ErrorBoundary>
```

### 2. Test Environment Configuration
```tsx
// Add this temporarily to App.tsx to verify
import { ENV, getEnvironmentInfo } from './config/env';

console.log('Environment:', getEnvironmentInfo());
// Should show: mode: 'dev', useMockData: true, etc.
```

### 3. Update One Screen to Use API Layer
Pick the simplest screen (e.g., Dealers list) and refactor:

**Before**:
```tsx
import { getDealers } from './data/mockDatabase';
const dealers = getDealers();
```

**After**:
```tsx
import { fetchDealers } from './api/dealer.api';
import { LoadingSkeleton, ErrorState, EmptyState } from './components/system/LoadingStates';

const [dealers, setDealers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function load() {
    try {
      const res = await fetchDealers();
      if (res.success) setDealers(res.data);
      else setError(res.error.message);
    } catch (err) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);

if (loading) return <LoadingSkeleton count={5} />;
if (error) return <ErrorState onRetry={() => window.location.reload()} />;
if (dealers.length === 0) return <EmptyState title="No dealers" />;
```

---

## 📋 Gradual Migration (Do Over Time)

### Phase 1: Core Screens (Week 1)
- [ ] Dealers list page
- [ ] Leads list page
- [ ] KAM Home page
- [ ] TL Home page
- [ ] Admin Home page

### Phase 2: Detail Screens (Week 2)
- [ ] Dealer360View
- [ ] Lead360View
- [ ] Call detail page
- [ ] Visit detail page
- [ ] DCF pages

### Phase 3: Supporting Screens (Week 3)
- [ ] Productivity dashboard
- [ ] Incentive simulator
- [ ] Admin analytics
- [ ] Leaderboards
- [ ] Profile page

---

## 🔧 Platform Safety Migration

### Replace All tel: Links
**Find**:
```tsx
<a href={`tel:${phone}`}>Call</a>
<a href={"tel:" + phone}>Call</a>
```

**Replace with**:
```tsx
import { safeCallPhone } from './utils/platformSafety';

<Button onClick={() => safeCallPhone(phone)}>Call</Button>
```

### Replace All WhatsApp Links
**Find**:
```tsx
<a href={`https://wa.me/${phone}`}>WhatsApp</a>
```

**Replace with**:
```tsx
import { safeOpenWhatsApp } from './utils/platformSafety';

<Button onClick={() => safeOpenWhatsApp(phone, message)}>WhatsApp</Button>
```

### Replace All Geolocation Calls
**Find**:
```tsx
navigator.geolocation.getCurrentPosition(...)
```

**Replace with**:
```tsx
import { safeGetLocation } from './utils/platformSafety';

const position = await safeGetLocation();
if (!position) {
  // Handle denial gracefully
  return;
}
```

---

## 🧪 Testing Checklist

### Test Error Boundary
```tsx
// Add a test button that throws error
<Button onClick={() => { throw new Error('Test error') }}>
  Test Error Boundary
</Button>
```
Expected: Should show error fallback with error code

### Test Loading States
1. Open Dealers page
2. Should see skeleton loader briefly
3. Then see actual dealers

### Test Empty States
1. Filter dealers to show none
2. Should see "No dealers found" with icon and message

### Test Error States
1. Temporarily break API (change URL)
2. Should see "Failed to load" with retry button
3. Click retry → should reload

### Test Platform Safety
1. Click call button → should open dialer
2. Click WhatsApp button → should open WhatsApp
3. Click location → should request permission
4. Deny permission → should show friendly error (NOT crash)

---

## 🚀 Pre-Production Checklist

Before deploying to staging/prod:

### Environment Setup
- [ ] Set `VITE_ENV=staging` or `VITE_ENV=production`
- [ ] Verify `ENV.MODE` is correct
- [ ] Verify `USE_MOCK_DATA` is `false` in prod
- [ ] Update `API_BASE_URL` to real backend
- [ ] Test environment detection works

### Backend Integration
- [ ] Backend API endpoints are live
- [ ] API authentication works
- [ ] CORS configured correctly
- [ ] All endpoints tested in Postman
- [ ] Rate limiting configured
- [ ] Error responses follow ApiResponse format

### Error Tracking
- [ ] Sign up for Sentry or DataDog
- [ ] Add SDK to project
- [ ] Configure in ErrorBoundary
- [ ] Test error reporting works
- [ ] Set up alerts for critical errors

### Performance Monitoring
- [ ] Configure performance tracking
- [ ] Set up dashboards
- [ ] Define SLAs (e.g., page load < 3s)
- [ ] Test monitoring captures metrics

### Security
- [ ] Remove all console.logs in prod
- [ ] Hide dev-only features
- [ ] Test impersonation disabled in prod
- [ ] Test mock credentials hidden in prod
- [ ] Test stack traces hidden in prod

### Play Store Requirements
- [ ] Test on real Android device
- [ ] Test all permissions work
- [ ] Test back button behavior
- [ ] Test app doesn't crash on permission denial
- [ ] Test offline behavior
- [ ] Test with slow network (throttle)
- [ ] Screenshots for Play Store
- [ ] App description
- [ ] Privacy policy URL
- [ ] Contact email

---

## 🐛 Common Issues & Fixes

### Issue 1: "ENV is not defined"
**Fix**: Import ENV at top of file
```tsx
import { ENV } from './config/env';
```

### Issue 2: API calls fail in dev
**Fix**: Check `USE_MOCK_DATA` is `true` in dev
```typescript
console.log('Using mock data:', ENV.USE_MOCK_DATA);
// Should be true in dev
```

### Issue 3: Error boundary doesn't catch error
**Fix**: Make sure ErrorBoundary wraps the component that throws
```tsx
<ErrorBoundary>
  <ComponentThatThrows />
</ErrorBoundary>
```

### Issue 4: Loading state flashes too fast
**Fix**: Add minimum loading time
```tsx
const MIN_LOADING_MS = 500;
const start = Date.now();

// ... load data ...

const elapsed = Date.now() - start;
if (elapsed < MIN_LOADING_MS) {
  await new Promise(r => setTimeout(r, MIN_LOADING_MS - elapsed));
}
```

### Issue 5: Empty state shows before loading completes
**Fix**: Check loading state first
```tsx
if (loading) return <LoadingSkeleton />;  // Check FIRST
if (items.length === 0) return <EmptyState />;
```

### Issue 6: Location permission keeps asking
**Fix**: Save permission state
```tsx
const [permissionDenied, setPermissionDenied] = useState(false);

if (permissionDenied) {
  return <div>Please enable location in settings</div>;
}

const position = await safeGetLocation();
if (!position) {
  setPermissionDenied(true);
}
```

---

## 📊 Metrics to Track

After integration, monitor:

### Stability Metrics
- Error rate (< 1% target)
- Crash-free sessions (> 99.9% target)
- Error boundary triggers per day

### Performance Metrics
- Page load time (< 3s target)
- Time to interactive (< 5s target)
- API response time (< 1s target)
- Re-render count per component

### User Experience Metrics
- Permission denial rate
- Retry action usage
- Empty state views
- Error state views

### Business Metrics
- Active users
- Daily logins
- Calls logged per day
- Visits logged per day
- Leads created per day
- Productivity score average

---

## 🎯 Success Criteria

You've successfully integrated Prompt 12 when:

✅ All screens have loading states (no blank screens)
✅ All screens have empty states
✅ All screens have error states with retry
✅ Error boundary catches and displays errors
✅ No direct calls to mock database (all via API layer)
✅ Platform intents wrapped safely (no crashes)
✅ Location permission handled gracefully
✅ App runs with `USE_MOCK_DATA=false` (even if backend not ready)
✅ Environment config controls all behavior
✅ Dev features hidden in production

---

## 🚀 Next Steps After Prompt 12

Once integration is complete:

1. **Test thoroughly** in dev/staging
2. **Deploy to staging** first
3. **Run QA tests** on staging
4. **Fix any issues** found
5. **Deploy to production** when stable
6. **Monitor dashboards** closely
7. **Iterate based on** user feedback

Then you're ready for:
- **Prompt 13**: Real backend API contract
- **Prompt 14**: Offline-first sync strategy
- **Prompt 15**: Analytics & alerting
- **Prompt 16**: Security review

---

**Questions?** Check `/PROMPT_12_COMPLETE.md` for full documentation.
