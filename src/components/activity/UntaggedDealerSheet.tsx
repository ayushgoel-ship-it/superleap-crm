/**
 * UntaggedDealerSheet — KAM-only modal to create an untagged dealer.
 * Spec: requires { name, phone }. Persists via createUntaggedDealer() then
 * returns the new id to the caller (which starts a visit on it).
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { createUntaggedDealer } from '../../api/untaggedDealer.api';
import { useAuth } from '../auth/AuthProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string, name: string, phone: string) => void;
}

export function UntaggedDealerSheet({ open, onClose, onCreated }: Props) {
  const { activeActor } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required');
      return;
    }
    setBusy(true);
    try {
      const row = await createUntaggedDealer({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim() || undefined,
        createdBy: activeActor?.userId,
      });
      onCreated(row.id, row.name || name.trim(), row.phone);
      setName(''); setPhone(''); setCity('');
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create untagged dealer');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">Add untagged dealer</h2>
          <button onClick={onClose} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dealer name *"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px]"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone *"
            inputMode="tel"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px]"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-[13px]"
          />
        </div>
        {error && <div className="text-[11px] text-rose-600">{error}</div>}
        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-2 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create & Start Visit'}
        </button>
      </div>
    </div>
  );
}
