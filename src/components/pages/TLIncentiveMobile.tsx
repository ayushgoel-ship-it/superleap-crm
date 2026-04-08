import { useState, useMemo } from 'react';
import { ArrowLeft, Calculator, Lock, Unlock, Target, DollarSign, Percent, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { computeTLOverview, computeKAMMetrics, getMonthProgress, projectToEOM } from '../../lib/metrics/metricsFromDB';
import { TimePeriod } from '../../lib/domain/constants';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';
import { calculateActualProjectedIncentive, simulateIncentiveWhatIf, type IncentiveContext, type DCFIncentiveMetrics } from '../../lib/incentiveEngine';
import { getSITarget } from '../../lib/metricsEngine';
import { getRuntimeDBSync } from '../../data/runtimeDB';

interface TLIncentiveMobileProps {
  onBack: () => void;
}

type View = 'dashboard' | 'simulator';

export function TLIncentiveMobile({ onBack }: TLIncentiveMobileProps) {
  const [timeScope, setTimeScope] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showGatesDetail, setShowGatesDetail] = useState(false);

  const period = timeScope;

  const { tlData, gates, allGatesPassed, incentiveResult } = useMemo(() => {
    const overview = computeTLOverview(period);
    const monthCtx = getMonthProgress();
    const siTarget = getSITarget('TL');
    const i2siTarget = overview.teamI2SITarget;
    const inputScoreGate = 70;

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

    const kamMetricsList = computeKAMMetrics(period);
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

    const i2siPassed = overview.teamI2SI >= i2siTarget;
    const inputScorePassed = overview.teamAvgInputScore >= inputScoreGate;
    const activeDealerCount = (db.dealers || []).filter(d => d.status === 'active').length;
    const activeDealersPassed = activeDealerCount >= 25;

    const gatesArr = [
      { name: 'I2SI% Gate', condition: `≥ ${i2siTarget}%`, actual: `${overview.teamI2SI}%`, status: (i2siPassed ? 'passed' : 'failed') as 'passed' | 'failed' },
      { name: 'Input Score Gate', condition: `≥ ${inputScoreGate}`, actual: `${overview.teamAvgInputScore}`, status: (inputScorePassed ? 'passed' : 'failed') as 'passed' | 'failed' },
      { name: 'Active Dealers Gate', condition: '≥ 25', actual: `${activeDealerCount}`, status: (activeDealersPassed ? 'passed' : 'failed') as 'passed' | 'failed' },
    ];

    const dcfGMVLakhs = overview.dcfGMV;
    const dcfGMVTarget = overview.dcfGMVTarget;

    const data = {
      name: db.org?.tls?.[0]?.name || 'Team Lead',
      region: db.org?.tls?.[0]?.region || '',
      totalPotentialIncentive: result.breakup.totalBeforeScore,
      eligibleIncentive: result.totalIncentive,
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
      allGatesPassed: gatesArr.every(g => g.status === 'passed'),
      incentiveResult: result,
    };
  }, [period]);

  if (currentView === 'simulator') {
    return <TLIncentiveSimulatorMobile tlData={tlData} gates={gates} onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg text-gray-900">Incentive (TL)</h1>
              <div className="text-sm text-gray-500">{tlData.name} {tlData.region ? `• ${tlData.region}` : ''}</div>
            </div>
          </div>

          {/* Period Selector */}
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs opacity-90 mb-1">Eligible Incentive</div>
              <div className="text-3xl">₹{(tlData.eligibleIncentive / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div className="text-xs opacity-90 mb-1">Potential Incentive</div>
              <div className="text-3xl">₹{(tlData.totalPotentialIncentive / 1000).toFixed(0)}K</div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            {allGatesPassed ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Unlock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium">Gates: All Met</div>
                  <div className="text-xs opacity-75">Full incentive unlocked</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium">Gates Blocked ({gates.filter(g => g.status === 'failed').length} failed)</div>
                  <div className="text-xs opacity-75">Incentive currently locked</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Target vs Achieved List */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-gray-900 mb-4">Target vs Achieved</h2>
          <div className="space-y-4">
            {/* Stock-ins */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Stock-ins</span>
                <span className="text-sm text-gray-900">
                  {tlData.teamStockIns} / {tlData.teamStockInsTarget}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(tlData.teamStockInsTarget > 0 ? (tlData.teamStockIns / tlData.teamStockInsTarget) * 100 : 0, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {tlData.teamStockInsTarget > 0 ? ((tlData.teamStockIns / tlData.teamStockInsTarget) * 100).toFixed(0) : 0}% achieved
              </div>
            </div>

            {/* DCF Disbursals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">DCF Disbursals</span>
                <span className="text-sm text-gray-900">
                  ₹{(tlData.teamDCFDisbursals / 100000).toFixed(1)}L / ₹{(tlData.teamDCFTarget / 100000).toFixed(1)}L
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(tlData.teamDCFTarget > 0 ? (tlData.teamDCFDisbursals / tlData.teamDCFTarget) * 100 : 0, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {tlData.teamDCFTarget > 0 ? ((tlData.teamDCFDisbursals / tlData.teamDCFTarget) * 100).toFixed(0) : 0}% achieved
              </div>
            </div>

            {/* Input Score - GATE */}
            {(() => {
              const inputPassed = tlData.teamInputScore >= tlData.teamInputScoreTarget;
              return (
                <div className={`border rounded-lg p-3 ${inputPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      Input Score
                      <span className={`px-2 py-0.5 rounded text-xs ${inputPassed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>Gate: {tlData.teamInputScoreTarget}</span>
                    </span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${inputPassed ? 'text-green-700' : 'text-red-700'}`}>
                      {tlData.teamInputScore}
                      {inputPassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* I2SI% - GATE */}
            {(() => {
              const i2siPassed = tlData.teamI2SI >= tlData.teamI2SIGate;
              return (
                <div className={`border rounded-lg p-3 ${i2siPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      I2SI%
                      <span className={`px-2 py-0.5 rounded text-xs ${i2siPassed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>Gate: {tlData.teamI2SIGate}%</span>
                    </span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${i2siPassed ? 'text-green-700' : 'text-red-700'}`}>
                      {tlData.teamI2SI}%
                      {i2siPassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${i2siPassed ? 'bg-green-600' : 'bg-red-600'}`}
                      style={{ width: `${Math.min((tlData.teamI2SI / Math.max(tlData.teamI2SIGate, 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className={`text-xs mt-1 ${i2siPassed ? 'text-green-700' : 'text-red-700'}`}>
                    {i2siPassed ? 'Gate threshold met' : 'Below gate threshold'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Gates Detail (Collapsible) */}
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            onClick={() => setShowGatesDetail(!showGatesDetail)}
            className="w-full p-4 flex items-center justify-between"
          >
            <span className="text-gray-900">Gate Details</span>
            {showGatesDetail ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showGatesDetail && (
            <div className="px-4 pb-4 space-y-3">
              {gates.map((gate, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 ${
                    gate.status === 'passed'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{gate.name}</span>
                    {gate.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Condition: {gate.condition}</span>
                    <span className={gate.status === 'passed' ? 'text-green-700' : 'text-red-700'}>
                      Actual: {gate.actual}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Simulator Button */}
        <button
          onClick={() => setCurrentView('simulator')}
          className="w-full px-4 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Calculator className="w-5 h-5" />
          Open Simulator
        </button>
      </div>
    </div>
  );
}

// Simulator Mobile Component — uses real incentive engine
function TLIncentiveSimulatorMobile({ tlData, gates, onBack }: { tlData: any; gates: any[]; onBack: () => void }) {
  const monthCtx = getMonthProgress();
  const siTarget = tlData.teamStockInsTarget;

  // Project EOM defaults
  const projectedSI = projectToEOM(tlData.teamStockIns, monthCtx.daysElapsed, monthCtx.totalDays);
  const projectedDCF = projectToEOM(tlData.teamDCFDisbursals, monthCtx.daysElapsed, monthCtx.totalDays);

  const [whatIfSI, setWhatIfSI] = useState(projectedSI);
  const [whatIfDCF, setWhatIfDCF] = useState(Math.round(projectedDCF / 100000)); // in lakhs
  const [whatIfI2SI, setWhatIfI2SI] = useState(tlData.teamI2SI);

  // Simulate using the real incentive engine
  const simulation = useMemo(() => {
    return simulateIncentiveWhatIf({
      role: 'TL',
      projectedSI: whatIfSI,
      inspections: whatIfI2SI > 0 ? Math.round((whatIfSI / whatIfI2SI) * 100) : 0,
      dcf: {
        onboarding: 0,
        gmvTotal: whatIfDCF * 100000,
        gmvFirst: 0,
      },
      inputScore: tlData.teamInputScore,
    });
  }, [whatIfSI, whatIfDCF, whatIfI2SI, tlData.teamInputScore]);

  const i2siGateMet = whatIfI2SI >= tlData.teamI2SIGate;
  const inputScoreGateMet = tlData.teamInputScore >= tlData.teamInputScoreTarget;
  const allProjectedGatesMet = i2siGateMet && inputScoreGateMet;

  const projectedIncentive = allProjectedGatesMet ? simulation.totalIncentive : 0;
  const currentIncentive = tlData.eligibleIncentive;
  const incentiveDelta = projectedIncentive - currentIncentive;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg text-gray-900">Incentive Simulator</h1>
              <div className="text-sm text-gray-500">What-if scenarios</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Projected Incentive Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
          <div className="mb-3">
            <div className="text-sm opacity-90 mb-1">Projected Incentive</div>
            <div className="text-4xl mb-2">₹{(projectedIncentive / 1000).toFixed(0)}K</div>
            <div className="flex items-center gap-2">
              {incentiveDelta > 0 ? (
                <>
                  <TrendingUp className="w-5 h-5 text-green-300" />
                  <span className="text-green-300">+₹{(incentiveDelta / 1000).toFixed(0)}K vs current</span>
                </>
              ) : incentiveDelta < 0 ? (
                <span className="text-red-300">-₹{Math.abs(incentiveDelta / 1000).toFixed(0)}K vs current</span>
              ) : (
                <span className="text-white/75">No change from current</span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/20">
            {allProjectedGatesMet ? (
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-green-300" />
                <span className="text-sm">All gates will be met!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-300" />
                <span className="text-sm">Gates remain blocked</span>
              </div>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-gray-900 mb-4">Adjust Performance</h2>

          {/* Projected Stock-ins */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <Target className="w-4 h-4 text-blue-600" />
                Projected Stock-ins
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWhatIfSI(Math.max(0, whatIfSI - 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-lg text-gray-900 w-12 text-center">{whatIfSI}</span>
                <button
                  onClick={() => setWhatIfSI(Math.min(500, whatIfSI + 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              value={whatIfSI}
              onChange={(e) => setWhatIfSI(parseInt(e.target.value))}
              min="0"
              max={Math.max(siTarget * 2, whatIfSI + 20)}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Target: {siTarget} • Achievement: {siTarget > 0 ? Math.round((whatIfSI / siTarget) * 100) : 0}%
            </div>
          </div>

          {/* DCF GMV */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                DCF GMV (₹ Lakhs)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWhatIfDCF(Math.max(0, whatIfDCF - 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-lg text-gray-900 w-12 text-center">{whatIfDCF}</span>
                <button
                  onClick={() => setWhatIfDCF(whatIfDCF + 1)}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              value={whatIfDCF}
              onChange={(e) => setWhatIfDCF(parseInt(e.target.value))}
              min="0"
              max="200"
              className="w-full"
            />
          </div>

          {/* I2SI Improvement */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <Percent className="w-4 h-4 text-purple-600" />
                Expected I2SI%
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWhatIfI2SI(Math.max(0, whatIfI2SI - 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-lg text-gray-900 w-12 text-center">{whatIfI2SI}%</span>
                <button
                  onClick={() => setWhatIfI2SI(Math.min(100, whatIfI2SI + 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              value={whatIfI2SI}
              onChange={(e) => setWhatIfI2SI(parseInt(e.target.value))}
              min="0"
              max="100"
              className="w-full"
            />
            <div className={`text-xs mt-1 ${whatIfI2SI >= tlData.teamI2SIGate ? 'text-green-600' : 'text-red-600'}`}>
              {whatIfI2SI >= tlData.teamI2SIGate ? `Gate will be met (${tlData.teamI2SIGate}% required)` : `Below gate (${tlData.teamI2SIGate}% required)`}
            </div>
          </div>
        </div>

        {/* Gate Status Chips */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm text-gray-600 mb-3">Projected Gate Status</h3>
          <div className="flex flex-wrap gap-2">
            <div className={`flex-1 px-3 py-2 rounded-lg border ${
              i2siGateMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="text-xs text-gray-600 mb-1">I2SI%</div>
              <div className={`text-sm font-medium ${i2siGateMet ? 'text-green-700' : 'text-red-700'}`}>
                {i2siGateMet ? 'Pass' : 'Fail'}
              </div>
            </div>
            <div className={`flex-1 px-3 py-2 rounded-lg border ${
              inputScoreGateMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="text-xs text-gray-600 mb-1">Input Score</div>
              <div className={`text-sm font-medium ${inputScoreGateMet ? 'text-green-700' : 'text-red-700'}`}>
                {inputScoreGateMet ? 'Pass' : 'Fail'}
              </div>
            </div>
          </div>
        </div>

        {/* Insight */}
        {simulation.nextActionTips.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-900 mb-1">Scenario Insight</h3>
                <p className="text-sm text-amber-800">
                  {simulation.nextActionTips[0].message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={() => {
            setWhatIfSI(projectedSI);
            setWhatIfDCF(Math.round(projectedDCF / 100000));
            setWhatIfI2SI(tlData.teamI2SI);
          }}
          className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reset to Projected Values
        </button>
      </div>
    </div>
  );
}
