import { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCw, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner@2.0.3';
import { updateTarget, initializeMonth } from '@/data/mgmtRepo';

interface TargetRow {
  target_id: string;
  user_id: string;
  role: string;
  month: string;
  si_target: number;
  call_target: number;
  visit_target: number;
  i2si_target: number;
  input_score_gate: number;
  quality_score_gate: number;
  dcf_leads_target: number;
  dcf_onboarding_target: number;
  dcf_disbursals_target: number;
  dcf_gmv_target_lakhs: number;
  userName?: string;
  teamName?: string;
}

const CORE_FIELDS = [
  { key: 'si_target', label: 'SI' },
  { key: 'call_target', label: 'Calls' },
  { key: 'visit_target', label: 'Visits' },
  { key: 'i2si_target', label: 'I2SI %' },
  { key: 'input_score_gate', label: 'Input Gate' },
  { key: 'quality_score_gate', label: 'Quality Gate' },
];

const DCF_FIELDS = [
  { key: 'dcf_leads_target', label: 'DCF Leads' },
  { key: 'dcf_onboarding_target', label: 'DCF Onboardings' },
  { key: 'dcf_disbursals_target', label: 'DCF Disbursals' },
  { key: 'dcf_gmv_target_lakhs', label: 'DCF GMV (₹L)' },
];

export function AdminTargetsPage() {
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'core' | 'dcf'>('core');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editedCells, setEditedCells] = useState<Map<string, Record<string, number>>>(new Map());
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => { loadTargets(); }, [selectedMonth]);

  async function loadTargets() {
    setLoading(true);
    const { data: tData } = await supabase.from('targets').select('*').eq('month', selectedMonth);
    const { data: users } = await supabase.from('users').select('user_id, name, role, team_id');
    const { data: teams } = await supabase.from('teams').select('team_id, team_name');
    const teamMap = new Map((teams || []).map(t => [t.team_id, t.team_name]));
    const userMap = new Map((users || []).map(u => [u.user_id, { name: u.name, teamName: teamMap.get(u.team_id) || '' }]));

    const enriched = (tData || []).map(t => ({
      ...t,
      userName: userMap.get(t.user_id)?.name || 'Unknown',
      teamName: userMap.get(t.user_id)?.teamName || '',
    }));
    enriched.sort((a, b) => {
      if (a.role !== b.role) return a.role === 'TL' ? -1 : 1;
      return (a.userName || '').localeCompare(b.userName || '');
    });
    setTargets(enriched as TargetRow[]);
    setEditedCells(new Map());
    setLoading(false);
  }

  function handleCellEdit(targetId: string, field: string, value: number) {
    const existing = editedCells.get(targetId) || {};
    const updated = new Map(editedCells);
    updated.set(targetId, { ...existing, [field]: value });
    setEditedCells(updated);
  }

  function getCellValue(target: TargetRow, field: string): number {
    const edits = editedCells.get(target.target_id);
    if (edits && field in edits) return edits[field];
    return Number((target as any)[field]) || 0;
  }

  const hasUnsaved = editedCells.size > 0;

  async function saveAll() {
    setSaving(true);
    let okCount = 0;
    for (const [targetId, changes] of editedCells.entries()) {
      const r = await updateTarget(targetId, changes as any);
      if (r.error) { toast.error(`Save failed: ${r.error}`); setSaving(false); return; }
      okCount++;
    }
    toast.success(`Saved ${okCount} updates`);
    setSaving(false);
    loadTargets();
  }

  async function handleInitializeMonth() {
    setInitializing(true);
    const r = await initializeMonth(selectedMonth);
    setInitializing(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success(`Initialized ${r.data?.inserted || 0} targets for ${selectedMonth}`);
    loadTargets();
  }

  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return result;
  }, []);

  // Team rollups
  const rollups = useMemo(() => {
    const fields = tab === 'core' ? CORE_FIELDS : DCF_FIELDS;
    const teamGroups = new Map<string, TargetRow[]>();
    targets.filter(t => t.role === 'KAM').forEach(t => {
      const key = t.teamName || '—';
      if (!teamGroups.has(key)) teamGroups.set(key, []);
      teamGroups.get(key)!.push(t);
    });
    return Array.from(teamGroups.entries()).map(([team, rows]) => {
      const sums: Record<string, number> = {};
      fields.forEach(f => { sums[f.key] = rows.reduce((a, r) => a + getCellValue(r, f.key), 0); });
      return { team, kamCount: rows.length, sums };
    });
  }, [targets, editedCells, tab]);

  const fields = tab === 'core' ? CORE_FIELDS : DCF_FIELDS;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Targets Management</h2>
          <p className="text-sm text-slate-500 mt-1">{targets.length} target rows for {selectedMonth}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {targets.length === 0 && !loading && (
            <button onClick={handleInitializeMonth} disabled={initializing}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
              <Plus className="w-4 h-4" />{initializing ? 'Initializing...' : 'Initialize Month'}
            </button>
          )}
          <button onClick={loadTargets} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {hasUnsaved && (
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : `Save ${editedCells.size}`}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-200">
        {(['core', 'dcf'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t === 'core' ? 'Core (SI / Calls / Visits)' : 'DCF'}
          </button>
        ))}
      </div>

      {hasUnsaved && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          {editedCells.size} unsaved change(s).
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-500 sticky left-0 bg-slate-50">User</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Team</th>
              {fields.map(f => (
                <th key={f.key} className="text-center px-3 py-3 font-medium text-slate-500 min-w-[110px]">{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3 + fields.length} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : targets.length === 0 ? (
              <tr><td colSpan={3 + fields.length} className="px-4 py-8 text-center text-slate-400">No targets for {selectedMonth}. Click "Initialize Month".</td></tr>
            ) : targets.map(t => (
              <tr key={t.target_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-2 font-medium text-slate-900 sticky left-0 bg-white">{t.userName}</td>
                <td className="px-4 py-2 text-slate-600">{t.role}</td>
                <td className="px-4 py-2 text-slate-600">{t.teamName || '—'}</td>
                {fields.map(f => {
                  const val = getCellValue(t, f.key);
                  const isEdited = editedCells.get(t.target_id)?.[f.key] !== undefined;
                  return (
                    <td key={f.key} className="px-1 py-1 text-center">
                      <input type="number" value={val}
                        onChange={e => handleCellEdit(t.target_id, f.key, Number(e.target.value))}
                        className={`w-full px-2 py-1.5 text-center text-sm border rounded ${isEdited ? 'border-amber-400 bg-amber-50' : 'border-transparent hover:border-slate-200'} focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team rollups */}
      {rollups.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Team Rollups (sum of KAMs)</h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Team</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">KAMs</th>
                  {fields.map(f => <th key={f.key} className="text-center px-3 py-3 font-medium text-slate-500">{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rollups.map(r => (
                  <tr key={r.team} className="border-b border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{r.team}</td>
                    <td className="px-4 py-2 text-slate-600">{r.kamCount}</td>
                    {fields.map(f => <td key={f.key} className="px-3 py-2 text-center text-slate-700">{r.sums[f.key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
