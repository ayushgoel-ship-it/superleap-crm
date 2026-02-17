import { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Info, Lock, Unlock, Calendar, TrendingUp, Zap, Target, Lightbulb } from 'lucide-react';
import { 
  calculateActualProjectedIncentive,
  simulateIncentiveWhatIf,
  type IncentiveContext,
  type WhatIfSimulationInput,
  getIncentiveSummary
} from '../../lib/incentiveEngine';
import { getSITarget } from '../../lib/metricsEngine';

interface KAMIncentiveSimulatorProps {
  onClose: () => void;
}

export function KAMIncentiveSimulator({ onClose }: KAMIncentiveSimulatorProps) {
  // Mode toggle state: Auto Projection (default, read-only) vs What-If Simulator (editable)
  const [simulatorMode, setSimulatorMode] = useState<'auto' | 'whatif'>('auto');

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState({
    breakup: true,
    benchmarks: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get current date info for projection calculation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysElapsed = currentDay;

  // Targets (from engine)
  const siTarget = getSITarget('KAM');
  const incentiveSummary = getIncentiveSummary('KAM');

  // Current MTD values (used ONLY for Auto Projection - READ ONLY)
  const mtdValues = {
    si: 12, // Current SI MTD
    inspections: 80, // Current inspections MTD
    gmvTotal: 500000, // Total GMV
    gmvFirstDisbursement: 200000, // First disbursement GMV
    onboarding: 5, // DCF dealers onboarded
    score: 82, // KAM Score (0-100)
  };

  // What-If mode: Manual month-end expected values (EDITABLE - ONLY SOURCE FOR WHAT-IF)
  const [whatIfInputs, setWhatIfInputs] = useState({
    expectedSI: 22,
    expectedInspections: 140,
    expectedGMVTotal: 800000,
    expectedGMVFirst: 300000,
    expectedOnboarding: 8,
    score: 82,
  });

  // ==================== AUTO PROJECTION USING ENGINE ====================
  const autoContext: IncentiveContext = {
    role: 'KAM',
    siActualMTD: mtdValues.si,
    siTarget,
    inspectionsMTD: mtdValues.inspections,
    daysElapsed,
    totalDaysInMonth: daysInMonth,
    inputScore: mtdValues.score,
    dcf: {
      onboardingCount: mtdValues.onboarding,
      gmvTotal: mtdValues.gmvTotal,
      gmvFirstDisbursement: mtdValues.gmvFirstDisbursement,
      dealerCount: mtdValues.onboarding,
    },
  };

  const autoResult = calculateActualProjectedIncentive(autoContext);

  // ==================== WHAT-IF USING ENGINE ====================
  const whatIfContext: WhatIfSimulationInput = {
    role: 'KAM',
    projectedSI: whatIfInputs.expectedSI,
    inspections: whatIfInputs.expectedInspections,
    dcf: {
      onboarding: whatIfInputs.expectedOnboarding,
      gmvTotal: whatIfInputs.expectedGMVTotal,
      gmvFirst: whatIfInputs.expectedGMVFirst,
    },
    inputScore: whatIfInputs.score,
  };

  const whatIfResult = simulateIncentiveWhatIf(whatIfContext);

  // Select result based on mode
  const isAutoMode = simulatorMode === 'auto';
  const totalIncentive = isAutoMode ? autoResult.totalIncentive : whatIfResult.totalIncentive;
  const breakup = isAutoMode ? autoResult.breakup : whatIfResult.breakup;
  const projectedSI = isAutoMode ? autoResult.projected.siProjected : whatIfInputs.expectedSI;
  const achievement = isAutoMode ? autoResult.projected.siAchievementPercent : (whatIfInputs.expectedSI / siTarget) * 100;
  const isEligible = isAutoMode ? autoResult.projected.isEligible : whatIfResult.eligibility;

  // Format currency
  const formatCurrency = (amount: number) => {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  };

  // Get insights
  const insights = isAutoMode ? autoResult.insights : whatIfResult.nextActionTips;
  const topInsights = insights.slice(0, 3);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg">KAM Incentives</h2>
            <div className="text-xs opacity-90">Your earnings potential</div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="bg-white/10 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setSimulatorMode('auto')}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
              simulatorMode === 'auto'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              {simulatorMode === 'auto' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 opacity-60" />}
              <span>Auto Projection</span>
            </div>
          </button>
          <button
            onClick={() => setSimulatorMode('whatif')}
            className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
              simulatorMode === 'whatif'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>What-If Simulator</span>
            </div>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Total Incentive Card */}
          <div className={`rounded-xl p-5 ${
            isEligible 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
              : 'bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-300'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${isEligible ? 'text-green-600' : 'text-gray-500'}`} />
              <span className="text-sm text-gray-600">
                {isAutoMode ? 'Projected EOM Incentive' : 'Simulated Incentive'}
              </span>
            </div>
            <div className={`text-4xl mb-1 ${isEligible ? 'text-green-700' : 'text-gray-600'}`}>
              {formatCurrency(totalIncentive)}
            </div>
            <div className="text-xs text-gray-500 mb-3">
              {isAutoMode 
                ? `Based on ${mtdValues.si} MTD SIs → projects to ${projectedSI}`
                : `Simulating ${projectedSI} SIs at month end`
              }
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">SI Achievement</span>
                <span className={achievement >= 100 ? 'text-green-600' : 'text-amber-600'}>
                  {Math.round(achievement)}%
                </span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    achievement >= 110 ? 'bg-green-600' :
                    achievement >= 100 ? 'bg-green-500' :
                    achievement >= 80 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(achievement, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {projectedSI} / {siTarget} SIs
              </div>
            </div>

            {!isEligible && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <strong>Target not met:</strong> You need {siTarget - projectedSI} more SIs to unlock incentives
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* What-If Inputs */}
          {simulatorMode === 'whatif' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900">Adjust your inputs</span>
              </div>

              {/* Expected SI */}
              <div>
                <label className="block text-xs text-gray-700 mb-1">Expected Stock-Ins (EOM)</label>
                <input
                  type="number"
                  value={whatIfInputs.expectedSI}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, expectedSI: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Expected Inspections */}
              <div>
                <label className="block text-xs text-gray-700 mb-1">Expected Inspections</label>
                <input
                  type="number"
                  value={whatIfInputs.expectedInspections}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, expectedInspections: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* DCF Onboarding */}
              <div>
                <label className="block text-xs text-gray-700 mb-1">DCF Onboarding</label>
                <input
                  type="number"
                  value={whatIfInputs.expectedOnboarding}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, expectedOnboarding: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* DCF GMV Total */}
              <div>
                <label className="block text-xs text-gray-700 mb-1">DCF GMV Total (₹)</label>
                <input
                  type="number"
                  value={whatIfInputs.expectedGMVTotal}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, expectedGMVTotal: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* DCF GMV First */}
              <div>
                <label className="block text-xs text-gray-700 mb-1">DCF GMV First Disbursement (₹)</label>
                <input
                  type="number"
                  value={whatIfInputs.expectedGMVFirst}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, expectedGMVFirst: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {/* Input Score */}
              <div>
                <label className="block text-xs text-gray-700 mb-1">Input Score (0-100)</label>
                <input
                  type="number"
                  value={whatIfInputs.score}
                  onChange={(e) => setWhatIfInputs({ ...whatIfInputs, score: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          )}

          {/* Coaching Insights (Auto mode only or What-If tips) */}
          {topInsights.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-900">
                  {isAutoMode ? 'Coaching Insights' : 'Action Tips'}
                </span>
              </div>
              <div className="space-y-2">
                {topInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 flex-shrink-0" />
                    <span className="text-xs text-purple-800">{insight.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakup Section */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('breakup')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm text-gray-900">Incentive Breakup</span>
              {expandedSections.breakup ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>

            {expandedSections.breakup && (
              <div className="p-4 space-y-3">
                {/* SI Incentive */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900">SI Incentive</div>
                    {breakup.siSlabs.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {breakup.siSlabs[0].slabName} slab: {breakup.siSlabs[0].siCount} SIs × {formatCurrency(breakup.siSlabs[0].ratePerSI)}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-900">{formatCurrency(breakup.siIncentive)}</span>
                </div>

                {/* DCF GMV Total */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900">DCF GMV Total (1%)</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(isAutoMode ? autoContext.dcf.gmvTotal : whatIfContext.dcf.gmvTotal)} × 1%
                    </div>
                  </div>
                  <span className="text-sm text-gray-900">{formatCurrency(breakup.dcf.gmvTotal)}</span>
                </div>

                {/* DCF GMV First */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900">DCF GMV First (0.5%)</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(isAutoMode ? autoContext.dcf.gmvFirstDisbursement : whatIfContext.dcf.gmvFirst)} × 0.5%
                    </div>
                  </div>
                  <span className="text-sm text-gray-900">{formatCurrency(breakup.dcf.gmvFirst)}</span>
                </div>

                {/* DCF Onboarding */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <div className="text-sm text-gray-900">DCF Onboarding</div>
                    <div className="text-xs text-gray-500">
                      {isAutoMode ? autoContext.dcf.onboardingCount : whatIfContext.dcf.onboarding} dealers × ₹300
                    </div>
                  </div>
                  <span className="text-sm text-gray-900">{formatCurrency(breakup.dcf.onboarding)}</span>
                </div>

                {/* Total Before Score */}
                <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                  <span className="text-sm text-gray-700">Total Before Score</span>
                  <span className="text-sm text-gray-900">{formatCurrency(breakup.totalBeforeScore)}</span>
                </div>

                {/* Score Multiplier */}
                <div className="flex justify-between items-center py-2">
                  <div>
                    <div className="text-sm text-gray-900">Score Multiplier</div>
                    <div className="text-xs text-gray-500">
                      Score: {isAutoMode ? mtdValues.score : whatIfInputs.score} → {breakup.scoreMultiplier === 1 ? '100%' : breakup.scoreMultiplier === 0.5 ? '50%' : '0%'}
                    </div>
                  </div>
                  <span className={`text-sm ${
                    breakup.scoreMultiplier === 1 ? 'text-green-600' :
                    breakup.scoreMultiplier === 0.5 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    ×{breakup.scoreMultiplier}
                  </span>
                </div>

                {/* Final Total */}
                <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3 border border-green-200">
                  <span className="text-sm text-green-900">Final Incentive</span>
                  <span className="text-lg text-green-700">{formatCurrency(totalIncentive)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Benchmarks Section */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('benchmarks')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm text-gray-900">Incentive Structure</span>
              {expandedSections.benchmarks ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>

            {expandedSections.benchmarks && (
              <div className="p-4 space-y-3">
                <div className="text-xs text-gray-600 mb-3">
                  Understanding how your incentive is calculated
                </div>

                {/* SI Slabs */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-700 mb-2">SI Slabs</div>
                  {incentiveSummary.slabs.map((slab, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1">
                      <span className="text-gray-600">{slab.range}</span>
                      <span className="text-gray-900">{formatCurrency(slab.rate)}/SI</span>
                    </div>
                  ))}
                </div>

                {/* DCF Rates */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-700 mb-2">DCF Rates</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">GMV Total</span>
                      <span className="text-gray-900">{incentiveSummary.dcfRates.gmvTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GMV First</span>
                      <span className="text-gray-900">{incentiveSummary.dcfRates.gmvFirst}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Onboarding</span>
                      <span className="text-gray-900">₹{incentiveSummary.dcfRates.onboarding}/dealer</span>
                    </div>
                  </div>
                </div>

                {/* Score Gates */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-700 mb-2">Score Gates</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Below 50</span>
                      <span className="text-red-600">{incentiveSummary.scoreGates.below50}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">50-69</span>
                      <span className="text-amber-600">{incentiveSummary.scoreGates.below70}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">70+</span>
                      <span className="text-green-600">{incentiveSummary.scoreGates.above70}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
