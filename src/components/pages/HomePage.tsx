import React, { useState } from 'react';
import {
  CheckCircle, AlertTriangle, AlertCircle, Flame, Target, Banknote,
  ArrowUpRight, TrendingUp, MapPin, Phone, ChevronRight, BarChart3, X,
} from 'lucide-react';
import { TimePeriod } from '../../lib/domain/constants';
import type { UserRole } from '../../lib/shared/appTypes';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';
import { computeMetrics, getMonthProgress, projectToEOM, type DashboardMetrics } from '../../lib/metrics/metricsFromDB';
import { MetricCard } from '../cards/MetricCard';
import { TargetCard } from '../cards/TargetCard';
import { InputScoreCard } from '../cards/InputScoreCard';
import { IncentiveSimulator } from './IncentiveSimulator';
import { KAMDetailPage } from './KAMDetailPage';
import { TLHomeView } from './TLHomeView';
import {
  getI2SIRAG, getQualityRAG, getUniqueRaiseRAG, getMetricColorState,
} from '../../lib/domain/metrics';
import { getSITarget } from '../../lib/metricsEngine';
import { calculateActualProjectedIncentive, type IncentiveContext } from '../../lib/incentiveEngine';
import { getConfigSITarget, getConfigI2SITarget } from '../../lib/configFromDB';

interface HomePageProps {
  userRole: UserRole;
  onNavigateToDealers?: (filter?: string, context?: string) => void;
  onNavigateToProductivity?: () => void;
}

export function HomePage({ userRole, onNavigateToDealers, onNavigateToProductivity }: HomePageProps) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [selectedKAM, setSelectedKAM] = useState<{ name: string, city: string } | null>(null);
  const [showInspectingDealersDetail, setShowInspectingDealersDetail] = useState(false);
  const [expandedInspections, setExpandedInspections] = useState(false);
  const [expandedI2SI, setExpandedI2SI] = useState(false);
  const [expandedQuality, setExpandedQuality] = useState(false);
  const [expandedUniqueRaise, setExpandedUniqueRaise] = useState(false);
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');


  // Color-coded metric row helper
  const MetricRow = ({
    label, subtitle, value, target, state
  }: {
    label: string; subtitle: string; value: number; target: number;
    state: 'green' | 'yellow' | 'red';
  }) => {
    const stateConfig = {
      green: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
      yellow: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
      red: { bg: 'bg-rose-50', text: 'text-rose-700', icon: <AlertCircle className="w-4 h-4 text-rose-500" /> },
    };
    const config = stateConfig[state];
    return (
      <div className={`${config.bg} rounded-xl px-3 py-2.5 flex items-center justify-between`}>
        <div className="flex-1">
          <div className={`text-[13px] font-medium ${config.text}`}>{label}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${config.text}`}>{value}%</span>
          {config.icon}
        </div>
      </div>
    );
  };

  if (showSimulator) {
    return <IncentiveSimulator onClose={() => setShowSimulator(false)} userRole={userRole} />;
  }

  if (selectedKAM) {
    return (
      <KAMDetailPage
        kamName={selectedKAM.name}
        kamCity={selectedKAM.city}
        onBack={() => setSelectedKAM(null)}
      />
    );
  }

  if (userRole === 'TL') {
    return (
      <TLHomeView
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onKAMClick={(name, city) => setSelectedKAM({ name, city })}
      />
    );
  }

  // ── Real data from Supabase ──
  const metrics = computeMetrics(selectedPeriod);
  const { daysElapsed: daysElapsedInMonth, totalDays: totalDaysInMonth } = getMonthProgress();

  // Mapped data shape for the dashboard
  const data = {
    stockIns: metrics.stockIns,
    sis: metrics.wonLeads,
    i2si: metrics.i2si,
    dcfDisbursals: metrics.dcfDisbursals,
    dcfValue: metrics.dcfDisbursedValue,
    dcfDealersOnboarded: metrics.dcfOnboarded,
    dcfLeadsSubmitted: metrics.dcfTotal,
    visits: {
      top: metrics.completedVisits,
      tagged: metrics.scheduledVisits,
      untagged: Math.max(0, metrics.totalVisits - metrics.completedVisits - metrics.scheduledVisits),
    },
    connects: {
      top: metrics.connectedCalls,
      tagged: metrics.totalCalls - metrics.connectedCalls,
    },
    inspections: metrics.totalLeads,
    quality: metrics.callConnectRate,
    a2c: metrics.conversionRate,
    inputScore: Math.round(
      (Math.min(metrics.completedVisits / 3, 1) * 30) +
      (Math.min(metrics.totalCalls / 5, 1) * 30) +
      (Math.min(metrics.uniqueDealersCalled / 3, 1) * 20) +
      (Math.min(metrics.conversionRate / 50, 1) * 20)
    ),
    uniqueRaise: metrics.activeDealers > 0 ? Math.round((metrics.uniqueDealersCalled / metrics.activeDealers) * 100) : 0,
    avgInspectingDealers: metrics.uniqueDealersVisited > 0 ? metrics.uniqueDealersVisited : 0,
  };

  const targets = {
    inspections: selectedPeriod === TimePeriod.TODAY || selectedPeriod === TimePeriod.D_MINUS_1 ? 10 : 250,
    i2si: getConfigI2SITarget('KAM'),
    a2c: 65,
  };

  const getInspectionsBreakdown = () => {
    const inspectingDealers = metrics.uniqueDealersVisited || 1;
    const inspectionsPerDealer = (data.inspections / inspectingDealers).toFixed(1);
    return { inspectingDealers, inspectionsPerDealer };
  };

  // Channel-wise breakdown from real data
  const getI2SIBreakdown = () => {
    const cb = metrics.channelBreakdown;
    const total = metrics.totalLeads || 1;
    return {
      gsI2SI: Math.round(((cb['GS'] || 0) / total) * 100),
      ngsI2SI: Math.round(((cb['NGS'] || 0) / total) * 100),
      dcfI2T: Math.round(((cb['DCF'] || 0) / total) * 100),
      t2SI: metrics.i2si,
    };
  };

  const getUniqueRaiseBreakdown = () => {
    const ur = data.uniqueRaise;
    return {
      gsUniqueRaise: ur,
      ngsUniqueRaise: Math.max(0, ur - 4),
      dcfUniqueRaise: Math.max(0, ur - 2),
    };
  };

  const inspectionsBreakdown = getInspectionsBreakdown();
  const i2siBreakdown = getI2SIBreakdown();
  const uniqueRaiseBreakdown = getUniqueRaiseBreakdown();

  // Incentive projection from real data
  const projectedIncentive = selectedPeriod === TimePeriod.MTD && userRole !== 'Admin' ? (() => {
    const role = userRole as 'KAM' | 'TL';
    const target = getSITarget(role);
    const context: IncentiveContext = {
      role,
      siActualMTD: metrics.stockIns,
      siTarget: target,
      inspectionsMTD: metrics.totalLeads,
      daysElapsed: daysElapsedInMonth,
      totalDaysInMonth,
      inputScore: data.inputScore,
      dcf: {
        onboardingCount: metrics.dcfTotal,
        gmvTotal: metrics.dcfDisbursedValue * 100000,
        gmvFirstDisbursement: metrics.dcfDisbursals > 0 ? (metrics.dcfDisbursedValue * 100000) / metrics.dcfDisbursals : 0,
        dealerCount: metrics.activeDealers,
      },
    };
    return calculateActualProjectedIncentive(context);
  })() : null;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return '\u20B9' + (amount / 1000).toFixed(1) + 'K';
    return '\u20B9' + Math.round(amount).toLocaleString('en-IN');
  };

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in">
      {/* Period Switcher - Pill-style */}
      <TimeFilterControl
        mode="chips"
        chipStyle="pill"
        value={selectedPeriod}
        onChange={setSelectedPeriod}
        options={CANONICAL_TIME_OPTIONS}
        labelOverrides={CANONICAL_TIME_LABELS}
        allowCustom
        customFrom={customFrom}
        customTo={customTo}
        onCustomRangeChange={({ fromISO, toISO }) => { setCustomFrom(fromISO); setCustomTo(toISO); }}
      />

      {/* Hero Performance Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-5 text-white shadow-lg shadow-indigo-200/50">
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-16 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-amber-300" />
            <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
              {selectedPeriod === TimePeriod.TODAY ? 'Today' :
                selectedPeriod === TimePeriod.D_MINUS_1 ? 'Yesterday' :
                  selectedPeriod === TimePeriod.MTD ? 'Month to Date' : 'Last Month'} Performance
            </span>
          </div>

          {/* Primary KPIs: Stock-ins + DCF side by side */}
          <div className="flex gap-4 mb-5">
            <div className="flex-1">
              <div className="text-4xl font-bold tracking-tight">{data.stockIns}</div>
              <div className="text-[12px] text-indigo-200 font-medium mt-0.5">Stock-ins</div>
            </div>
            <div className="w-px bg-white/15" />
            <div className="flex-1">
              <div className="text-4xl font-bold tracking-tight flex items-baseline gap-1">
                {data.dcfDisbursals}
                {data.dcfValue > 0 && (
                  <span className="text-[13px] text-emerald-300 font-semibold">{'\u20B9'}{data.dcfValue >= 10 ? data.dcfValue.toFixed(0) : data.dcfValue.toFixed(1)}L</span>
                )}
              </div>
              <div className="text-[12px] text-indigo-200 font-medium mt-0.5">DCF Disbursals</div>
            </div>
          </div>

          {/* Sub-metrics: grouped by parent */}
          <div className="grid grid-cols-2 gap-3">
            {/* Stock-in sub-metrics */}
            <div className="bg-white/10 rounded-xl px-3 py-2.5 space-y-2">
              <div className="text-[9px] text-indigo-300 font-semibold uppercase tracking-widest">Stock-in</div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-indigo-200">I2SI%</span>
                <span className={`text-[15px] font-bold ${data.i2si >= 65 ? 'text-white' : 'text-amber-300'}`}>{data.i2si}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-indigo-200">Perf. Score</span>
                <span className={`text-[15px] font-bold ${data.inputScore >= 75 ? 'text-white' : 'text-amber-300'}`}>{data.inputScore}%</span>
              </div>
            </div>
            {/* DCF sub-metrics */}
            <div className="bg-white/10 rounded-xl px-3 py-2.5 space-y-2">
              <div className="text-[9px] text-indigo-300 font-semibold uppercase tracking-widest">DCF</div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-indigo-200">Onboarded</span>
                <span className="text-[15px] font-bold text-white">{data.dcfDealersOnboarded}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-indigo-200">Leads Submitted</span>
                <span className="text-[15px] font-bold text-white">{data.dcfLeadsSubmitted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Target, label: 'Productivity', color: 'bg-violet-50 text-violet-600', action: onNavigateToProductivity },
          { icon: Banknote, label: 'Incentive Tracker', color: 'bg-emerald-50 text-emerald-600', action: () => setShowSimulator(true) },
        ].map(({ icon: Icon, label, color, action }) => (
          <button
            key={label}
            onClick={() => action?.()}
            className="card-premium flex items-center gap-2.5 px-4 py-3.5 min-h-[52px]
                       active:scale-[0.97] transition-all duration-150"
          >
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700 whitespace-nowrap">{label}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
          </button>
        ))}
      </div>

      {/* Incentive Card */}
      <div
        className={`card-premium p-4 cursor-pointer active:scale-[0.99] transition-all duration-150
          ${projectedIncentive && projectedIncentive.projected.isEligible
            ? 'ring-1 ring-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white'
            : ''
          }
        `}
        onClick={() => setShowSimulator(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center
              ${projectedIncentive && projectedIncentive.projected.isEligible
                ? 'bg-emerald-100'
                : 'bg-slate-100'
              }
            `}>
              <Banknote className={`w-5 h-5
                ${projectedIncentive && projectedIncentive.projected.isEligible
                  ? 'text-emerald-600'
                  : 'text-slate-500'
                }
              `} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                {selectedPeriod === TimePeriod.MTD ? 'Projected Payout' : 'Incentive Simulator'}
              </div>
              <div className={`text-xl font-bold tracking-tight
                ${projectedIncentive && projectedIncentive.projected.isEligible
                  ? 'text-emerald-700'
                  : 'text-slate-800'
                }
              `}>
                {selectedPeriod === TimePeriod.MTD && projectedIncentive
                  ? formatCurrency(projectedIncentive.totalIncentive)
                  : '\u20B90'
                }
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>

        {selectedPeriod === TimePeriod.MTD && projectedIncentive && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                SI Progress {'\u2022'} {daysElapsedInMonth}/{totalDaysInMonth} days
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
                ${projectedIncentive.projected.isEligible
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
                }
              `}>
                {Math.round(projectedIncentive.projected.siAchievementPercent)}%
              </span>
            </div>
            {/* Mini progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700
                  ${projectedIncentive.projected.isEligible
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                  }
                `}
                style={{ width: `${Math.min(projectedIncentive.projected.siAchievementPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Targets Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Targets</h2>
          <span className="text-[11px] font-medium text-indigo-600">View all</span>
        </div>
        <div className="space-y-3">
          <TargetCard title="Stock-in" target={getConfigSITarget('KAM')} achieved={data.stockIns} unit="units" />
          <TargetCard title="I2SI%" target={getConfigI2SITarget('KAM')} achieved={data.i2si} unit="%" inverse />
          <TargetCard title="DCF Disbursement" target={25} achieved={data.dcfDisbursals} unit="loans" />
        </div>
      </div>

      {/* Input Metrics Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Input Metrics</h2>
        </div>

        <div className="space-y-3">
          {/* Visits Card */}
          <div className="card-premium p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="text-[13px] font-semibold text-slate-700">Visits</h3>
              </div>
              <span className="text-xl font-bold text-slate-900">
                {data.visits.top + data.visits.tagged + data.visits.untagged}
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Top Dealers', value: data.visits.top, color: 'bg-violet-500' },
                { label: 'Tagged Dealers', value: data.visits.tagged, color: 'bg-blue-500' },
                { label: 'Untagged/GMB', value: data.visits.untagged, color: 'bg-amber-500' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-500 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${row.color}`} />
                    {row.label}
                  </span>
                  <span className="font-medium text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Unique dealers visited</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {metrics.uniqueDealersVisited}
              </span>
            </div>
          </div>

          {/* Connects Card */}
          <div className="card-premium p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-sky-600" />
                </div>
                <h3 className="text-[13px] font-semibold text-slate-700">Connects</h3>
              </div>
              <span className="text-xl font-bold text-slate-900">
                {data.connects.top + data.connects.tagged}
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Top Dealers', value: data.connects.top, color: 'bg-violet-500' },
                { label: 'Tagged Dealers', value: data.connects.tagged, color: 'bg-blue-500' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-500 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${row.color}`} />
                    {row.label}
                  </span>
                  <span className="font-medium text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>Calls: {metrics.totalCalls}</span>
                <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                <span>Connected: {metrics.connectedCalls}</span>
              </div>
            </div>
          </div>

          {/* Input Score Card */}
          <InputScoreCard
            data={{
              visits: metrics.completedVisits, targetVisits: 8, connects: metrics.connectedCalls, targetConnects: 60,
              avgInspectingDealers: metrics.uniqueDealersVisited, targetInspectingDealers: 3,
              uniqueRaisePercent: data.uniqueRaise, targetUniqueRaise: 75,
              raiseQuality: metrics.callConnectRate / 100, hbtpValue: 1.0, targetQualityRatio: 0.85,
            }}
            targetScore={85}
            mode="KAM"
          />

          {/* Inspecting Dealers */}
          <MetricCard
            title="Daily Inspecting Dealers"
            value={data.avgInspectingDealers.toFixed(1)}
            subtitle={selectedPeriod === TimePeriod.MTD ? 'Avg MTD' : selectedPeriod === TimePeriod.TODAY ? 'Today' : selectedPeriod === TimePeriod.D_MINUS_1 ? 'Yesterday' : 'Avg Last Month'}
            trend={{
              direction: data.avgInspectingDealers >= 3 ? 'up' : 'down',
              value: data.avgInspectingDealers >= 3 ? '+0.3' : '-0.2'
            }}
            targetConfig={{
              target: 3, currentValue: data.avgInspectingDealers,
              comparisonType: 'greater-or-equal', targetLabel: 'Target: 3+ per day',
              showStatusBadge: true,
            }}
            onClick={() => setShowInspectingDealersDetail(true)}
          />
        </div>
      </div>

      {/* Inspecting Dealers Detail Bottom Sheet */}
      {showInspectingDealersDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="sticky top-0 bg-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">Daily Inspecting Dealers</h3>
              <button
                onClick={() => setShowInspectingDealersDetail(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="px-5 pb-6 space-y-4">
              {/* Status card */}
              <div className={`rounded-2xl p-4
                ${data.avgInspectingDealers >= 3
                  ? 'bg-emerald-50 border border-emerald-100'
                  : 'bg-rose-50 border border-rose-100'
                }
              `}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-slate-600">Current Average</span>
                  <span className={`text-2xl font-bold
                    ${data.avgInspectingDealers >= 3 ? 'text-emerald-700' : 'text-rose-700'}
                  `}>
                    {data.avgInspectingDealers.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-slate-600">Target</span>
                  <span className="font-semibold text-slate-800">3.0</span>
                </div>
              </div>

              {/* Action card */}
              <div
                className={`card-premium p-4 ${data.avgInspectingDealers < 3 ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                onClick={() => {
                  if (data.avgInspectingDealers < 3 && onNavigateToDealers) {
                    onNavigateToDealers('Dormant', 'daily-inspecting-dealers');
                    setShowInspectingDealersDetail(false);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {data.avgInspectingDealers >= 3 ? (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-800 mb-1">Great job!</div>
                        <div className="text-[12px] text-slate-500 leading-relaxed">
                          You're inspecting {data.avgInspectingDealers.toFixed(1)} dealers/day, above target. Keep it up!
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-slate-800 mb-1">Below target</div>
                        <div className="text-[12px] text-slate-500 leading-relaxed mb-2">
                          At {data.avgInspectingDealers.toFixed(1)}/day. Activate dormant dealers to reach 3+.
                        </div>
                        {onNavigateToDealers && (
                          <span className="text-[12px] text-indigo-600 font-medium flex items-center gap-1">
                            View dormant dealers <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Output Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Output Metrics</h2>
        </div>

        <div className="space-y-4">
          {/* Top of Funnel */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Top of Funnel
            </h3>
            <div className="space-y-3">
              {(() => {
                const currentDay = daysElapsedInMonth;
                const totalDays = totalDaysInMonth;
                const currentInspections = data.inspections;
                const projectedInspections = selectedPeriod === TimePeriod.MTD
                  ? projectToEOM(currentInspections, currentDay, totalDays)
                  : currentInspections;
                const inspectionsForRAG = selectedPeriod === TimePeriod.MTD ? projectedInspections : currentInspections;
                const ragStatus = getI2SIRAG(inspectionsForRAG, targets.inspections);
                const subtitle = selectedPeriod === TimePeriod.MTD
                  ? `${currentInspections} current, ~${projectedInspections} projected \u2022 Target: ${targets.inspections}`
                  : `${selectedPeriod === TimePeriod.TODAY ? 'Today' : selectedPeriod === TimePeriod.D_MINUS_1 ? 'Yesterday' : 'Last Month'} \u2022 Target: ${targets.inspections}`;

                return (
                  <MetricCard
                    title="Inspections"
                    value={currentInspections.toString()}
                    subtitle={subtitle}
                    trend={{ direction: 'up', value: '18%' }}
                    status={ragStatus}
                    clickable
                    expanded={expandedInspections}
                    onExpandToggle={() => setExpandedInspections(!expandedInspections)}
                    expandedContent={
                      <div className="space-y-3 pt-3">
                        {selectedPeriod === TimePeriod.MTD && (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <div className="text-[11px] font-semibold text-amber-800 mb-1">Projection</div>
                            <div className="text-[12px] text-slate-600 leading-relaxed">
                              Based on {currentInspections} in {currentDay} days, projected ~{projectedInspections} by EOM (target: {targets.inspections}).
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-slate-500">Inspecting dealers</span>
                            <span className="font-medium text-slate-800">{inspectionsBreakdown.inspectingDealers}</span>
                          </div>
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-slate-500">Per dealer avg</span>
                            <span className="font-medium text-slate-800">{inspectionsBreakdown.inspectionsPerDealer}</span>
                          </div>
                        </div>
                      </div>
                    }
                  />
                );
              })()}

              <MetricCard
                title="I2SI%"
                value={`${data.i2si}%`}
                subtitle={`Inspection to SI \u2022 Target: ${targets.i2si}%`}
                trend={{ direction: data.i2si >= targets.i2si ? 'up' : 'down', value: '3%' }}
                status={getI2SIRAG(data.i2si, targets.i2si)}
                clickable
                expanded={expandedI2SI}
                onExpandToggle={() => setExpandedI2SI(!expandedI2SI)}
                expandedContent={
                  <div className="space-y-3 pt-3">
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Channel-wise</div>
                    <div className="space-y-2">
                      <MetricRow label="GS I2SI%" subtitle="Target: 15%" value={i2siBreakdown.gsI2SI} target={15} state={getMetricColorState(i2siBreakdown.gsI2SI, 15)} />
                      <MetricRow label="NGS I2SI%" subtitle="Target: 16%" value={i2siBreakdown.ngsI2SI} target={16} state={getMetricColorState(i2siBreakdown.ngsI2SI, 16)} />
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">DCF & Telecalling</div>
                      <div className="space-y-2">
                        <MetricRow label="DCF I2T%" subtitle="Target: 30%" value={i2siBreakdown.dcfI2T} target={30} state={getMetricColorState(i2siBreakdown.dcfI2T, 30)} />
                        <MetricRow label="T2SI%" subtitle="Target: 75%" value={i2siBreakdown.t2SI} target={75} state={getMetricColorState(i2siBreakdown.t2SI, 75)} />
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Bottom of Funnel */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Bottom of Funnel
            </h3>
            <div className="space-y-3">
              <MetricCard
                title="Quality %"
                value={`${data.quality}%`}
                subtitle="Offers vs TP &#8226; Lower is better &#8226; Target &#8804; 85%"
                trend={{ direction: data.quality <= 85 ? 'down' : 'up', value: '2%' }}
                status={getQualityRAG(data.quality)}
                clickable
                expanded={expandedQuality}
                onExpandToggle={() => setExpandedQuality(!expandedQuality)}
                expandedContent={
                  <div className="space-y-3 pt-3">
                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
                      <div className="text-[12px] text-slate-600 leading-relaxed">
                        Quality% = offers to HBTP ratio. Lower = healthier margins. Target &#8804; 85%.
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-500">Offers in TP band</span>
                        <span className="font-medium text-slate-800">{data.quality}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-500">Target</span>
                        <span className={`font-medium ${data.quality <= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>&#8804; 85%</span>
                      </div>
                    </div>
                  </div>
                }
              />
              <MetricCard
                title="A2C% (Accepted to Converted)"
                value={`${data.a2c}%`}
                subtitle={`Stock-in rate \u2022 Target: ${targets.a2c}%`}
                trend={{ direction: data.a2c >= targets.a2c ? 'up' : 'down', value: '7%' }}
                status={getI2SIRAG(data.a2c, targets.a2c)}
                clickable
              />
              <MetricCard
                title="Unique Raise%"
                value={`${data.uniqueRaise}%`}
                subtitle="Target: 75%+"
                trend={{ direction: data.uniqueRaise >= 75 ? 'up' : 'down', value: data.uniqueRaise >= 75 ? '+3%' : '-2%' }}
                status={getUniqueRaiseRAG(data.uniqueRaise)}
                clickable
                expanded={expandedUniqueRaise}
                onExpandToggle={() => setExpandedUniqueRaise(!expandedUniqueRaise)}
                expandedContent={
                  <div className="space-y-3 pt-3">
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Channel-wise</div>
                    <div className="space-y-2">
                      {[
                        { label: 'GS', value: uniqueRaiseBreakdown.gsUniqueRaise },
                        { label: 'NGS', value: uniqueRaiseBreakdown.ngsUniqueRaise },
                        { label: 'DCF', value: uniqueRaiseBreakdown.dcfUniqueRaise },
                      ].map((ch) => (
                        <div key={ch.label} className="flex items-center justify-between text-[13px]">
                          <span className="text-slate-500">{ch.label} Unique Raise%</span>
                          <span className="font-medium text-slate-800">{ch.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              />

              {/* DCF CTA */}
              <button className="w-full card-premium p-3.5 active:scale-[0.99] transition-all duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-[13px] font-semibold text-indigo-700">View DCF Performance</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
