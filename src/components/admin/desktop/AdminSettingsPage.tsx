import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner@2.0.3';

interface SlabRow {
  slab_id: string;
  role: string;
  slab_name: string;
  min_percent: number;
  max_percent: number | null;
  rate_per_si: number;
  description: string | null;
}

interface RuleRow {
  rule_id: string;
  scope: string;
  metric_key: string;
  threshold: number | null;
  payout: number | null;
}

interface AuditRow {
  log_id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  change_summary: string;
  created_at: string;
}

export function AdminSettingsPage() {
  const [tab, setTab] = useState<'slabs' | 'rules' | 'audit'>('slabs');
  const [slabs, setSlabs] = useState<SlabRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    if (tab === 'audit') {
      const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
      setAudit(data || []);
    } else {
      const [s, r] = await Promise.all([
        supabase.from('incentive_slabs').select('*'),
        supabase.from('incentive_rules').select('*'),
      ]);
      setSlabs(s.data || []);
      setRules(r.data || []);
    }
    setLoading(false);
  }

  async function updateSlab(slab: SlabRow, field: string, value: number) {
    const { error } = await supabase.from('incentive_slabs').update({ [field]: value }).eq('slab_id', slab.slab_id);
    if (error) { toast.error('Failed to update slab'); return; }
    await supabase.from('audit_log').insert({ action: 'slab_update', entity_type: 'incentive_slab', entity_id: slab.slab_id, change_summary: `Updated ${field} to ${value}` });
    toast.success('Slab updated');
    loadData();
  }

  async function updateRule(rule: RuleRow, field: string, value: number | null) {
    const { error } = await supabase.from('incentive_rules').update({ [field]: value }).eq('rule_id', rule.rule_id);
    if (error) { toast.error('Failed to update rule'); return; }
    await supabase.from('audit_log').insert({ action: 'rule_update', entity_type: 'incentive_rule', entity_id: rule.rule_id, change_summary: `Updated ${field}` });
    toast.success('Rule updated');
    loadData();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Settings & Configuration</h2>
          <p className="text-sm text-slate-500 mt-1">Manage incentive slabs and business rules</p>
        </div>
        <button onClick={loadData} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('slabs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'slabs' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          Incentive Slabs ({slabs.length})
        </button>
        <button onClick={() => setTab('rules')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'rules' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          Business Rules ({rules.length})
        </button>
        <button onClick={() => setTab('audit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'audit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          Audit Log
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">Loading...</div>
      ) : tab === 'slabs' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Slab Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Min %</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Max %</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Rate / SI</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {slabs.map(s => (
                <tr key={s.slab_id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.slab_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.role}</td>
                  <td className="px-1 py-1 text-center">
                    <input type="number" defaultValue={s.min_percent} onBlur={e => updateSlab(s, 'min_percent', Number(e.target.value))}
                      className="w-20 px-2 py-1.5 text-center text-sm border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded" />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <input type="number" defaultValue={s.max_percent ?? ''} onBlur={e => updateSlab(s, 'max_percent', Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-center text-sm border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded" placeholder="—" />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <input type="number" defaultValue={s.rate_per_si} onBlur={e => updateSlab(s, 'rate_per_si', Number(e.target.value))}
                      className="w-24 px-2 py-1.5 text-center text-sm border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded" />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.description || '—'}</td>
                </tr>
              ))}
              {slabs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No incentive slabs configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : tab === 'audit' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Time</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Action</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Entity</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Summary</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Actor</th>
            </tr></thead>
            <tbody>
              {audit.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No audit entries</td></tr>
              ) : audit.map(a => (
                <tr key={a.log_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-2 text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2"><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{a.action}</span></td>
                  <td className="px-4 py-2 text-xs text-slate-600">{a.entity_type}</td>
                  <td className="px-4 py-2 text-sm text-slate-700">{a.change_summary}</td>
                  <td className="px-4 py-2 text-xs font-mono text-slate-400">{a.actor_id?.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Metric</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Scope</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Threshold</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Payout</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.rule_id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.metric_key}</td>
                  <td className="px-4 py-3 text-slate-600">{r.scope}</td>
                  <td className="px-1 py-1 text-center">
                    <input type="number" defaultValue={r.threshold ?? ''} onBlur={e => updateRule(r, 'threshold', Number(e.target.value) || null)}
                      className="w-24 px-2 py-1.5 text-center text-sm border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded" placeholder="—" />
                  </td>
                  <td className="px-1 py-1 text-center">
                    <input type="number" defaultValue={r.payout ?? ''} onBlur={e => updateRule(r, 'payout', Number(e.target.value) || null)}
                      className="w-24 px-2 py-1.5 text-center text-sm border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded" placeholder="—" />
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No rules configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
