import { useState } from 'react';
import { ArrowLeft, TrendingUp, Lock, Unlock, Users, Target, DollarSign, Percent, AlertTriangle, CheckCircle2, ChevronRight, Calculator } from 'lucide-react';
import { TLIncentiveSimulator } from './TLIncentiveSimulator';

interface TLIncentiveDashboardProps {
  onBack: () => void;
}

type Period = 'this-month' | 'last-month' | 'custom';

interface KAMData {
  name: string;
  city: string;
  stockIns: number;
  stockInsTarget: number;
  dcfDisbursals: number;
  dcfTarget: number;
  i2si: number;
  inputScore: number;
  contribution: number;
  status: 'on-track' | 'at-risk';
}

export function TLIncentiveDashboard({ onBack }: TLIncentiveDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('this-month');
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedKAM, setSelectedKAM] = useState<KAMData | null>(null);

  // Sample data
  const tlData = {
    name: 'Ayush Goel',
    region: 'North – Dealer Referral',
    totalPotentialIncentive: 185000,
    eligibleIncentive: 0, // Blocked due to I2SI gate
    realizedIncentive: 0,
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
    { name: 'I2SI% Gate', condition: '≥ 65%', actual: '62%', status: 'failed' as const, description: 'Team average I2SI must be at least 65%' },
    { name: 'Input Score Gate', condition: '≥ 70', actual: '74', status: 'passed' as const, description: 'Team average Input Score must be at least 70' },
    { name: 'Active Dealers Gate', condition: '≥ 25', actual: '32', status: 'passed' as const, description: 'Minimum active dealers in the month' },
  ];

  const kamData: KAMData[] = [
    { name: 'Rajesh Kumar', city: 'Gurugram', stockIns: 8, stockInsTarget: 10, dcfDisbursals: 520000, dcfTarget: 700000, i2si: 68, inputScore: 82, contribution: 52000, status: 'on-track' },
    { name: 'Priya Sharma', city: 'Delhi', stockIns: 6, stockInsTarget: 8, dcfDisbursals: 380000, dcfTarget: 600000, i2si: 71, inputScore: 78, contribution: 41000, status: 'on-track' },
    { name: 'Vikram Singh', city: 'Noida', stockIns: 7, stockInsTarget: 9, dcfDisbursals: 460000, dcfTarget: 650000, i2si: 58, inputScore: 68, contribution: 38000, status: 'at-risk' },
    { name: 'Anita Desai', city: 'Faridabad', stockIns: 4, stockInsTarget: 5, dcfDisbursals: 280000, dcfTarget: 350000, i2si: 52, inputScore: 65, contribution: 28000, status: 'at-risk' },
    { name: 'Amit Patel', city: 'Gurugram', stockIns: 3, stockInsTarget: 3, dcfDisbursals: 160000, dcfTarget: 200000, i2si: 75, inputScore: 81, contribution: 26000, status: 'on-track' },
  ];

  const allGatesPassed = gates.every(g => g.status === 'passed');

  if (showSimulator) {
    return (
      <TLIncentiveSimulator
        tlData={tlData}
        gates={gates}
        onBack={() => setShowSimulator(false)}
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
                <div className="text-sm text-gray-500 mt-1">{tlData.name} • {tlData.region}</div>
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
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPeriod('this-month')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedPeriod === 'this-month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setSelectedPeriod('last-month')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedPeriod === 'last-month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setSelectedPeriod('custom')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedPeriod === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>
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
                        <div className="font-medium">Gates Blocked – I2SI below threshold</div>
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
                    style={{ width: `${(tlData.teamStockIns / tlData.teamStockInsTarget) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {((tlData.teamStockIns / tlData.teamStockInsTarget) * 100).toFixed(0)}% achieved • {tlData.teamStockInsTarget - tlData.teamStockIns} needed
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
                    style={{ width: `${(tlData.teamDCFDisbursals / tlData.teamDCFTarget) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {((tlData.teamDCFDisbursals / tlData.teamDCFTarget) * 100).toFixed(0)}% achieved • ₹{((tlData.teamDCFTarget - tlData.teamDCFDisbursals) / 100000).toFixed(1)}L needed
                </div>
              </div>

              {/* Team I2SI% - GATE */}
              <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-red-600" />
                    <span className="text-gray-900">Team I2SI%</span>
                  </div>
                  <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Gate
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl text-gray-900">{tlData.teamI2SI}%</span>
                  <span className="text-sm text-gray-500">/ {tlData.teamI2SIGate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${(tlData.teamI2SI / tlData.teamI2SIGate) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-red-700 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  I2SI Gate: Min {tlData.teamI2SIGate}% required • Current {tlData.teamI2SI}% (Gate failed)
                </div>
              </div>

              {/* Team Input Score - GATE */}
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-gray-900">Team Input Score</span>
                  </div>
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    Gate
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl text-gray-900">{tlData.teamInputScore}</span>
                  <span className="text-sm text-gray-500">/ {tlData.teamInputScoreTarget}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${(tlData.teamInputScore / 100) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Input Score Gate: Min {tlData.teamInputScoreTarget} required • Current {tlData.teamInputScore} (Gate passed)
                </div>
              </div>
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
                    Status: {gate.status === 'passed' ? '✅ Passed' : '❌ Failed'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION D - Team Incentive Breakdown by KAM */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg text-gray-900 mb-4">Team Performance & Incentive Breakdown by KAM</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm text-gray-600">KAM Name</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">City</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Stock-ins</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">DCF Disbursals</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">I2SI%</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Input Score</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Contribution</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {kamData.map((kam, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedKAM(kam)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{kam.name}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{kam.city}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <span className="text-gray-900">{kam.stockIns}</span>
                          <span className="text-gray-500"> / {kam.stockInsTarget}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <span className="text-gray-900">₹{(kam.dcfDisbursals / 100000).toFixed(1)}L</span>
                          <span className="text-gray-500"> / ₹{(kam.dcfTarget / 100000).toFixed(1)}L</span>
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
                      <td className="py-3 px-4 text-gray-900">₹{(kam.contribution / 1000).toFixed(0)}K</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          kam.status === 'on-track'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {kam.status === 'on-track' ? 'On-track' : 'At risk'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-900">
                <strong>Recommendation:</strong> Focus on improving I2SI% for Vikram Singh and Anita Desai to unlock team incentive. Consider additional dealer training or inspection quality reviews.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
