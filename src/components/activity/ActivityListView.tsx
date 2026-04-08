/**
 * ActivityListView — shared chronological feed renderer for TL/Admin shells.
 * Pure UI; receives already-filtered call + visit arrays and a Calls/Visits toggle.
 */

import { useMemo } from 'react';
import type { CallAttempt, Visit } from '../../contexts/ActivityContext';
import {
  CallActivityCard,
  VisitActivityCard,
  isCallPendingFeedback,
  isVisitPendingFeedback,
} from './ActivityCard';

interface Props {
  calls: CallAttempt[];
  visits: Visit[];
  mode: 'calls' | 'visits' | 'all';
  onCallClick?: (callId: string) => void;
  onVisitClick?: (visitId: string) => void;
}

export function ActivityListView({ calls, visits, mode, onCallClick, onVisitClick }: Props) {
  const items = useMemo(() => {
    type Item = { id: string; type: 'call' | 'visit'; ts: number; call?: CallAttempt; visit?: Visit };
    const list: Item[] = [];
    if (mode !== 'visits') {
      for (const c of calls) list.push({ id: c.id, type: 'call', ts: new Date(c.timestamp).getTime(), call: c });
    }
    if (mode !== 'calls') {
      for (const v of visits) {
        const t = v.checkInTime || v.createdAt || v.scheduledTime;
        list.push({ id: v.id, type: 'visit', ts: t ? new Date(t).getTime() : 0, visit: v });
      }
    }
    return list.sort((a, b) => b.ts - a.ts);
  }, [calls, visits, mode]);

  if (items.length === 0) {
    return <div className="text-center text-[12px] text-slate-400 py-10">No activity in this period</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        if (item.type === 'call' && item.call) {
          return (
            <CallActivityCard
              key={item.id}
              call={item.call}
              onAddFeedback={isCallPendingFeedback(item.call) ? () => onCallClick?.(item.call!.id) : undefined}
              onViewDetails={() => onCallClick?.(item.call!.id)}
            />
          );
        }
        if (item.type === 'visit' && item.visit) {
          return (
            <VisitActivityCard
              key={item.id}
              visit={item.visit}
              onAddFeedback={isVisitPendingFeedback(item.visit) ? () => onVisitClick?.(item.visit!.id) : undefined}
              onViewSummary={item.visit.status === 'completed' ? () => onVisitClick?.(item.visit!.id) : undefined}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
