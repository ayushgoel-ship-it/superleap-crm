# Google SSO setup

This app supports Google sign-in via Supabase Auth. The code is wired
end-to-end, but the OAuth provider has to be configured in two places that
live outside the repo: Google Cloud Console and the Supabase dashboard.

## 1. Google Cloud Console

1. Go to https://console.cloud.google.com/ → APIs & Services → Credentials.
2. Pick (or create) the `cars24` Google Cloud project that will own this
   OAuth client.
3. **OAuth consent screen**
   - User type: **Internal** (restricts to the cars24.com Workspace).
   - App name: `SuperLeap CRM`.
   - Authorized domains: `cars24.com`, `supabase.co`.
4. **Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**.
   - Name: `SuperLeap CRM (Supabase)`.
   - Authorized JavaScript origins:
     - `http://localhost:5173` (Vite dev)
     - `https://<your-staging-domain>`
     - `https://<your-prod-domain>`
   - Authorized redirect URIs:
     - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**.

## 2. Supabase dashboard

1. Open your Supabase project → **Authentication → Providers → Google**.
2. Toggle **Enable**, paste the Client ID and Client Secret from step 1.
3. **Authentication → URL Configuration**
   - Site URL: your prod web URL (e.g. `https://crm.cars24.com`).
   - Redirect URLs: add every origin you'll launch SSO from
     (`http://localhost:5173`, staging, prod).

## 3. App-side enforcement (already in code)

- `signInWithGoogle()` passes `hd=cars24.com` so Google only offers cars24
  Workspace accounts.
- After the redirect, `hydrateSessionFromSupabase()` re-checks the email
  domain against `ALLOWED_SSO_DOMAINS` in `src/lib/auth/authService.ts` —
  any off-domain login is signed out immediately.
- The CRM still requires a row in the `users` table (`user_id` = Supabase
  user id). Admin must pre-provision the user; first-time SSO without a
  matching row will fail with a clear message.

## 4. Quick test checklist

- [ ] Click **Continue with Google** on the login page.
- [ ] Google offers only `@cars24.com` accounts (because of `hd`).
- [ ] After consent, browser lands back on the app and you're logged in.
- [ ] A `@gmail.com` account (if you bypass `hd`) is signed out with the
      "domain not allowed" toast.
- [ ] A `@cars24.com` user with no row in `public.users` is signed out with
      "not provisioned" toast.

## 5. Adding more allowed domains

Edit `ALLOWED_SSO_DOMAINS` in `src/lib/auth/authService.ts`. Keep this list
narrow — every domain added is a new auth boundary.
