import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { exportToCsv, downloadCsv, type ExportRequest } from '@/data/mgmtRepo';

// Field catalog per entity (canonical Supabase columns).
const ENTITY_FIELDS: Record<string, { fields: string[]; date_field?: string; defaults: string[] }> = {
  users: {
    fields: ['user_id', 'name', 'email', 'phone', 'role', 'team_id', 'region', 'city', 'active', 'must_reset_password', 'created_at', 'deactivated_at'],
    defaults: ['user_id', 'name', 'email', 'role', 'team_id', 'region', 'active'],
  },
  dealers: {
    fields: ['dealer_id', 'dealer_code', 'dealer_name', 'kam_id', 'tl_id', 'city', 'region', 'phone', 'status', 'created_at'],
    defaults: ['dealer_code', 'dealer_name', 'kam_id', 'city', 'region', 'status'],
  },
  leads: {
    fields: ['lead_id', 'dealer_code', 'kam_id', 'channel', 'stage', 'created_at', 'updated_at', 'lead_type', 'region'],
    date_field: 'created_at',
    defaults: ['lead_id', 'dealer_code', 'kam_id', 'channel', 'stage', 'created_at'],
  },
  calls: {
    fields: ['call_id', 'dealer_code', 'kam_id', 'tl_id', 'outcome', 'duration_seconds', 'is_productive', 'created_at'],
    date_field: 'created_at',
    defaults: ['call_id', 'dealer_code', 'kam_id', 'outcome', 'is_productive', 'created_at'],
  },
  visits: {
    fields: ['visit_id', 'dealer_code', 'kam_id', 'tl_id', 'is_productive', 'created_at', 'duration_minutes'],
    date_field: 'created_at',
    defaults: ['visit_id', 'dealer_code', 'kam_id', 'is_productive', 'created_at'],
  },
  dcf_leads: {
    fields: ['id', 'customer_name', 'dealer_code', 'kam_name', 'overall_status', 'current_funnel', 'loan_amount', 'created_at', 'last_updated_at'],
    date_field: 'created_at',
    defaults: ['id', 'customer_name', 'dealer_code', 'kam_name', 'overall_status', 'current_funnel', 'loan_amount'],
  },
  targets: {
    fields: ['target_id', 'user_id', 'role', 'month', 'si_target', 'call_target', 'visit_target', 'i2si_target', 'dcf_leads_target', 'dcf_onboarding_target', 'dcf_disbursals_target', 'dcf_gmv_target_lakhs'],
    defaults: ['user_id', 'role', 'month', 'si_target', 'dcf_leads_target', 'dcf_disbursals_target'],
  },
  audit_log: {
    fields: ['log_id', 'actor_id', 'action', 'entity_type', 'entity_id', 'change_summary', 'created_at'],
    date_field: 'created_at',
    defaults: ['actor_id', 'action', 'entity_type', 'change_summary', 'created_at'],
  },
};

const PRESETS: { id: string; name: string; description: string; req: ExportRequest }[] = [
  { id: 'p1', name: 'Active Users', description: 'All active KAMs and TLs', req: { entity: 'users', fields: ['user_id','name','email','role','team_id','region','active'], filters: { active: true } } },
  { id: 'p2', name: 'Current-Month Targets', description: 'All targets for current month', req: { entity: 'targets', fields: ['user_id','role','month','si_target','dcf_leads_target','dcf_disbursals_target','dcf_gmv_target_lakhs'], filters: { month: new Date().toISOString().slice(0, 7) } } },
  { id: 'p3', name: 'Unassigned Dealers', description: 'Dealers with no KAM', req: { entity: 'dealers', fields: ['dealer_code','dealer_name','city','region'], filters: { kam_id: null } } },
  { id: 'p4', name: 'DCF Disbursed Leads', description: 'All DCF leads with status DISBURSED', req: { entity: 'dcf_leads', fields: ['id','customer_name','dealer_code','kam_name','loan_amount','last_updated_at'], filters: { overall_status: 'DISBURSED' } } },
];

export function AdminReportsPage() {
  const [tab, setTab] = useState<'presets' | 'custom'>('presets');
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Reports & Exports</h2>
        <p className="text-sm text-slate-500 mt-1">All exports query Supabase directly. Every export is logged for audit.</p>
      </div>
      <div className="flex gap-2 border-b border-slate-200 mb-4">
        {(['presets', 'custom'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t === 'presets' ? 'Presets' : 'Custom Export Builder'}
          </button>
        ))}
      </div>
      {tab === 'presets' ? <PresetsTab /> : <CustomTab />}
    </div>
  );
}

function PresetsTab() {
  const [busy, setBusy] = useState<string | null>(null);
  async function run(p: typeof PRESETS[0]) {
    setBusy(p.id);
    const r = await exportToCsv(p.req);
    setBusy(null);
    if (r.error || !r.blob) { toast.error(r.error || 'Export failed'); return; }
    downloadCsv(r.blob, `${p.req.entity}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${r.rowCount} rows`);
  }
  return (
    <div className="grid grid-cols-2 gap-4">
      {PRESETS.map(p => (
        <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <p className="text-xs text-slate-500">{p.description}</p>
            </div>
          </div>
          <button onClick={() => run(p)} disabled={busy === p.id}
            className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {busy === p.id ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>
      ))}
    </div>
  );
}

function CustomTab() {
  const [entity, setEntity] = useState<string>('leads');
  const [fields, setFields] = useState<string[]>(ENTITY_FIELDS.leads.defaults);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filterKey, setFilterKey] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [busy, setBusy] = useState(false);

  function pickEntity(e: string) {
    setEntity(e);
    setFields(ENTITY_FIELDS[e].defaults);
  }

  function toggleField(f: string) {
    setFields(fields.includes(f) ? fields.filter(x => x !== f) : [...fields, f]);
  }

  async function run() {
    if (fields.length === 0) { toast.error('Pick at least one field'); return; }
    const filters: Record<string, any> = {};
    if (filterKey && filterVal) filters[filterKey] = filterVal;
    setBusy(true);
    const r = await exportToCsv({
      entity: entity as any, fields, filters,
      date_field: ENTITY_FIELDS[entity].date_field,
      from: from || undefined, to: to || undefined,
    });
    setBusy(false);
    if (r.error || !r.blob) { toast.error(r.error || 'Export failed'); return; }
    downloadCsv(r.blob, `${entity}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${r.rowCount} rows`);
  }

  const cfg = ENTITY_FIELDS[entity];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Entity</label>
        <select value={entity} onChange={e => pickEntity(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
          {Object.keys(ENTITY_FIELDS).map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 mb-2 block">Fields ({fields.length} selected)</label>
        <div className="flex flex-wrap gap-2">
          {cfg.fields.map(f => (
            <button key={f} onClick={() => toggleField(f)}
              className={`px-3 py-1 rounded-full text-xs ${fields.includes(f) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {cfg.date_field && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">From ({cfg.date_field})</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Filter field</label>
          <select value={filterKey} onChange={e => setFilterKey(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full">
            <option value="">— none —</option>
            {cfg.fields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Filter value (eq)</label>
          <input value={filterVal} onChange={e => setFilterVal(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full" />
        </div>
      </div>
      <button onClick={run} disabled={busy} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {busy ? 'Exporting...' : 'Run Export'}
      </button>
    </div>
  );
}
