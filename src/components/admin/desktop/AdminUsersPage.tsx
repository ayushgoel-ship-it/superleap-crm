import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, UserX, UserCheck, Copy, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner@2.0.3';
import {
  createUser,
  deactivateUser,
  updateUser,
  type CreateUserInput,
  type DeactivateBlocker,
} from '@/data/mgmtRepo';

interface UserRow {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  team_id: string | null;
  city: string;
  region: string;
  active: boolean;
  must_reset_password?: boolean;
  teamName?: string;
}

interface Team {
  team_id: string;
  team_name: string;
  region: string;
  tl_user_id: string;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [createdCredential, setCreatedCredential] = useState<{ email: string; password: string } | null>(null);
  const [deactivatePrompt, setDeactivatePrompt] = useState<{ user: UserRow; blockers: DeactivateBlocker[] } | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: uData }, { data: tData }] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('teams').select('*'),
    ]);
    const teamMap = new Map((tData || []).map(t => [t.team_id, t.team_name]));
    setUsers((uData || []).map(u => ({ ...u, teamName: teamMap.get(u.team_id) || '' })));
    setTeams(tData || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      const order: Record<string, number> = { ADMIN: 0, SUPER_ADMIN: 0, TL: 1, KAM: 2 };
      return (order[a.role] ?? 3) - (order[b.role] ?? 3);
    });
  }, [users, search, roleFilter]);

  async function handleDeactivateClick(user: UserRow) {
    if (!user.active) {
      // reactivate path: simple flag flip (no blockers)
      const r = await updateUser(user.user_id, { active: true, deactivated_at: null, deactivated_by: null });
      if (r.error) toast.error(r.error); else toast.success(`${user.name} reactivated`);
      loadAll();
      return;
    }
    // dry run first to show blockers
    const dry = await deactivateUser(user.user_id, true);
    if (dry.error) { toast.error(dry.error); return; }
    const blockers = dry.data?.blockers || [];
    if (blockers.length === 0) {
      if (!confirm(`Deactivate ${user.name}? They will lose app access.`)) return;
      const r = await deactivateUser(user.user_id, false);
      if (r.error) toast.error(r.error); else toast.success(`${user.name} deactivated`);
      loadAll();
    } else {
      setDeactivatePrompt({ user, blockers });
    }
  }

  async function handleCreate(input: CreateUserInput) {
    const r = await createUser(input);
    if (r.error || !r.data) { toast.error(r.error || 'create failed'); return; }
    setShowAddForm(false);
    setCreatedCredential({ email: input.email, password: r.data.temp_password });
    toast.success('User created');
    loadAll();
  }

  async function handleEditSave(patch: Partial<UserRow>) {
    if (!editingUser) return;
    const r = await updateUser(editingUser.user_id, {
      name: patch.name, phone: patch.phone, team_id: patch.team_id, city: patch.city, region: patch.region,
    });
    if (r.error) toast.error(r.error); else toast.success('User updated');
    setEditingUser(null);
    loadAll();
  }

  const tls = useMemo(() => users.filter(u => u.role === 'TL' && u.active !== false), [users]);

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700', SUPER_ADMIN: 'bg-purple-100 text-purple-700',
      TL: 'bg-blue-100 text-blue-700', KAM: 'bg-green-100 text-green-700',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>{role}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500 mt-1">{users.length} users • {users.filter(u => u.active !== false).length} active</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        {['all', 'ADMIN', 'TL', 'KAM'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-2 rounded-lg text-xs font-medium ${roleFilter === r ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {r === 'all' ? 'All' : r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Team / TL</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Region</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No users</td></tr>
            ) : filtered.map(user => (
              <tr key={user.user_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {user.name}
                  {user.must_reset_password && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">PWD RESET</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">{roleBadge(user.role)}</td>
                <td className="px-4 py-3 text-slate-600">{user.teamName || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{user.region || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.active !== false ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {user.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditingUser(user)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeactivateClick(user)} className="p-1.5 text-slate-400 hover:text-amber-600 rounded"
                      title={user.active !== false ? 'Deactivate' : 'Reactivate'}>
                      {user.active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddForm && <AddUserModal teams={teams} tls={tls} onCreate={handleCreate} onClose={() => setShowAddForm(false)} />}
      {editingUser && <EditUserModal user={editingUser} teams={teams} onSave={handleEditSave} onClose={() => setEditingUser(null)} />}
      {createdCredential && <CredentialModal {...createdCredential} onClose={() => setCreatedCredential(null)} />}
      {deactivatePrompt && <BlockerModal {...deactivatePrompt} onClose={() => setDeactivatePrompt(null)} />}
    </div>
  );
}

// ── Add user wizard ──
function AddUserModal({ teams, tls, onCreate, onClose }: {
  teams: Team[]; tls: UserRow[];
  onCreate: (input: CreateUserInput) => void; onClose: () => void;
}) {
  const [role, setRole] = useState<'KAM' | 'TL' | 'ADMIN'>('KAM');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teamId, setTeamId] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const eligibleTeams = teams; // KAM picks any team; could filter by region
  const valid = name && email && (role !== 'KAM' || teamId);

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    await onCreate({ email, name, phone, role, team_id: role === 'KAM' ? teamId : undefined, region, city });
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add User</h3>
        <div className="space-y-3">
          <Field label="Role">
            <select value={role} onChange={e => setRole(e.target.value as any)} className="input">
              <option value="KAM">KAM</option>
              <option value="TL">TL</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </Field>
          <Field label="Name *"><input value={name} onChange={e => setName(e.target.value)} className="input" /></Field>
          <Field label="Email *"><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" /></Field>
          <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} className="input" /></Field>
          {role === 'KAM' && (
            <Field label="Team (TL) *">
              <select value={teamId} onChange={e => setTeamId(e.target.value)} className="input">
                <option value="">Select team...</option>
                {eligibleTeams.map(t => {
                  const tl = tls.find(u => u.user_id === t.tl_user_id);
                  return <option key={t.team_id} value={t.team_id}>{t.team_name} ({tl?.name || 'no TL'})</option>;
                })}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Region"><input value={region} onChange={e => setRegion(e.target.value)} className="input" placeholder="NCR / West / South / East" /></Field>
            <Field label="City"><input value={city} onChange={e => setCity(e.target.value)} className="input" /></Field>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 rounded p-2">A secure temporary password will be generated. The user will be forced to reset it on first login.</div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={submit} disabled={!valid || submitting} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40">
            {submitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
      <style>{`.input{width:100%;padding:0.5rem 0.75rem;border:1px solid #e2e8f0;border-radius:0.5rem;font-size:0.875rem}`}</style>
    </div>
  );
}

function EditUserModal({ user, teams, onSave, onClose }: {
  user: UserRow; teams: Team[]; onSave: (p: Partial<UserRow>) => void; onClose: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [teamId, setTeamId] = useState(user.team_id || '');
  const [region, setRegion] = useState(user.region || '');
  const [city, setCity] = useState(user.city || '');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit User</h3>
        <div className="space-y-3">
          <Field label="Name"><input value={name} onChange={e => setName(e.target.value)} className="input" /></Field>
          <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} className="input" /></Field>
          <Field label="Email"><input value={user.email} disabled className="input opacity-60" /></Field>
          {user.role === 'KAM' && (
            <Field label="Team">
              <select value={teamId} onChange={e => setTeamId(e.target.value)} className="input">
                <option value="">No Team</option>
                {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Region"><input value={region} onChange={e => setRegion(e.target.value)} className="input" /></Field>
            <Field label="City"><input value={city} onChange={e => setCity(e.target.value)} className="input" /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={() => onSave({ name, phone, team_id: teamId || null, region, city })}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
        </div>
      </div>
      <style>{`.input{width:100%;padding:0.5rem 0.75rem;border:1px solid #e2e8f0;border-radius:0.5rem;font-size:0.875rem}`}</style>
    </div>
  );
}

function CredentialModal({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">User Created</h3>
        <p className="text-sm text-slate-600 mb-4">Share this temporary password with the user. They will be forced to reset it on first login. <strong>This is the only time it will be shown.</strong></p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <div><div className="text-xs text-slate-500">Email</div><div className="font-mono text-sm">{email}</div></div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="text-xs text-slate-500">Temporary password</div>
              <div className="font-mono text-sm break-all">{password}</div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(password); toast.success('Copied'); }}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded"><Copy className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">I've Shared It</button>
        </div>
      </div>
    </div>
  );
}

function BlockerModal({ user, blockers, onClose }: { user: UserRow; blockers: DeactivateBlocker[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Cannot deactivate {user.name}</h3>
            <p className="text-sm text-slate-500">Resolve the following before deactivation:</p>
          </div>
        </div>
        <ul className="space-y-2 mb-4">
          {blockers.map((b, i) => (
            <li key={i} className="bg-slate-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-slate-900">{b.message}</div>
              <div className="text-xs text-slate-500 mt-0.5">{b.type}: {b.count}</div>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Close</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
