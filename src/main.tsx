import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { loadRuntimeDB } from "@/data/runtimeDB";
import { setErrorReporter } from "@/lib/telemetry/errorReporter";
import { ENV } from "@/config/env";

// ── Optional Sentry wiring ───────────────────────────────────────────
// Activates only when (a) `@sentry/react` is installed and (b)
// VITE_SENTRY_DSN is set. Until then this is a zero-cost no-op — the
// dynamic import is skipped, so the SDK is never pulled into the bundle.
const SENTRY_DSN = (import.meta as any)?.env?.VITE_SENTRY_DSN as string | undefined;
if (SENTRY_DSN && (ENV.IS_PROD || ENV.IS_STAGING)) {
  // Hidden from TS + bundler via a string-indirection specifier; resolves
  // at runtime only if the SDK is installed in node_modules.
  const sentryModule = "@sentry/react";
  (new Function("m", "return import(m)") as (m: string) => Promise<any>)(sentryModule)
    .then((Sentry: any) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: ENV.MODE,
        release: ENV.APP_VERSION,
        tracesSampleRate: 0.1,
      });
      setErrorReporter({
        captureException: (err, ctx) => Sentry.captureException(err, { extra: ctx }),
      });
    })
    .catch(() => {
      // Sentry SDK not installed yet — reporter stays as logger-only fallback.
    });
}

console.log('[MAIN] main.tsx loaded');

function Boot() {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('[BOOT] Starting loadRuntimeDB...');
        await loadRuntimeDB();
        if (!cancelled) setReady(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <h2>Boot failed</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
        <p>Tip: If using Supabase mode, verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        Loading data…
      </div>
    );
  }

  return <App />;
}

createRoot(document.getElementById("root")!).render(<Boot />);