import { useMemo, useState } from 'react';
import type { UserRole } from '../../lib/shared/appTypes';
import { IndianRupee, Trophy, Calculator } from 'lucide-react';
import { computeMetrics, computeKAMMetrics } from '../../lib/metrics/metricsFromDB';
import { computeInputScore } from '../../lib/metrics/inputScore';
import { TimePeriod } from '../../lib/domain/constants';
import { getSITarget } from '../../lib/metricsEngine';
import { calculateActualProjectedIncentive, type IncentiveContext, type DCFIncentiveMetrics } from '../../lib/incentiveEngine';
import { getMonthProgress } from '../../lib/metrics/metricsFromDB';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { getConfigI2SITarget, getConfigDCFGMVTarget } from '../../lib/configFromDB';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';
import { useActorScope } from '../../lib/auth/useActorScope';
import { KAMFilter } from '../common/KAMFilter';

interface PerformancePageProps {
  userRole: UserRole;
  kamId?: string;
  onNavigate?: (page: string) => void;
  onOpenTLIncentive?: () => void;
}

export function PerformancePage({ userRole, kamId, onNavigate, onOpenTLIncentive }: PerformancePageProps) {
  const [period, setPeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { effectiveKamIds, role: actorRole, actorName } = useActorScope();

  const { targetCards, funnelData, rankText, topDealers, incentiveBreakdown, totalIncentive } = useMemo(() => {
    // For TL/Admin, aggregate per-kam metrics across effective team; otherwise use passed kamId.
    const effectiveSingleKam =
      actorRole === 'KAM'
        ? (kamId || (effectiveKamIds && effectiveKamIds[0]))
        : effectiveKamIds && effectiveKamIds.length === 1
          ? effectiveKamIds[0]
          : undefined;
    const aggregateIds =
      (actorRole === 'TL' || actorRole === 'Admin') && effectiveKamIds && effectiveKamIds.length > 1
        ? effectiveKamIds
        : undefined;

    const metrics = aggregateIds
      ? (() => {
          const perKam = aggregateIds.map(kid => computeMetrics(period, kid, customFrom, customTo));
          const sum = (k: keyof typeof perKam[0]) => perKam.reduce((s, m) => s + ((m as any)[k] || 0), 0);
          const inspections = sum('inspections');
          const stockIns = sum('stockIns');
          return {
            ...perKam[0],
            totalLeads: sum('totalLeads'),
            inspections,
            tokens: sum('tokens'),
            stockIns,
            totalCalls: sum('totalCalls'),
            completedVisits: sum('completedVisits'),
            uniqueDealersCalled: sum('uniqueDealersCalled'),
            dcfDisbursals: sum('dcfDisbursals'),
            i2si: inspections > 0 ? Math.round((stockIns / inspections) * 100) : 0,
            conversionRate: inspections > 0 ? Math.round((stockIns / inspections) * 100) : 0,
          };
        })()
      : computeMetrics(period, effectiveSingleKam ?? kamId, customFrom, customTo);
    const scopeKamId = aggregateIds ? undefined : (effectiveSingleKam ?? kamId);
    const siTarget = getSITarget(userRole === 'TL' ? 'TL' : 'KAM');
    const monthCtx = getMonthProgress();
    const db = getRuntimeDBSync();

    // Compute rank from all KAMs
    let rankStr = '';
    if (userRole === 'KAM' && kamId) {
      const allKams = computeKAMMetrics(period);
      const sorted = [...allKams].sort((a, b) => b.stockIns - a.stockIns);
      const myIdx = sorted.findIndex(k => k.kamId === kamId);
      if (myIdx >= 0) {
        rankStr = `Rank #${myIdx + 1} of ${sorted.length} KAMs`;
      }
    }

    // Target cards
    const siPercent = siTarget > 0 ? Math.round((metrics.stockIns / siTarget) * 100) : 0;
    const i2si = metrics.i2si;
    const i2siTarget = getConfigI2SITarget();
    const i2siPercent = i2siTarget > 0 ? Math.round((i2si / i2siTarget) * 100) : 0;
    const dcfTarget = getConfigDCFGMVTarget();
    const dcfPercent = dcfTarget > 0 ? Math.round((metrics.dcfDisbursals / dcfTarget) * 100) : 0;

    const cards = [
      { title: 'Stock-in', achieved: metrics.stockIns, target: siTarget, percent: siPercent },
      { title: 'I2SI%', achieved: i2si, target: i2siTarget, percent: i2siPercent },
      { title: 'DCF Disbursals', achieved: metrics.dcfDisbursals, target: dcfTarget, percent: dcfPercent },
    ];

    // Funnel
    const maxFunnel = Math.max(metrics.totalLeads, 1);
    const funnel = [
      { stage: 'Leads', count: metrics.totalLeads, max: maxFunnel },
      { stage: 'Inspections', count: metrics.inspections, max: maxFunnel },
      { stage: 'Tokens', count: metrics.tokens, max: maxFunnel },
      { stage: 'Stock-ins', count: metrics.stockIns, max: maxFunnel },
    ];

    // Top dealers by stock-ins
    const dealers = db.dealers || [];
    const kamDealers = aggregateIds
      ? dealers.filter(d => aggregateIds.includes(d.kamId || ''))
      : scopeKamId ? dealers.filter(d => d.kamId === scopeKamId) : dealers;
    const leads = db.leads || [];
    const dealerSIs = kamDealers.map(d => {
      const dealerLeads = leads.filter(l => l.dealerCode === d.dealerCode);
      const sis = dealerLeads.filter(l => l.regStockinRank === 1 && (l.finalSiDate || l.stockinDate)).length;
      return { dealer: d.name, code: d.dealerCode, stockIns: sis };
    }).filter(d => d.stockIns > 0).sort((a, b) => b.stockIns - a.stockIns).slice(0, 3);

    // Incentive calculation
    const dcfLeads = db.dcfLeads || [];
    const kamDcf = aggregateIds
      ? dcfLeads.filter(d => aggregateIds.includes(d.kamId || ''))
      : scopeKamId ? dcfLeads.filter(d => d.kamId === scopeKamId) : dcfLeads;
    const disbursed = kamDcf.filter(d => d.disbursalDate || d.overallStatus === 'disbursed');
    const gmvTotal = disbursed.reduce((sum, d) => sum + (d.loanAmount || 0), 0);
    const onboardingCount = new Set(kamDcf.map(d => d.dealerId)).size;

    const inputScore = computeInputScore(metrics);

    const ctx: IncentiveContext = {
      role: userRole === 'TL' ? 'TL' : 'KAM',
      siActualMTD: metrics.stockIns,
      siTarget,
      inspectionsMTD: metrics.inspections,
      daysElapsed: monthCtx.daysElapsed,
      totalDaysInMonth: monthCtx.totalDays,
      inputScore,
      dcf: {
        onboardingCount,
        gmvTotal,
        gmvFirstDisbursement: 0,
        dealerCount: onboardingCount,
      },
    };
    const result = calculateActualProjectedIncentive(ctx);

    const breakdown = [
      { metric: 'Stock-in', achieved: metrics.stockIns, payout: `₹${(result.breakup.siIncentive).toLocaleString()}` },
      { metric: 'DCF GMV', achieved: `₹${(gmvTotal / 100000).toFixed(1)}L`, payout: `₹${(result.breakup.dcf.totalDCF).toLocaleString()}` },
      { metric: 'Input Score', achieved: `${inputScore}`, payout: `${result.breakup.scoreMultiplier * 100}% multiplier` },
    ];

    return {
      targetCards: cards,
      funnelData: funnel,
      rankText: rankStr,
      topDealers: dealerSIs,
      incentiveBreakdown: breakdown,
      totalIncentive: result.totalIncentive,
    };
  }, [userRole, kamId, period, customFrom, customTo, actorRole, effectiveKamIds]);

  return (
    <div className="p-4 space-y-6">
      {(actorRole === 'TL' || actorRole === 'Admin') && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">{actorName}</div>
          <KAMFilter />
        </div>
      )}
      {/* TL Incentive Dashboard Quick Access (TL only) */}
      {userRole === 'TL' && onOpenTLIncentive && (
        <button
          onClick={onOpenTLIncentive}
          className="w-full bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 rounded-xl p-4 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-gray-900 mb-1">TL Incentive Dashboard</div>
                <div className="text-xs text-gray-600">View team performance & incentive calculator</div>
              </div>
            </div>
            <div className="text-2xl">›</div>
          </div>
        </button>
      )}

      {/* Leaderboard Quick Access */}
      <button
        onClick={() => onNavigate && onNavigate('leaderboard')}
        className="w-full bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-4 text-left hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-gray-900 mb-1">View Leaderboard</div>
              <div className="text-xs text-gray-600">{rankText ? `You are ${rankText}` : 'See how you compare'}</div>
            </div>
          </div>
          <div className="text-2xl">›</div>
        </div>
      </button>

      {/* Time Filter */}
      <div className="mb-4">
        <TimeFilterControl
          mode="chips"
          chipStyle="pill"
          value={period}
          onChange={setPeriod}
          options={CANONICAL_TIME_OPTIONS}
          labelOverrides={CANONICAL_TIME_LABELS}
          allowCustom
          customFrom={customFrom}
          customTo={customTo}
          onCustomRangeChange={({ fromISO, toISO }) => { setCustomFrom(fromISO); setCustomTo(toISO); }}
        />
      </div>

      {/* Target Cards */}
      <div>
        <h3 className="text-gray-900 mb-3">Targets (MTD)</h3>
        <div className="space-y-3">
          {targetCards.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600">{item.title}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  item.percent >= 100 ? 'bg-green-100 text-green-700' :
                  item.percent >= 80 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.percent}%
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl text-gray-900">{item.achieved}</span>
                <span className="text-sm text-gray-500">/ {item.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    item.percent >= 100 ? 'bg-green-500' :
                    item.percent >= 80 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(item.percent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel */}
      <div>
        <h3 className="text-gray-900 mb-3">Lead Funnel (MTD)</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          {funnelData.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{item.stage}</span>
                <span className="text-gray-900">{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${item.max > 0 ? (item.count / item.max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Dealers */}
      {topDealers.length > 0 && (
        <div>
          <h3 className="text-gray-900 mb-3">Top Dealers</h3>
          <div className="space-y-2">
            {topDealers.map((dealer, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-900">{dealer.dealer}</div>
                    <div className="text-xs text-gray-500">{dealer.code}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  Stock-ins: {dealer.stockIns}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incentive Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-900">Incentive Breakdown</h3>
          <div className="flex items-center gap-1 text-green-600">
            <IndianRupee className="w-4 h-4" />
            <span className="text-lg">{totalIncentive.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
          {incentiveBreakdown.map((item, idx) => (
            <div key={idx} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-900">{item.metric}</div>
                  <div className="text-xs text-gray-500">Achieved: {item.achieved}</div>
                </div>
                <div className="text-green-600">{item.payout}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
