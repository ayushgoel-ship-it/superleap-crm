/**
 * AdminActivityShell — Admin-role view in the rebuilt Activity module.
 * Same body as TLActivityShell but adds a TL dropdown above the KAM dropdown.
 * The TL selection cascades into the KAM dropdown via kamIdsOverride.
 */

import { useMemo, useState } from 'react';
import { TLActivityShell } from './TLActivityShell';
import { getAllTLs, getKAMsByTL } from '../../data/selectors';

interface Props {
  onNavigateToCallFeedback?: (callId: string) => void;
  onNavigateToVisitFeedback?: (visitId: string) => void;
}

export function AdminActivityShell({ onNavigateToCallFeedback, onNavigateToVisitFeedback }: Props) {
  const tls = useMemo(() => getAllTLs(), []);
  const [selectedTlId, setSelectedTlId] = useState<string>('all');

  const kamIdsOverride = useMemo(() => {
    if (selectedTlId === 'all') return undefined;
    return getKAMsByTL(selectedTlId).map((k) => k.id);
  }, [selectedTlId]);

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-3">
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Activity</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Admin · all teams</p>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">TL</label>
          <select
            value={selectedTlId}
            onChange={(e) => setSelectedTlId(e.target.value)}
            className="text-[12px] font-medium px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="all">All TLs ({tls.length})</option>
            {tls.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TLActivityShell
          embedded
          kamIdsOverride={kamIdsOverride}
          onNavigateToCallFeedback={onNavigateToCallFeedback}
          onNavigateToVisitFeedback={onNavigateToVisitFeedback}
        />
      </div>
    </div>
  );
}
