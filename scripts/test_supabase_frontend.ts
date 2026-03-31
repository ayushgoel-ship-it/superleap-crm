import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from('dealers_raw')
    .select('id, payload')
    .limit(1);

  if (error) throw error;
  console.log("✅ Connected. Sample row:", data?.[0]?.id);
}

main().catch((e) => {
  console.error("❌ Failed:", e.message ?? e);
  process.exit(1);
});
