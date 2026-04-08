import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Users, User, Store, Search, Upload, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner@2.0.3';
import { reassignDealers, updateUser, bulkUpload, type ReassignImpact } from '@/data/mgmtRepo';

interface UserLite { user_id: string; name: string; role: string; team_id: string | null; active: boolean; }
interface Team { team_id: string; team_name: string; tl_user_id: string; region: string; }
interface Dealer { id: string; dealer_code: string; dealer_name: string; kam_id: string | null; tl_id: string | null; dealer_city: string; dealer_region: string; }

export function AdminHierarchyPage() {
  const [tab, setTab] = useState<'tree' | 'kam_tl' | 'dealer_kam'>('tree');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Hierarchy & Mapping</h2>
        <p className="text-sm text-slate-500 mt-1">Manage TL teams, KAM assignments, and dealer ownership</p>
      </div>
      <div className="flex gap-2 border-b border-slate-200 mb-4">
        {[
          { k: 'tree', l: 'Org Tree' },
          { k: 'kam_tl', l: 'KAM ↔ TL' },
          { k: 'dealer_kam', l: 'Dealer ↔ KAM' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.k ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'tree' && <OrgTreeTab />}
      {tab === 'kam_tl' && <KamTlTab />}
      {tab === 'dealer_kam' && <DealerKamTab />}
    </div>
  );
}

// ── TAB 1: Read-only org tree ──
function OrgTreeTab() {
  const [users, setUsers] = useState<UserLite[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => { (async () => {
    const [u, t, d] = await Promise.all([
      supabase.from('users').select('user_id, name, role, team_id, active').eq('active', true),
      supabase.from('teams').select('*'),
      supabase.from('dealers_master').select('id, dealer_code, dealer_name, kam_id, tl_id, dealer_city, dealer_region'),
    ]);
    setUsers(u.data || []); setTeams(t.data || []); setDealers(d.data || []);
  })(); }, []);

  const tree = useMemo(() => {
    const dealersByKam = new Map<string, Dealer[]>();
    dealers.forEach(d => {
      if (!d.kam_id) return;
      if (!dealersByKam.has(d.kam_id)) dealersByKam.set(d.kam_id, []);
      dealersByKam.get(d.kam_id)!.push(d);
    });
    return teams.map(team => {
      const tl = users.find(u => u.user_id === team.tl_user_id);
      const kams = users.filter(u => u.role === 'KAM' && u.team_id === team.team_id);
      return { team, tl, kams: kams.map(k => ({ ...k, dealers: dealersByKam.get(k.user_id) || [] })) };
    });
  }, [users, teams, dealers]);

  function toggle(id: string) {
    const next = new Set(expanded); next.has(id) ? next.delete(id) : next.add(id); setExpanded(next);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-sm text-slate-500">{teams.length} teams • {users.filter(u => u.role === 'KAM').length} KAMs • {dealers.length} dealers</div>
        <div className="ml-auto relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-64" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-3">
        {tree.map(({ team, tl, kams }) => (
          <div key={team.team_id} className="mb-1">
            <button onClick={() => toggle(team.team_id)} className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50">
              {expanded.has(team.team_id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50"><Users className="w-3.5 h-3.5" /></span>
              <span className="text-sm font-medium text-slate-800">{team.team_name}</span>
              <span className="text-xs text-slate-400 ml-2">{team.region} • TL: {tl?.name || '—'} • {kams.length} KAMs</span>
            </button>
            {expanded.has(team.team_id) && kams.map(kam => (
              <div key={kam.user_id} className="ml-8">
                <button onClick={() => toggle(kam.user_id)} className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50">
                  {kam.dealers.length > 0 && (expanded.has(kam.user_id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />)}
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-green-600 bg-green-50"><User className="w-3.5 h-3.5" /></span>
                  <span className="text-sm font-medium text-slate-800">{kam.name}</span>
                  <span className="text-xs text-slate-400 ml-2">{kam.dealers.length} dealers</span>
                </button>
                {expanded.has(kam.user_id) && kam.dealers.slice(0, 50).map(d => (
                  <div key={d.id} className="ml-16 flex items-center gap-2 py-1 px-3 text-xs text-slate-600">
                    <Store className="w-3 h-3 text-slate-400" /> {d.dealer_name} <span className="text-slate-400">({d.dealer_code})</span>
                  </div>
                ))}
                {expanded.has(kam.user_id) && kam.dealers.length > 50 && (
                  <div className="ml-16 text-xs text-slate-400 py-1">+{kam.dealers.length - 50} more</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB 2: KAM ↔ TL reassignment ──
function KamTlTab() {
  const [users, setUsers] = useState<UserLite[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [pending, setPending] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);

  async function load() {
    const [u, t] = await Promise.all([
      supabase.from('users').select('user_id, name, role, team_id, active').eq('active', true),
      supabase.from('teams').select('*'),
    ]);
    setUsers(u.data || []); setTeams(t.data || []); setPending(new Map());
  }
  useEffect(() => { load(); }, []);

  const kams = useMemo(() => users.filter(u => u.role === 'KAM').sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const tls = useMemo(() => users.filter(u => u.role === 'TL'), [users]);

  function setTeam(kamId: string, teamId: string) {
    const next = new Map(pending);
    const original = kams.find(k => k.user_id === kamId)?.team_id || '';
    if (teamId === original) next.delete(kamId);
    else next.set(kamId, teamId);
    setPending(next);
  }

  async function save() {
    if (pending.size === 0) return;
    if (!confirm(`Reassign ${pending.size} KAM(s) to new teams?`)) return;
    setSaving(true);
    let ok = 0;
    for (const [kamId, teamId] of pending.entries()) {
      const r = await updateUser(kamId, { team_id: teamId });
      if (r.error) { toast.error(`${kamId}: ${r.error}`); continue; }
      ok++;
    }
    toast.success(`${ok} reassigned`);
    setSaving(false);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-500">{kams.length} active KAMs across {teams.length} teams</div>
        {pending.size > 0 && (
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : `Apply ${pending.size} change(s)`}
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-medium text-slate-500">KAM</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Current Team</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">New Team</th>
          </tr></thead>
          <tbody>
            {kams.map(k => {
              const currentTeam = teams.find(t => t.team_id === k.team_id);
              const newTeamId = pending.get(k.user_id) ?? (k.team_id || '');
              const isChanged = pending.has(k.user_id);
              return (
                <tr key={k.user_id} className={`border-b border-slate-100 ${isChanged ? 'bg-amber-50' : ''}`}>
                  <td className="px-4 py-2 font-medium text-slate-900">{k.name}</td>
                  <td className="px-4 py-2 text-slate-600">{currentTeam?.team_name || '—'}</td>
                  <td className="px-4 py-2">
                    <select value={newTeamId} onChange={e => setTeam(k.user_id, e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded text-sm">
                      <option value="">— No team —</option>
                      {teams.map(t => {
                        const tl = tls.find(u => u.user_id === t.tl_user_id);
                        return <option key={t.team_id} value={t.team_id}>{t.team_name} ({tl?.name || 'no TL'})</option>;
                      })}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TAB 3: Dealer ↔ KAM with bulk + upload ──
function DealerKamTab() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [kams, setKams] = useState<UserLite[]>([]);
  const [search, setSearch] = useState('');
  const [filterKam, setFilterKam] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetKam, setTargetKam] = useState<string>('');
  const [preview, setPreview] = useState<ReassignImpact | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [d, u] = await Promise.all([
      supabase.from('dealers_master').select('id, dealer_code, dealer_name, kam_id, tl_id, dealer_city, dealer_region'),
      supabase.from('users').select('user_id, name, role, team_id, active').eq('active', true).eq('role', 'KAM'),
    ]);
    setDealers(d.data || []); setKams(u.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const cities = useMemo(() => Array.from(new Set(dealers.map(d => d.dealer_city).filter(Boolean))).sort(), [dealers]);

  const filtered = useMemo(() => {
    let list = dealers;
    if (filterKam === 'unassigned') list = list.filter(d => !d.kam_id);
    else if (filterKam !== 'all') list = list.filter(d => d.kam_id === filterKam);
    if (filterCity !== 'all') list = list.filter(d => d.dealer_city === filterCity);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.dealer_name?.toLowerCase().includes(q) || String(d.dealer_code).toLowerCase().includes(q) || d.dealer_city?.toLowerCase().includes(q));
    }
    return list.slice(0, 500);
  }, [dealers, search, filterKam, filterCity]);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(d => d.id)));
  }

  async function doDryRun() {
    if (selected.size === 0 || !targetKam) { toast.error('Select dealers and target KAM'); return; }
    const r = await reassignDealers(Array.from(selected), targetKam, true);
    if (r.error) { toast.error(r.error); return; }
    setPreview(r.data?.impact || null);
  }

  async function doApply() {
    if (!preview) return;
    const r = await reassignDealers(Array.from(selected), targetKam, false);
    if (r.error) { toast.error(r.error); return; }
    toast.success(`Reassigned ${r.data?.impact.dealers_affected} dealers`);
    setSelected(new Set()); setPreview(null); setTargetKam('');
    load();
  }

  async function doUnassign() {
    if (selected.size === 0) return;
    if (!confirm(`Unassign ${selected.size} dealer(s) from their KAM?`)) return;
    const r = await reassignDealers(Array.from(selected), null, false);
    if (r.error) { toast.error(r.error); return; }
    toast.success(`Unassigned ${selected.size} dealers`);
    setSelected(new Set());
    load();
  }

  const kamMap = useMemo(() => new Map(kams.map(k => [k.user_id, k.name])), [kams]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-sm text-slate-500">{dealers.length} dealers • {dealers.filter(d => !d.kam_id).length} unassigned</div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            <Upload className="w-4 h-4" /> CSV Upload
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Dealer name, code, city..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        <select value={filterKam} onChange={e => setFilterKam(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
          <option value="all">All KAMs</option>
          <option value="unassigned">Unassigned</option>
          {kams.map(k => <option key={k.user_id} value={k.user_id}>{k.name}</option>)}
        </select>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
          <option value="all">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-3">
          <span className="text-sm text-indigo-900 font-medium">{selected.size} dealer(s) selected</span>
          <select value={targetKam} onChange={e => setTargetKam(e.target.value)} className="px-2 py-1 border border-indigo-300 rounded text-sm">
            <option value="">Reassign to...</option>
            {kams.map(k => <option key={k.user_id} value={k.user_id}>{k.name}</option>)}
          </select>
          <button onClick={doDryRun} disabled={!targetKam} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm disabled:opacity-40">Preview Impact</button>
          <button onClick={doUnassign} className="px-3 py-1 bg-white border border-red-300 text-red-700 rounded text-sm hover:bg-red-50">Unassign</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-3 py-3"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Code</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">City</th>
            <th className="text-left px-4 py-3 font-medium text-slate-500">Current KAM</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-3 py-2"><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleSelect(d.id)} /></td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{d.dealer_code}</td>
                <td className="px-4 py-2 font-medium text-slate-900">{d.dealer_name}</td>
                <td className="px-4 py-2 text-slate-600">{d.dealer_city || '—'}</td>
                <td className="px-4 py-2 text-slate-600">{d.kam_id ? kamMap.get(d.kam_id) || d.kam_id : <span className="text-amber-600">Unassigned</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 500 && <div className="px-4 py-2 text-xs text-slate-400 bg-slate-50">Showing first 500. Refine your search.</div>}
      </div>

      {preview && <PreviewModal impact={preview} kamName={kamMap.get(targetKam) || targetKam} onApply={doApply} onCancel={() => setPreview(null)} />}
      {showUpload && <BulkUploadModal kams={kams} onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); load(); }} />}
    </div>
  );
}

function PreviewModal({ impact, kamName, onApply, onCancel }: { impact: ReassignImpact; kamName: string; onApply: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Reassignment Impact Preview</h3>
            <p className="text-sm text-slate-500">Reassigning to <strong>{kamName}</strong></p>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <Stat label="Dealers affected" value={impact.dealers_affected} />
          <Stat label="Leads affected" value={impact.leads_affected} />
          <Stat label="Calls affected" value={impact.calls_affected} />
          <Stat label="Visits affected" value={impact.visits_affected} />
        </div>
        <p className="text-xs text-slate-500 mb-4">This will update <code>dealers_master.kam_id</code> and <code>tl_id</code>. All derived metrics will refresh on next load.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={onApply} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Apply Reassignment</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function BulkUploadModal({ kams, onClose, onDone }: { kams: UserLite[]; onClose: () => void; onDone: () => void }) {
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState<{ processed: number; errors: { row: number; error: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);

  function parseCsv(text: string): Record<string, any>[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const cells = line.split(',').map(c => c.trim());
      const row: Record<string, any> = {};
      headers.forEach((h, i) => { row[h] = cells[i]; });
      return row;
    });
  }

  async function run(dry: boolean) {
    const rows = parseCsv(csvText);
    if (rows.length === 0) { toast.error('No rows found'); return; }
    setBusy(true);
    const r = await bulkUpload('dealer_kam_mapping', rows, dry);
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    setResult({ processed: r.data!.processed, errors: r.data!.errors });
    if (!dry && r.data!.errors.length === 0) onDone();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Bulk Dealer ↔ KAM Upload</h3>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-500">CSV columns: <code>dealer_code,kam_id</code></p>
          <button onClick={() => {
            const sample = kams[0];
            const csv = `dealer_code,kam_id\n# Replace with real dealer codes and KAM user_ids\n# Example KAM: ${sample?.name || 'Name'} = ${sample?.user_id || 'kam-uuid'}\nDEALER001,${sample?.user_id || 'kam-uuid'}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'dealer_kam_template.csv'; a.click();
            URL.revokeObjectURL(url);
          }} className="text-xs text-indigo-600 hover:text-indigo-800 underline">Download template</button>
        </div>
        <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={10}
          placeholder={`dealer_code,kam_id\nD001,${kams[0]?.user_id || 'kam-uuid'}\n...`}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono" />
        {result && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm">
            <div className="font-medium">Processed: {result.processed}</div>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs text-red-600 max-h-32 overflow-auto">
                {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.error}</li>)}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
          <button onClick={() => run(true)} disabled={busy || !csvText} className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg disabled:opacity-40">Dry Run</button>
          <button onClick={() => run(false)} disabled={busy || !csvText} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-40">Apply</button>
        </div>
      </div>
    </div>
  );
}
