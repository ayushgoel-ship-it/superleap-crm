import { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, Lock, Unlock, Users, Target, DollarSign, Percent, AlertTriangle, CheckCircle2, ChevronRight, Calculator } from 'lucide-react';
import { TLIncentiveSimulator } from './TLIncentiveSimulator';
import { computeTLOverview, computeKAMMetrics } from '../../lib/metrics/metricsFromDB';
import { TimePeriod } from '../../lib/domain/constants';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';
import { calculateActualProjectedIncentive, type IncentiveContext, type DCFIncentiveMetrics } from '../../lib/incentiveEngine';
import { getSITarget, projectMTDToEOM } from '../../lib/metricsEngine';
import { getMonthProgress } from '../../lib/metrics/metricsFromDB';
import { getRuntimeDBSync } from '../../data/runtimeDB';

interface TLIncentiveDashboardProps {
  onBack: () => void;
}

export function TLIncentiveDashboard({ onBack }: TLIncentiveDashboardProps) {
  const [timeScope, setTimeScope] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();
  const [showSimulator, setShowSimulator] = useState(false);

  const period = timeScope;

  // Compute all data from backend
  const { tlData, gates, kamRows, incentiveResult, allGatesPassed } = useMemo(() => {
    const overview = computeTLOverview(period);
    const kamMetricsList = computeKAMMetrics(period);
    const monthCtx = getMonthProgress();
    const siTarget = getSITarget('TL');
    const i2siTarget = overview.teamI2SITarget;
    const inputScoreGate = 70;

    // DCF data for incentive calc
    const db = getRuntimeDBSync();
    const dcfLeads = db.dcfLeads || [];
    const disbursedLeads = dcfLeads.filter(d => d.disbursalDate || d.overallStatus === 'disbursed');
    const gmvTotal = disbursedLeads.reduce((sum, d) => sum + (d.loanAmount || 0), 0);
    const firstDisbursements = dcfLeads.filter(d => {
      const dealerDcf = dcfLeads.filter(dl => dl.dealerId === d.dealerId);
      return dealerDcf.length === 1 && (d.disbursalDate || d.overallStatus === 'disbursed');
    });
    const gmvFirst = firstDisbursements.reduce((sum, d) => sum + (d.loanAmount || 0), 0);
    const onboardingCount = new Set(dcfLeads.map(d => d.dealerId)).size;

    const dcfMetrics: DCFIncentiveMetrics = {
      onboardingCount,
      gmvTotal,
      gmvFirstDisbursement: gmvFirst,
      dealerCount: onboardingCount,
    };

    // Calculate incentive
    const ctx: IncentiveContext = {
      role: 'TL',
      siActualMTD: overview.teamStockIns,
      siTarget,
      inspectionsMTD: kamMetricsList.reduce((s, k) => s + k.inspections, 0),
      daysElapsed: monthCtx.daysElapsed,
      totalDaysInMonth: monthCtx.totalDays,
      inputScore: overview.teamAvgInputScore,
      dcf: dcfMetrics,
    };
    const result = calculateActualProjectedIncentive(ctx);

    // Gate evaluation
    const i2siPassed = overview.teamI2SI >= i2siTarget;
    const inputScorePassed = overview.teamAvgInputScore >= inputScoreGate;
    const activeDealerCount = (db.dealers || []).filter(d => d.status === 'active').length;
    const activeDealersPassed = activeDealerCount >= 25;

    const gatesArr = [
      { name: 'I2SI% Gate', condition: `≥ ${i2siTarget}%`, actual: `${overview.teamI2SI}%`, status: (i2siPassed ? 'passed' : 'failed') as 'passed' | 'failed', description: `Team average I2SI must be at least ${i2siTarget}%` },
      { name: 'Input Score Gate', condition: `≥ ${inputScoreGate}`, actual: `${overview.teamAvgInputScore}`, status: (inputScorePassed ? 'passed' : 'failed') as 'passed' | 'failed', description: `Team average Input Score must be at least ${inputScoreGate}` },
      { name: 'Active Dealers Gate', condition: '≥ 25', actual: `${activeDealerCount}`, status: (activeDealersPassed ? 'passed' : 'failed') as 'passed' | 'failed', description: 'Minimum active dealers in the month' },
    ];

    // KAM rows with real data
    const rows = kamMetricsList.map(k => {
      const siTarget_kam = getSITarget('KAM');
      const kamDcfLeads = dcfLeads.filter(d => d.kamId === k.kamId);
      const kamDisbursed = kamDcfLeads.filter(d => d.disbursalDate || d.overallStatus === 'disbursed');
      const kamDcfValue = kamDisbursed.reduce((sum, d) => sum + (d.loanAmount || 0), 0);
      const kamDcfTarget = 500000; // from overview targets scaled per KAM
      const i2si = k.inspections > 0 ? Math.round((k.stockIns / k.inspections) * 100) : 0;
      const siPercent = siTarget_kam > 0 ? (k.stockIns / siTarget_kam) * 100 : 0;
      return {
        kamId: k.kamId,
        name: k.kamName,
        city: '',
        stockIns: k.stockIns,
        stockInsTarget: siTarget_kam,
        dcfDisbursals: kamDcfValue,
        dcfTarget: kamDcfTarget,
        i2si,
        inputScore: k.inputScore,
        contribution: 0, // contribution computed from incentive engine if needed
        status: (siPercent >= 80 && k.inputScore >= 50 ? 'on-track' : 'at-risk') as 'on-track' | 'at-risk',
      };
    }).sort((a, b) => b.stockIns - a.stockIns);

    const dcfGMVLakhs = overview.dcfGMV;
    const dcfGMVTarget = overview.dcfGMVTarget;

    const data = {
      name: db.org?.tls?.[0]?.name || 'Team Lead',
      region: db.org?.tls?.[0]?.region || '',
      totalPotentialIncentive: result.breakup.totalBeforeScore,
      eligibleIncentive: result.totalIncentive,
      realizedIncentive: 0,
      teamStockIns: overview.teamStockIns,
      teamStockInsTarget: siTarget,
      teamDCFDisbursals: dcfGMVLakhs * 100000,
      teamDCFTarget: dcfGMVTarget * 100000,
      teamInputScore: overview.teamAvgInputScore,
      teamInputScoreTarget: inputScoreGate,
      teamI2SI: overview.teamI2SI,
      teamI2SIGate: i2siTarget,
    };

    return {
      tlData: data,
      gates: gatesArr,
      kamRows: rows,
      incentiveResult: result,
      allGatesPassed: gatesArr.every(g => g.status === 'passed'),
    };
  }, [period]);

  if (showSimulator) {
    return (
      <TLIncentiveSimulator
        onClose={() => setShowSimulator(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900">Incentive Dashboard – Team Lead</h1>
                <div className="text-sm text-gray-500 mt-1">{tlData.name} {tlData.region ? `• ${tlData.region}` : ''}</div>
              </div>
            </div>
            <button
              onClick={() => setShowSimulator(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Open Simulator
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-3">
            <TimeFilterControl
              mode="chips"
              chipStyle="pill"
              value={timeScope}
              onChange={setTimeScope}
              options={CANONICAL_TIME_OPTIONS}
              labelOverrides={CANONICAL_TIME_LABELS}
              allowCustom
              customFrom={customFrom}
              customTo={customTo}
              onCustomRangeChange={({ fromISO, toISO }) => {
                setCustomFrom(fromISO);
                setCustomTo(toISO);
              }}
            />
            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
              Calculated on team performance & gates (I2SI, Input Score etc.)
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* SECTION A - TL Incentive Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm opacity-90 mb-1">Total Potential Incentive</div>
                <div className="text-4xl mb-2">₹{(tlData.totalPotentialIncentive / 1000).toFixed(0)}K</div>
                <div className="text-xs opacity-75">Based on team targets</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Eligible Incentive</div>
                <div className="text-4xl mb-2">₹{(tlData.eligibleIncentive / 1000).toFixed(0)}K</div>
                <div className="text-xs opacity-75">After applying gates</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Realized / Paid</div>
                <div className="text-4xl mb-2">₹{(tlData.realizedIncentive / 1000).toFixed(0)}K</div>
                <div className="text-xs opacity-75">Month-to-date</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {allGatesPassed ? (
                    <>
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Unlock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">Gates: All Met</div>
                        <div className="text-sm opacity-75">Full incentive unlocked</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">Gates Blocked – {gates.filter(g => g.status === 'failed').map(g => g.name).join(', ')}</div>
                        <div className="text-sm opacity-75">Incentive payout currently blocked</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-right">
                  <div>
                    <div className="text-xs opacity-75">Team Stock-ins</div>
                    <div className="text-lg">{tlData.teamStockIns} / {tlData.teamStockInsTarget}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">Team DCF</div>
                    <div className="text-lg">₹{(tlData.teamDCFDisbursals / 100000).toFixed(1)}L / ₹{(tlData.teamDCFTarget / 100000).toFixed(1)}L</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">Input Score</div>
                    <div className="text-lg">{tlData.teamInputScore} / {tlData.teamInputScoreTarget}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">I2SI%</div>
                    <div className="text-lg">{tlData.teamI2SI}% / {tlData.teamI2SIGate}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B - Target vs Achievement */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg text-gray-900 mb-4">Target vs Achievement (Team Level)</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Team Stock-ins */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-900">Team Stock-ins</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Primary Driver</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl text-gray-900">{tlData.teamStockIns}</span>
                  <span className="text-sm text-gray-500">/ {tlData.teamStockInsTarget}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((tlData.teamStockIns / Math.max(tlData.teamStockInsTarget, 1)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {tlData.teamStockInsTarget > 0 ? ((tlData.teamStockIns / tlData.teamStockInsTarget) * 100).toFixed(0) : 0}% achieved • {Math.max(0, tlData.teamStockInsTarget - tlData.teamStockIns)} needed
                </div>
              </div>

              {/* Team DCF Disbursals */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-gray-900">Team DCF Disbursals</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Primary Driver</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl text-gray-900">₹{(tlData.teamDCFDisbursals / 100000).toFixed(1)}L</span>
                  <span className="text-sm text-gray-500">/ ₹{(tlData.teamDCFTarget / 100000).toFixed(1)}L</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(tlData.teamDCFTarget > 0 ? (tlData.teamDCFDisbursals / tlData.teamDCFTarget) * 100 : 0, 100)}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {tlData.teamDCFTarget > 0 ? ((tlData.teamDCFDisbursals / tlData.teamDCFTarget) * 100).toFixed(0) : 0}% achieved
                </div>
              </div>

              {/* Team I2SI% - GATE */}
              {(() => {
                const i2siPassed = tlData.teamI2SI >= tlData.teamI2SIGate;
                return (
                  <div className={`border-2 rounded-lg p-4 ${i2siPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Percent className={`w-5 h-5 ${i2siPassed ? 'text-green-600' : 'text-red-600'}`} />
                        <span className="text-gray-900">Team I2SI%</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${i2siPassed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {i2siPassed ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        Gate
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl text-gray-900">{tlData.teamI2SI}%</span>
                      <span className="text-sm text-gray-500">/ {tlData.teamI2SIGate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${i2siPassed ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${Math.min((tlData.teamI2SI / Math.max(tlData.teamI2SIGate, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className={`text-sm flex items-center gap-1 ${i2siPassed ? 'text-green-700' : 'text-red-700'}`}>
                      {i2siPassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      I2SI Gate: Min {tlData.teamI2SIGate}% required • Current {tlData.teamI2SI}% ({i2siPassed ? 'Gate passed' : 'Gate failed'})
                    </div>
                  </div>
                );
              })()}

              {/* Team Input Score - GATE */}
              {(() => {
                const inputPassed = tlData.teamInputScore >= tlData.teamInputScoreTarget;
                return (
                  <div className={`border-2 rounded-lg p-4 ${inputPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-5 h-5 ${inputPassed ? 'text-green-600' : 'text-red-600'}`} />
                        <span className="text-gray-900">Team Input Score</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${inputPassed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {inputPassed ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        Gate
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl text-gray-900">{tlData.teamInputScore}</span>
                      <span className="text-sm text-gray-500">/ {tlData.teamInputScoreTarget}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${inputPassed ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${Math.min((tlData.teamInputScore / 100) * 100, 100)}%` }}
                      />
                    </div>
                    <div className={`text-sm flex items-center gap-1 ${inputPassed ? 'text-green-700' : 'text-red-700'}`}>
                      {inputPassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      Input Score Gate: Min {tlData.teamInputScoreTarget} required • Current {tlData.teamInputScore} ({inputPassed ? 'Gate passed' : 'Gate failed'})
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* SECTION C - Gates Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg text-gray-900 mb-4">Incentive Gates</h2>

            {!allGatesPassed && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-900 font-medium">Incentive payout is currently BLOCKED due to gate failures</div>
                  <div className="text-sm text-red-700 mt-1">All gates must be met to unlock full incentive eligibility</div>
                </div>
              </div>
            )}

            {allGatesPassed && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-green-900 font-medium">All gates met. Full incentive is unlocked.</div>
                  <div className="text-sm text-green-700 mt-1">Continue maintaining performance to ensure payout</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {gates.map((gate, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    gate.status === 'passed'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {gate.status === 'passed' ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{gate.name}</div>
                        <div className="text-sm text-gray-600">{gate.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Condition: {gate.condition}</div>
                      <div className={`text-lg font-medium ${
                        gate.status === 'passed' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Actual: {gate.actual}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    gate.status === 'passed' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Status: {gate.status === 'passed' ? 'Passed' : 'Failed'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION D - Team Incentive Breakdown by KAM */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg text-gray-900 mb-4">Team Performance & Incentive Breakdown by KAM</h2>

            {kamRows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No KAM data available for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm text-gray-600">KAM Name</th>
                      <th className="text-left py-3 px-4 text-sm text-gray-600">Stock-ins</th>
                      <th className="text-left py-3 px-4 text-sm text-gray-600">DCF Disbursals</th>
                      <th className="text-left py-3 px-4 text-sm text-gray-600">I2SI%</th>
                      <th className="text-left py-3 px-4 text-sm text-gray-600">Input Score</th>
                      <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kamRows.map((kam, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{kam.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <span className="text-gray-900">{kam.stockIns}</span>
                            <span className="text-gray-500"> / {kam.stockInsTarget}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <span className="text-gray-900">₹{(kam.dcfDisbursals / 100000).toFixed(1)}L</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                            kam.i2si >= 65 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {kam.i2si}%
                            {kam.i2si < 65 && <AlertTriangle className="w-3 h-3" />}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                            kam.inputScore >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {kam.inputScore}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            kam.status === 'on-track'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {kam.status === 'on-track' ? 'On-track' : 'At risk'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {kamRows.some(k => k.status === 'at-risk') && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-900">
                  <strong>Recommendation:</strong> Focus on improving performance for at-risk KAMs to unlock team incentive.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
