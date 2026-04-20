# `control-room` Frontend Principles

**Date:** April 10, 2026  
**Purpose:** Authoritative D5 translation of `../pathfinder/control-room` frontend structure into implementation standards for the new CRM frontend  
**Status:** Phase 1 D5 complete

---

## Scope And Sources

- This document captures frontend shell and organization patterns to copy from `../pathfinder/control-room`, not a requirement to copy its exact state-management mix or route inventory.
- Primary sources inspected:
  - `../pathfinder/control-room/src/main.jsx`
  - `../pathfinder/control-room/src/App.jsx`
  - `../pathfinder/control-room/src/components/custom/ProtectedRoute/ProtectedRoute.jsx`
  - `../pathfinder/control-room/src/components/custom/AppLayout/AppLayout.jsx`
  - `../pathfinder/control-room/src/axios/axios.js`
  - `../pathfinder/control-room/src/services/auth.services.js`
  - `../pathfinder/control-room/src/services/common.services.js`
  - `../pathfinder/control-room/src/store/store.js`
  - `../pathfinder/control-room/src/store/slices/userSlice.js`
  - `../pathfinder/control-room/src/zustand/useUserStore.js`
  - `../pathfinder/control-room/src/zustand/useAppConfigStore.js`
  - `../pathfinder/control-room/src/zustand/useAppStore.ts`
  - representative page-local stores such as `pages/Leads/store/useLeadsStore.ts` and `pages/Orders/store/useOrdersStore.ts`
- D5 output is an implementation-standard reference for CRM tasks `F1`, `F2`, and `F3`, with supporting guidance for `F4` and `F5`.

## Route Shell Structure To Copy

### What `control-room` Does

Observed shell flow:

- `main.jsx`
  - wraps the app with Redux `Provider`
  - wraps persisted Redux state in `PersistGate`
- `App.jsx`
  - owns the router tree
  - defines `/login` as the public route
  - nests protected content behind `ProtectedRoute`
  - nests protected pages under `AppLayout`
  - lazy-loads most pages
- `ProtectedRoute`
  - checks for access token presence
  - runs bootstrap calls before protected pages render
  - redirects unauthenticated users to `/login`
  - redirects authenticated users to the first allowed route if current route is not accessible
- `AppLayout`
  - renders the nav shell
  - builds nav items from backend-provided menu data
  - renders nested content via `Outlet`

### CRM Standard

CRM should move to this target shell:

- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/app/ProtectedRoute.tsx`
- `src/app/AppLayout.tsx`

Implementation rule:

- `main.tsx` should only mount providers and the shell, not hydrate business data like `runtimeDB`.
- The route tree should be declarative and centralized.
- Public auth routes and protected business routes should be separated at the shell level.
- Layout chrome and bootstrap gating should not live inside the current giant page-switching `src/App.tsx`.

## Shared Axios Interceptor Pattern

### What `control-room` Does

`src/axios/axios.js` exposes `createAxiosInstance(baseURL, options)` and centralizes:

- bearer token injection from local storage
- default request headers such as user type, channel, and tenant
- global unauthorized handling through a response interceptor
- shared base behavior reused by service modules

Service modules then create domain-specific clients from config, for example:

- auth service client
- common/shared service clients
- page/domain service clients

### CRM Standard

CRM should adopt one shared HTTP module under:

- `src/lib/http/axios.ts`

Implementation rule:

- All API calls must go through a shared axios helper with request and response interceptors.
- Token injection, unauthorized handling, and cross-cutting headers must live there, not in page code.
- Domain service modules should sit under `src/services/*.services.ts` and use the shared client instead of calling `fetch` or Supabase directly.

Target service set:

- `auth.services.ts`
- `dashboard.services.ts`
- `dealers.services.ts`
- `leads.services.ts`
- `visits.services.ts`
- `calls.services.ts`
- `notifications.services.ts`
- `admin.services.ts`

## Login, Bootstrap, And Token Handling

### What `control-room` Does

Observed flow:

- `LoginPage`
  - handles SSO redirect/code exchange
  - stores `access_token`, `refresh_token`, optional `sessionId`, and active profile in local storage
  - redirects into the protected app after success
- `ProtectedRoute`
  - treats token presence as the entry check
  - bootstraps:
    - user details
    - roles
    - app config
    - states
    - nav menus
  - delays protected rendering until bootstrap completes

### CRM Standard

CRM should use the same high-level lifecycle:

1. login establishes session/tokens
2. protected route performs session bootstrap
3. app layout renders only after bootstrap state is available

Implementation rule:

- Session bootstrap belongs in protected-route flow and dedicated stores, not in `main.tsx` and not in scattered page effects.
- Store access token, refresh token, and normalized session metadata through a single auth storage abstraction.
- Treat nav/menu/config/profile/bootstrap data as explicit backend bootstrap concerns for `F3`, not implicit local data hydration.

## Page-First Feature Organization

### What `control-room` Does

Observed organization:

- top-level `pages/<Domain>/...` folders own the main UI surfaces
- page folders may include local:
  - `components`
  - `hooks`
  - `utils`
  - page-local stores
- shared backend access remains centralized in `src/services`
- shared shell pieces live outside page folders

### CRM Standard

CRM should adopt page-first organization for the new shell:

- `src/pages/Login`
- `src/pages/Dashboard`
- `src/pages/Dealers`
- `src/pages/Leads`
- `src/pages/Visits`
- `src/pages/Calls`
- `src/pages/Notifications`
- `src/pages/Admin`

Implementation rule:

- Page-owned UI and logic should move near the page boundary.
- Shared primitives, shell components, and reusable UI stay in shared folders.
- Business data access remains in service modules, not inside page folders.

## Store Placement And Protected-Route Bootstrap

### What `control-room` Does

Observed state model:

- Redux is used for a small persisted global slice
- Zustand is used for:
  - user bootstrap state
  - app config/state lookup
  - page-scoped list/filter/pagination stores
- local storage is also used directly for:
  - tokens
  - active profile
  - navs

Observed bootstrap boundary:

- `ProtectedRoute` triggers user/app/nav bootstrap before protected routes render

### CRM Standard

CRM should keep the protected-route bootstrap idea, but simplify the store model.

Global stores should live under:

- `src/stores/useAuthStore.ts`
- `src/stores/useBootstrapStore.ts`
- `src/stores/useUiStore.ts`

Page-local stores may live inside page folders only when state is not shared across the app.

Implementation rule:

- Cross-app auth/bootstrap/UI state should not be split arbitrarily across Redux, Zustand, and direct local storage access.
- Prefer one primary store approach for app state, with local storage hidden behind storage helpers rather than read directly in many components.
- Protected-route bootstrap should load session-backed data and then hand off rendering to nested routes/layout.

## What To Copy Vs What To Improve

### Copy

- route shell split between public login, protected route, and app layout
- lazy-loaded pages in the router shell
- centralized axios instance factory with interceptors
- domain-oriented service modules
- page-first folder layout
- protected-route bootstrap as the default authenticated app entry pattern

### Improve

- use typed TS-first route and service definitions in CRM
- avoid a single oversized `App.tsx`; move route definitions into dedicated app-shell files
- use explicit auth/bootstrap stores instead of mixing bootstrap concerns into route components and local storage reads
- use a cleaner nav state model than “fetch navs and store raw JSON in local storage”

### Do Not Copy Blindly

- mixed Redux + Zustand + direct local storage pattern unless there is a clear reason
- direct token/profile/nav reads from local storage across shell components
- unauthorized handling that only hard-redirects without giving the auth store a chance to clear state intentionally
- backend menu/nav contracts becoming ad hoc shell state instead of part of a documented bootstrap contract

## CRM Adaptation Against Current State

Current CRM reality:

- `src/main.tsx` still boots by loading `runtimeDB`
- `src/App.tsx` is a large page-switching container
- many screens still depend on `runtimeDB`, selectors, and local state instead of a route shell plus API-backed services

D5 guidance for CRM:

- `F1` should replace the current `App.tsx` navigation approach with a real app shell and route tree
- `F2` should introduce a shared axios client and move API communication into service modules
- `F3` should build auth/session/bootstrap stores and stop relying on frontend data hydration as app startup
- `F4` and `F5` should then swap out `runtimeDB` reads and direct write paths behind that shell

Implementation rule:

- `control-room` is the shell reference, not the data model or business feature reference.
- CRM should copy shell structure and organization patterns while explicitly improving type safety, state ownership, and storage discipline.

## D5 Coverage Checklist

| D5 Requirement | Covered In |
| --- | --- |
| Record route shell structure | Route Shell Structure section |
| Record shared axios interceptor pattern | Shared Axios Interceptor Pattern section |
| Record login/bootstrap flow and token handling | Login, Bootstrap, And Token Handling section |
| Record page-first feature organization | Page-First Feature Organization section |
| Record store placement and bootstrap-on-protected-route pattern | Store Placement And Protected-Route Bootstrap section |
| Note which patterns to copy and which to improve | What To Copy Vs What To Improve section |

## Assumptions

- CRM should copy `control-room` shell patterns, not its exact state-management stack.
- The new CRM shell should be route-based and backend-bootstrap-driven, even if some legacy page internals are migrated incrementally.
- Page-local stores are acceptable only when they do not become another global state layer by accident.
