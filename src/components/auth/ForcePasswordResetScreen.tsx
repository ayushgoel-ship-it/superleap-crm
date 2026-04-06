import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { completePasswordReset } from '@/data/mgmtRepo';

interface Props {
  email: string;
  onComplete: () => void;
}

export function ForcePasswordResetScreen({ email, onComplete }: Props) {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);

  const valid = pw1.length >= 8 && pw1 === pw2;

  async function submit() {
    if (!valid) return;
    setBusy(true);
    const r = await completePasswordReset(pw1);
    setBusy(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success('Password updated');
    onComplete();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mx-auto mb-4">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 text-center mb-1">Set a new password</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Your account requires a password change before you can continue.</p>
        <div className="text-xs text-slate-500 mb-4">Signed in as <strong>{email}</strong></div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">New password (min 8 chars)</label>
            <input type="password" value={pw1} onChange={e => setPw1(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Confirm new password</label>
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
            {pw2 && pw1 !== pw2 && <p className="text-xs text-red-600 mt-1">Passwords do not match</p>}
          </div>
        </div>
        <button onClick={submit} disabled={!valid || busy}
          className="w-full mt-6 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {busy ? 'Updating...' : 'Set password & continue'}
        </button>
      </div>
    </div>
  );
}
