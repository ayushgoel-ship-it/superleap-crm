/**
 * KAMActivityShell — KAM-role wrapper for the rebuilt Activity module.
 * Two tabs: Start (intelligence-sorted dealers + canonical Visits engine) and
 * All Activity (chronological feed + canonical 6-metric strip).
 */

import { useState } from 'react';
import { KAMStartTab } from './KAMStartTab';
import { KAMAllActivityTab } from './KAMAllActivityTab';

interface Props {
  onNavigateToCallFeedback?: (callId: string) => void;
  onNavigateToVisitFeedback?: (visitId: string) => void;
}

type Tab = 'start' | 'all';

export function KAMActivityShell({ onNavigateToCallFeedback, onNavigateToVisitFeedback }: Props) {
  const [tab, setTab] = useState<Tab>('start');

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-2">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Activity</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Calls and visits across your dealers</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setTab('start')}
            className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all
              ${tab === 'start' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Start
          </button>
          <button
            onClick={() => setTab('all')}
            className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all
              ${tab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            All Activity
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'start' ? (
          <KAMStartTab onNavigateToVisitFeedback={onNavigateToVisitFeedback} />
        ) : (
          <KAMAllActivityTab
            onNavigateToCallFeedback={onNavigateToCallFeedback}
            onNavigateToVisitFeedback={onNavigateToVisitFeedback}
          />
        )}
      </div>
    </div>
  );
}
