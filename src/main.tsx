import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { loadRuntimeDB } from "@/data/runtimeDB";

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