import { useState } from 'react';
import { ArrowLeft, Calculator, Lock, Unlock, Target, DollarSign, Percent, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface TLIncentiveMobileProps {
  onBack: () => void;
}

type Period = 'this-month' | 'last-month';
type View = 'dashboard' | 'simulator';

export function TLIncentiveMobile({ onBack }: TLIncentiveMobileProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('this-month');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showGatesDetail, setShowGatesDetail] = useState(false);

  // Sample data
  const tlData = {
    name: 'Ayush Goel',
    region: 'North – Dealer Referral',
    totalPotentialIncentive: 185000,
    eligibleIncentive: 0,
    teamStockIns: 28,
    teamStockInsTarget: 35,
    teamDCFDisbursals: 1800000,
    teamDCFTarget: 2500000,
    teamInputScore: 74,
    teamInputScoreTarget: 70,
    teamI2SI: 62,
    teamI2SIGate: 65,
  };

  const gates = [
    { name: 'I2SI% Gate', condition: '≥ 65%', actual: '62%', status: 'failed' as const },
    { name: 'Input Score Gate', condition: '≥ 70', actual: '74', status: 'passed' as const },
    { name: 'Active Dealers Gate', condition: '≥ 25', actual: '32', status: 'passed' as const },
  ];

  const allGatesPassed = gates.every(g => g.status === 'passed');

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
              <div className="text-sm text-gray-500">{tlData.name} • {tlData.region}</div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('this-month')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedPeriod === 'this-month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedPeriod('last-month')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedPeriod === 'last-month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Last Month
            </button>
          </div>
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
                  <div className="text-sm font-medium">Gates Blocked (I2SI low)</div>
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
                  style={{ width: `${(tlData.teamStockIns / tlData.teamStockInsTarget) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((tlData.teamStockIns / tlData.teamStockInsTarget) * 100).toFixed(0)}% achieved
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
                  style={{ width: `${(tlData.teamDCFDisbursals / tlData.teamDCFTarget) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((tlData.teamDCFDisbursals / tlData.teamDCFTarget) * 100).toFixed(0)}% achieved
              </div>
            </div>

            {/* Input Score - GATE */}
            <div className="border border-green-200 bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  Input Score
                  <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs">Gate: 70</span>
                </span>
                <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                  {tlData.teamInputScore}
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* I2SI% - GATE */}
            <div className="border border-red-200 bg-red-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  I2SI%
                  <span className="px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs">Gate: 65%</span>
                </span>
                <span className="text-sm text-red-700 font-medium flex items-center gap-1">
                  {tlData.teamI2SI}%
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${(tlData.teamI2SI / tlData.teamI2SIGate) * 100}%` }}
                />
              </div>
              <div className="text-xs text-red-700 mt-1 flex items-center gap-1">
                Below gate threshold
              </div>
            </div>
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

// Simulator Mobile Component
function TLIncentiveSimulatorMobile({ tlData, gates, onBack }: { tlData: any; gates: any[]; onBack: () => void }) {
  const [extraStockIns, setExtraStockIns] = useState(0);
  const [extraDCF, setExtraDCF] = useState(0);
  const [i2siImprovement, setI2siImprovement] = useState(tlData.teamI2SI);

  // Calculate projected values
  const projectedStockIns = tlData.teamStockIns + extraStockIns;
  const projectedDCF = tlData.teamDCFDisbursals + (extraDCF * 100000);
  const projectedI2SI = i2siImprovement;

  // Calculate projected incentive
  const stockInsProgress = Math.min(projectedStockIns / tlData.teamStockInsTarget, 1);
  const dcfProgress = Math.min(projectedDCF / tlData.teamDCFTarget, 1);
  const baseIncentive = tlData.totalPotentialIncentive * ((stockInsProgress + dcfProgress) / 2);

  const i2siGateMet = projectedI2SI >= tlData.teamI2SIGate;
  const inputScoreGateMet = tlData.teamInputScore >= tlData.teamInputScoreTarget;
  const allProjectedGatesMet = i2siGateMet && inputScoreGateMet;

  const projectedIncentive = allProjectedGatesMet ? baseIncentive : 0;
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

          {/* Extra Stock-ins */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <Target className="w-4 h-4 text-blue-600" />
                Extra Stock-ins
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExtraStockIns(Math.max(0, extraStockIns - 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-lg text-gray-900 w-12 text-center">{extraStockIns}</span>
                <button
                  onClick={() => setExtraStockIns(Math.min(50, extraStockIns + 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              value={extraStockIns}
              onChange={(e) => setExtraStockIns(parseInt(e.target.value))}
              min="0"
              max="50"
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Projected: {projectedStockIns} / {tlData.teamStockInsTarget}
            </div>
          </div>

          {/* Extra DCF */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                Extra DCF (₹ Lakhs)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExtraDCF(Math.max(0, extraDCF - 0.5))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-lg text-gray-900 w-12 text-center">{extraDCF.toFixed(1)}</span>
                <button
                  onClick={() => setExtraDCF(Math.min(20, extraDCF + 0.5))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              value={extraDCF}
              onChange={(e) => setExtraDCF(parseFloat(e.target.value))}
              min="0"
              max="20"
              step="0.5"
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Projected: ₹{(projectedDCF / 100000).toFixed(1)}L / ₹{(tlData.teamDCFTarget / 100000).toFixed(1)}L
            </div>
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
                  onClick={() => setI2siImprovement(Math.max(50, i2siImprovement - 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-lg text-gray-900 w-12 text-center">{i2siImprovement}%</span>
                <button
                  onClick={() => setI2siImprovement(Math.min(80, i2siImprovement + 1))}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              value={i2siImprovement}
              onChange={(e) => setI2siImprovement(parseInt(e.target.value))}
              min="50"
              max="80"
              className="w-full"
            />
            <div className={`text-xs mt-1 ${i2siImprovement >= tlData.teamI2SIGate ? 'text-green-600' : 'text-red-600'}`}>
              {i2siImprovement >= tlData.teamI2SIGate ? `✓ Gate will be met (${tlData.teamI2SIGate}% required)` : `Below gate (${tlData.teamI2SIGate}% required)`}
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
                {i2siGateMet ? '✓ Pass' : '✗ Fail'}
              </div>
            </div>
            <div className="flex-1 px-3 py-2 rounded-lg border border-green-200 bg-green-50">
              <div className="text-xs text-gray-600 mb-1">Input Score</div>
              <div className="text-sm font-medium text-green-700">✓ Pass</div>
            </div>
            <div className="flex-1 px-3 py-2 rounded-lg border border-green-200 bg-green-50">
              <div className="text-xs text-gray-600 mb-1">Active Dealers</div>
              <div className="text-sm font-medium text-green-700">✓ Pass</div>
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">Scenario Insight</h3>
              <p className="text-sm text-amber-800">
                {allProjectedGatesMet && incentiveDelta > 0
                  ? `Adding +${extraStockIns} stock-ins, ₹${extraDCF}L DCF, and improving I2SI to ${i2siImprovement}% will increase incentive by ₹${(incentiveDelta / 1000).toFixed(0)}K.`
                  : allProjectedGatesMet
                  ? `All gates will be met. Incentive unlocked at ₹${(projectedIncentive / 1000).toFixed(0)}K.`
                  : `Focus on improving I2SI% to ${tlData.teamI2SIGate}% to unlock incentive.`}
              </p>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            setExtraStockIns(0);
            setExtraDCF(0);
            setI2siImprovement(tlData.teamI2SI);
          }}
          className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reset to Current Values
        </button>
      </div>
    </div>
  );
}
