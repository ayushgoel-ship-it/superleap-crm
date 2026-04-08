/**
 * KAMStartTab — KAM "Start" tab in the rebuilt Activity module.
 *
 * Layout:
 *   • DealerFilterBar (compact 4-chip)
 *   • Log untagged dealer CTA
 *   • Pinned StartVisit block + KAM dealer cards (via VisitsTabContent in
 *     lockToDealers mode — no Today/Past sub-tabs)
 *
 * Provides the canonical Call flow (addCall + visitApi.registerCall + the
 * UnifiedFeedbackForm in CALL mode) so the Start tab can dial + log a call
 * without leaving the page.
 */

import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { VisitsTabContent } from './VisitsTabContent';
import { DealerFilterBar } from './DealerFilterBar';
import { UntaggedDealerSheet } from './UntaggedDealerSheet';
import { UnifiedFeedbackModal } from './VisitModals';
import {
  DEFAULT_DEALER_FILTER,
  type DealerFilterState,
  buildInspectingDealerKeys,
  buildActiveDealerKeys,
} from '../../lib/activity/dealerActivityFilter';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { useActivity } from '../../contexts/ActivityContext';
import { useKamScope } from '../../lib/auth/useKamScope';
import { getDealersByKAM } from '../../data/selectors';
import { useCanonicalCallFlow } from '../../lib/activity/useCanonicalCallFlow';

interface Props {
  onNavigateToVisitFeedback?: (visitId: string) => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function KAMStartTab({ onNavigateToVisitFeedback }: Props) {
  const [filter, setFilter] = useState<DealerFilterState>(DEFAULT_DEALER_FILTER);
  const [showUntagged, setShowUntagged] = useState(false);
  const { calls, visits, refresh: refreshActivity } = useActivity();
  const kamId = useKamScope();
  const callFlow = useCanonicalCallFlow({ origin: 'kam_start' });

  // ── Inspection 30d count map (keyed by both dealerId and dealerCode) ──
  const { inspectingKeys, inspectionCountByKey } = useMemo(() => {
    const counts = new Map<string, number>();
    let leads: any[] = [];
    try { leads = getRuntimeDBSync().leads; } catch { /* noop */ }
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    for (const l of leads) {
      if (l.regInspRank !== 1) continue;
      const insp = l.inspectionDate;
      if (!insp) continue;
      const t = new Date(insp).getTime();
      if (!Number.isFinite(t) || t < cutoff) continue;
      if (l.dealerId) counts.set(String(l.dealerId), (counts.get(String(l.dealerId)) ?? 0) + 1);
      if (l.dealerCode) counts.set(String(l.dealerCode), (counts.get(String(l.dealerCode)) ?? 0) + 1);
    }
    return {
      inspectingKeys: buildInspectingDealerKeys(leads),
      inspectionCountByKey: counts,
    };
  }, []);

  // ── Active 30d (any call OR visit, scoped to KAM's dealers) ──
  const kamDealerIdSet = useMemo(() => {
    if (!kamId) return new Set<string>();
    return new Set(getDealersByKAM(kamId).map((d) => d.id));
  }, [kamId]);

  const scopedCalls = useMemo(
    () => calls.filter((c) => kamDealerIdSet.has(c.dealerId)),
    [calls, kamDealerIdSet],
  );
  const scopedVisits = useMemo(
    () => visits.filter((v) => kamDealerIdSet.has(v.dealerId)),
    [visits, kamDealerIdSet],
  );

  const activeKeys = useMemo(
    () => buildActiveDealerKeys(scopedCalls, scopedVisits),
    [scopedCalls, scopedVisits],
  );

  // ── Per-channel last-30d key sets (for the card chips) ──
  const { called30dKeys, visited30dKeys } = useMemo(() => {
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const ck = new Set<string>();
    const vk = new Set<string>();
    for (const c of scopedCalls) {
      const t = new Date(c.timestamp || c.createdAt || 0).getTime();
      if (!Number.isFinite(t) || t < cutoff) continue;
      if (c.dealerId) ck.add(String(c.dealerId));
      if (c.dealerCode) ck.add(String(c.dealerCode));
    }
    for (const v of scopedVisits) {
      const t = new Date(v.checkInTime || v.createdAt || v.scheduledTime || 0).getTime();
      if (!Number.isFinite(t) || t < cutoff) continue;
      if (v.dealerId) vk.add(String(v.dealerId));
      if (v.dealerCode) vk.add(String(v.dealerCode));
    }
    return { called30dKeys: ck, visited30dKeys: vk };
  }, [scopedCalls, scopedVisits]);

  // ── Canonical "Call" flow (shared with DealerDetailPageV2) ──
  const handleCallDealer = useCallback(
    (dealerId: string, dealerName: string, dealerCode: string) => {
      const dealer = (kamId ? getDealersByKAM(kamId) : []).find((d) => d.id === dealerId);
      callFlow.startCall({
        dealerId,
        dealerName,
        dealerCode,
        dealerCity: (dealer as any)?.city || '',
        phone: (dealer as any)?.phone,
      });
    },
    [kamId, callFlow],
  );

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-2 bg-white/60 border-b border-slate-100">
        <button
          onClick={() => setShowUntagged(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-indigo-300 text-indigo-600 text-[12px] font-semibold hover:bg-indigo-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Log untagged dealer
        </button>
      </div>
      <VisitsTabContent
        onNavigateToVisitFeedback={onNavigateToVisitFeedback}
        dealerFilter={filter}
        inspectingKeys={inspectingKeys}
        activeKeys={activeKeys}
        lockToDealers
        inspectionCountByKey={inspectionCountByKey}
        called30dKeys={called30dKeys}
        visited30dKeys={visited30dKeys}
        onCallDealer={handleCallDealer}
        dealerListHeader={<DealerFilterBar value={filter} onChange={setFilter} />}
      />
      <UntaggedDealerSheet
        open={showUntagged}
        onClose={() => setShowUntagged(false)}
        onCreated={() => {
          refreshActivity();
        }}
      />
      {callFlow.pendingCall && (
        <UnifiedFeedbackModal
          interactionType="CALL"
          dealerName={callFlow.pendingCall.dealerName}
          visitId={callFlow.pendingCall.id}
          closeable
          onClose={callFlow.closeFeedback}
          onSubmit={callFlow.submitFeedback}
        />
      )}
    </div>
  );
}
