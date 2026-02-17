import { useState } from 'react';
import { ArrowLeft, Download, Target, Calendar, TrendingUp, TrendingDown, Lock, Unlock } from 'lucide-react';
import { AdminKPICard } from '../admin/AdminKPICard';
import { TimePeriod } from '../../lib/domain/constants';
import { useFilterScope } from '../../contexts/FilterContext';

interface KAMData {
  id: string;
  name: string;
  stockinsActual: number;
  stockinsTarget: number;
  i2si: number;
  inputScore: number;
  productiveCallsPercent: number;
  productiveVisitsPercent: number;
}

interface TLDetailPageProps {
  tlId: string;
  onBack: () => void;
  onAdjustTargets?: () => void;
  onExport?: () => void;
  onViewKAM?: (kamId: string) => void;
}

// Mock TL details
const mockTLDetails = {
  tl1: {
    name: 'Nikhil Verma',
    region: 'North',
    kamCount: 8,
    stockinsActual: 420,
    stockinsTarget: 500,
    stockinsAchievement: 84,
    dcfCount: 34,
    dcfTarget: 40,
    dcfValue: 1240000,
    dcfValueTarget: 1500000,
    avgInputScore: 78,
    i2si: 21,
    productiveVisitsPercent: 68,
    productiveCallsPercent: 60,
    stockinsTrend: [12, 10, 14, 11, 13, 15, 14],
    dcfTrend: [4, 5, 6, 4, 5, 6, 4],
    timeSeriesStockins: [
      { day: 'Mon', actual: 58, target: 71 },
      { day: 'Tue', actual: 62, target: 71 },
      { day: 'Wed', actual: 55, target: 71 },
      { day: 'Thu', actual: 68, target: 71 },
      { day: 'Fri', actual: 72, target: 71 },
      { day: 'Sat', actual: 65, target: 71 },
      { day: 'Sun', actual: 40, target: 71 },
    ],
    i2siByChannel: {
      GS: { value: 18, target: 15 },
      C2D: { value: 23, target: 20 },
      C2B: { value: 14, target: 12 },
    },
    kams: [
      { id: 'kam1', name: 'Rohit Sharma', stockinsActual: 52, stockinsTarget: 62, i2si: 22, inputScore: 80, productiveCallsPercent: 65, productiveVisitsPercent: 72 },
      { id: 'kam2', name: 'Priya Singh', stockinsActual: 58, stockinsTarget: 65, i2si: 24, inputScore: 82, productiveCallsPercent: 68, productiveVisitsPercent: 75 },
      { id: 'kam3', name: 'Amit Patel', stockinsActual: 48, stockinsTarget: 60, i2si: 19, inputScore: 76, productiveCallsPercent: 58, productiveVisitsPercent: 65 },
      { id: 'kam4', name: 'Sneha Gupta', stockinsActual: 62, stockinsTarget: 68, i2si: 25, inputScore: 84, productiveCallsPercent: 72, productiveVisitsPercent: 78 },
      { id: 'kam5', name: 'Vikram Reddy', stockinsActual: 45, stockinsTarget: 58, i2si: 18, inputScore: 72, productiveCallsPercent: 55, productiveVisitsPercent: 62 },
      { id: 'kam6', name: 'Neha Malhotra', stockinsActual: 55, stockinsTarget: 63, i2si: 21, inputScore: 78, productiveCallsPercent: 62, productiveVisitsPercent: 68 },
      { id: 'kam7', name: 'Rahul Verma', stockinsActual: 50, stockinsTarget: 62, i2si: 20, inputScore: 75, productiveCallsPercent: 60, productiveVisitsPercent: 66 },
      { id: 'kam8', name: 'Ananya Kumar', stockinsActual: 50, stockinsTarget: 62, i2si: 19, inputScore: 74, productiveCallsPercent: 58, productiveVisitsPercent: 64 },
    ] as KAMData[],
  },
  // Add more TL details as needed - for now just one
};

export function TLDetailPage({ tlId, onBack, onAdjustTargets, onExport, onViewKAM }: TLDetailPageProps) {
  const { state } = useFilterScope('admin-home');
  const timePeriod = state.time ?? TimePeriod.LAST_7D;
  const [adminNote, setAdminNote] = useState('');

  // Get TL details (fallback to tl1 if not found)
  const tlDetails = mockTLDetails[tlId as keyof typeof mockTLDetails] || mockTLDetails.tl1;

  const getValueColor = (value: number, greenThreshold: number, redThreshold: number) => {
    if (value >= greenThreshold) return 'text-green-700';
    if (value < redThreshold) return 'text-red-700';
    return 'text-amber-700';
  };

  const getI2SIStatus = (channel: 'GS' | 'C2D' | 'C2B', value: number) => {
    const targets = { GS: 15, C2D: 20, C2B: 12 };
    const target = targets[channel];
    if (value >= target) return 'green';
    if (value >= target * 0.8) return 'amber';
    return 'red';
  };

  const getI2SIColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-green-50 border-green-500 text-green-700';
      case 'amber':
        return 'bg-amber-50 border-amber-500 text-amber-700';
      case 'red':
        return 'bg-red-50 border-red-500 text-red-700';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-700';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl text-gray-900">{tlDetails.name}</h1>
            <p className="text-sm text-gray-600">
              {tlDetails.region} • {tlDetails.kamCount} KAMs
            </p>
          </div>
        </div>

        {/* Time period toggle */}
        <div className="flex items-center gap-2 mb-3">
          {[
            { period: TimePeriod.LAST_7D, label: '7 days' },
            { period: TimePeriod.LAST_30D, label: '30 days' },
            { period: TimePeriod.QTD, label: 'QTD' },
          ].map(({ period, label }) => (
            <button
              key={period}
              onClick={() => {/* Time period managed by FilterContext for admin scope */}}
              className={`px-4 py-2 rounded-lg text-sm ${
                timePeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <AdminKPICard
            title="Stock-ins"
            actual={tlDetails.stockinsActual}
            target={tlDetails.stockinsTarget}
            percentage={tlDetails.stockinsAchievement}
            trend={tlDetails.stockinsTrend}
            status={
              tlDetails.stockinsAchievement >= 100
                ? 'green'
                : tlDetails.stockinsAchievement >= 75
                ? 'amber'
                : 'red'
            }
            size="medium"
          />

          <AdminKPICard
            title="DCF Disbursals"
            actual={tlDetails.dcfCount}
            target={tlDetails.dcfTarget}
            percentage={(tlDetails.dcfCount / tlDetails.dcfTarget) * 100}
            status={
              tlDetails.dcfCount >= tlDetails.dcfTarget
                ? 'green'
                : tlDetails.dcfCount >= tlDetails.dcfTarget * 0.75
                ? 'amber'
                : 'red'
            }
            size="medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AdminKPICard
            title="Avg Input Score"
            actual={tlDetails.avgInputScore}
            gate={true}
            gateValue={75}
            status={
              tlDetails.avgInputScore >= 75
                ? 'green'
                : tlDetails.avgInputScore >= 70
                ? 'amber'
                : 'red'
            }
            size="medium"
          />

          <AdminKPICard
            title="DCF Value"
            actual={`₹${(tlDetails.dcfValue / 100000).toFixed(1)}L`}
            target={`₹${(tlDetails.dcfValueTarget / 100000).toFixed(1)}L`}
            percentage={(tlDetails.dcfValue / tlDetails.dcfValueTarget) * 100}
            status={
              tlDetails.dcfValue >= tlDetails.dcfValueTarget
                ? 'green'
                : tlDetails.dcfValue >= tlDetails.dcfValueTarget * 0.75
                ? 'amber'
                : 'red'
            }
            size="medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AdminKPICard
            title="Productive Visits"
            actual={`${tlDetails.productiveVisitsPercent}%`}
            status={
              tlDetails.productiveVisitsPercent >= 70
                ? 'green'
                : tlDetails.productiveVisitsPercent >= 50
                ? 'amber'
                : 'red'
            }
            size="medium"
          />

          <AdminKPICard
            title="Productive Calls"
            actual={`${tlDetails.productiveCallsPercent}%`}
            status={
              tlDetails.productiveCallsPercent >= 70
                ? 'green'
                : tlDetails.productiveCallsPercent >= 50
                ? 'amber'
                : 'red'
            }
            size="medium"
          />
        </div>
      </div>

      {/* Performance Timeline */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm text-gray-900 mb-4">Performance Timeline ({timePeriod} days)</h2>
          
          {/* Simple bar chart for 7-day view */}
          <div className="space-y-3">
            {tlDetails.timeSeriesStockins.map((day, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{day.day}</span>
                  <span>
                    {day.actual} / {day.target}
                  </span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        day.actual >= day.target
                          ? 'bg-green-500'
                          : day.actual >= day.target * 0.75
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((day.actual / day.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* I2SI by Channel */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm text-gray-900 mb-3">I2SI by Channel</h2>
          
          <div className="space-y-2">
            {Object.entries(tlDetails.i2siByChannel).map(([channel, data]) => {
              const status = getI2SIStatus(channel as 'GS' | 'C2D' | 'C2B', data.value);
              return (
                <div
                  key={channel}
                  className={`p-3 rounded-lg border-l-4 ${getI2SIColor(status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm">{channel}</div>
                      <div className="text-xs opacity-75">Target: {data.target}%</div>
                    </div>
                    <div className="text-lg">{data.value}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock-ins breakdown */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm text-gray-900 mb-3">Stock-ins Breakdown</h2>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Seller Leads</span>
              <span className="text-sm">248 (59%)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Inventory Leads</span>
              <span className="text-sm">172 (41%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KAM List */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm text-gray-900 mb-3">KAM Performance</h2>
          
          <div className="space-y-2">
            {tlDetails.kams.map((kam) => (
              <div
                key={kam.id}
                onClick={() => onViewKAM?.(kam.id)}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-900">{kam.name}</div>
                    <div className="text-xs text-gray-600">
                      Stock-ins: {kam.stockinsActual} / {kam.stockinsTarget} (
                      {((kam.stockinsActual / kam.stockinsTarget) * 100).toFixed(0)}%)
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {kam.inputScore >= 75 ? (
                      <Unlock className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-gray-600">I2SI</div>
                    <div className={getValueColor(kam.i2si, 20, 15)}>{kam.i2si}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Input Score</div>
                    <div className={getValueColor(kam.inputScore, 75, 70)}>{kam.inputScore}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Prod. Visits</div>
                    <div className={getValueColor(kam.productiveVisitsPercent, 70, 50)}>
                      {kam.productiveVisitsPercent}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Prod. Calls</div>
                    <div className={getValueColor(kam.productiveCallsPercent, 70, 50)}>
                      {kam.productiveCallsPercent}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Notes & Actions */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm text-gray-900 mb-3">Admin Notes</h2>
          
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Add notes about this TL's performance..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-3 resize-none"
            rows={3}
          />

          <div className="space-y-2">
            <button
              onClick={onAdjustTargets}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              Adjust TL Targets
            </button>

            <button
              onClick={onExport}
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export TL Report (CSV)
            </button>

            <button className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg text-sm flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Review Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}