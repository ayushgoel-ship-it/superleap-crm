import { createClient } from '@supabase/supabase-js';

import {
  DEALERS,
  CALLS,
  VISITS,
  LEADS,
  DCF_LEADS,
  LOCATION_REQUESTS,
  ORG,
} from '../src/data/mockDatabase';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function upsertRaw(table: string, rows: { id: string; payload: any }[]) {
  const batches = chunk(rows, 200);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i].map((r) => ({
      id: r.id,
      payload: r.payload,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);

    console.log(`✅ ${table}: batch ${i + 1}/${batches.length} upserted (${batch.length} rows)`);
  }
}

async function main() {
  console.log('Seeding raw tables from src/data/mockDatabase.ts ...');

  await upsertRaw('dealers_raw', DEALERS.map((d: any) => ({ id: d.id, payload: d })));
  await upsertRaw('calls_raw', CALLS.map((c: any) => ({ id: c.id, payload: c })));
  await upsertRaw('visits_raw', VISITS.map((v: any) => ({ id: v.id, payload: v })));
  await upsertRaw('leads_raw', LEADS.map((l: any) => ({ id: l.id, payload: l })));
  await upsertRaw('dcf_leads_raw', DCF_LEADS.map((x: any) => ({ id: x.id, payload: x })));

  // LOCATION_REQUESTS may not always have an "id" field; create one if missing
  await upsertRaw(
    'location_requests_raw',
    LOCATION_REQUESTS.map((r: any, idx: number) => ({
      id: r.id ?? `locreq-${idx + 1}`,
      payload: r,
    }))
  );

  // ORG singleton
  await upsertRaw('org_raw', [{ id: 'org-1', payload: ORG }]);

  const dealersCount = await supabase.from('dealers_raw').select('id', { count: 'exact', head: true });
  const leadsCount = await supabase.from('leads_raw').select('id', { count: 'exact', head: true });

  console.log('--- DONE ---');
  console.log('dealers_raw count:', dealersCount.count);
  console.log('leads_raw count:', leadsCount.count);
}

main().catch((e) => {
  console.error('❌ Seed failed:', e?.message ?? e);
  process.exit(1);
});