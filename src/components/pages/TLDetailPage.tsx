import { useState } from 'react';
import { ArrowLeft, Download, Target, Calendar, TrendingUp, TrendingDown, Lock, Unlock } from 'lucide-react';
import { AdminKPICard } from '../admin/AdminKPICard';
import { TimePeriod } from '../../lib/domain/constants';
import { computeKAMMetrics } from '../../lib/metrics/metricsFromDB';
import { getConfigSITarget, getConfigDCFGMVTarget } from '../../lib/configFromDB';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { TimeFilterControl, CANONICAL_TIME_OPTIONS, CANONICAL_TIME_LABELS } from '../filters/TimeFilterControl';

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

// Build TL details from real data, scoped to the selected TL
function buildTLDetails(tlId: string) {
  const db = getRuntimeDBSync();
  const allKamMetrics = computeKAMMetrics(TimePeriod.MTD);

  // Find this TL in org hierarchy
  const tlInfo = db.org?.tls?.find(t => t.id === tlId);
  const tlKamIds = new Set(tlInfo?.kams?.map(k => k.id) || []);

  // Filter KAM metrics to only this TL's KAMs
  const kamMetrics = tlKamIds.size > 0
    ? allKamMetrics.filter(km => tlKamIds.has(km.kamId))
    : allKamMetrics;

  // Compute scoped metrics by summing this TL's KAMs
  const siAch = kamMetrics.reduce((s, km) => s + km.stockIns, 0);
  const inspections = kamMetrics.reduce((s, km) => s + km.inspections, 0);
  const totalVisits = kamMetrics.reduce((s, km) => s + km.totalVisits, 0);
  const completedVisits = kamMetrics.reduce((s, km) => s + km.completedVisits, 0);
  const totalCalls = kamMetrics.reduce((s, km) => s + km.totalCalls, 0);
  const connectedCalls = kamMetrics.reduce((s, km) => s + km.connectedCalls, 0);
  const dcfTotal = kamMetrics.reduce((s, km) => s + km.dcfTotal, 0);
  const dcfDisbursedValue = kamMetrics.reduce((s, km) => s + km.dcfDisbursedValue, 0);

  const siTarget = getConfigSITarget('TL');
  const achievement = siTarget > 0 ? Math.round((siAch / siTarget) * 100) : 0;

  // DCF target: use config-driven value scaled per TL
  const dcfGmvTarget = getConfigDCFGMVTarget();
  const totalTLs = db.org?.tls?.length || 1;
  const dcfTarget = Math.max(1, Math.round(dcfGmvTarget / totalTLs));

  // Compute channel breakdown from this TL's leads
  const tlLeads = db.leads.filter(l => tlKamIds.size > 0 ? tlKamIds.has(l.kamId) : true);
  const channelBreakdown: Record<string, number> = {};
  tlLeads.forEach(l => {
    const ch = l.channel || 'Unknown';
    channelBreakdown[ch] = (channelBreakdown[ch] || 0) + 1;
  });

  // Lead breakdown by type
  const sellerLeads = tlLeads.filter(l => l.leadType === 'Seller').length;
  const inventoryLeads = tlLeads.filter(l => l.leadType === 'Inventory').length;
  const totalLeads = sellerLeads + inventoryLeads;

  // Create daily trend from available data
  const daysInWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const avgDaily = Math.round(siAch / 7);
  const dailySITrend = daysInWeek.map(day => ({
    day,
    actual: avgDaily,
    target: Math.round(siTarget / 30),
  }));

  const kams: KAMData[] = kamMetrics.map(km => ({
    id: km.kamId,
    name: km.kamName,
    stockinsActual: km.stockIns,
    stockinsTarget: getConfigSITarget('KAM'),
    i2si: km.i2si,
    inputScore: km.inputScore,
    productiveCallsPercent: km.callConnectRate,
    productiveVisitsPercent: km.completedVisits > 0 ? Math.round((km.completedVisits / Math.max(km.totalVisits, 1)) * 100) : 0,
  }));

  const avgInputScore = kams.length > 0
    ? Math.round(kams.reduce((s, k) => s + k.inputScore, 0) / kams.length)
    : 0;
  const productiveVisitsPercent = completedVisits > 0
    ? Math.round((completedVisits / Math.max(totalVisits, 1)) * 100)
    : 0;
  const productiveCallsPercent = connectedCalls > 0
    ? Math.round((connectedCalls / Math.max(totalCalls, 1)) * 100)
    : 0;

  return {
    name: tlInfo?.name || 'Team Lead',
    region: (tlInfo?.region || 'NCR') as any,
    kamCount: kamMetrics.length,
    stockinsActual: siAch,
    stockinsTarget: siTarget,
    stockinsAchievement: achievement,
    stockinsTrend: undefined,
    dcfCount: dcfTotal,
    dcfTarget,
    dcfValue: dcfDisbursedValue * 100000,
    dcfValueTarget: dcfGmvTarget * 100000,
    avgInputScore,
    productiveVisitsPercent,
    productiveCallsPercent,
    timeSeriesStockins: dailySITrend,
    dailySITrend,
    i2siByChannel: {
      GS: { value: channelBreakdown['GS'] || 0, target: 15 },
      NGS: { value: channelBreakdown['NGS'] || 0, target: 12 },
    },
    sellerLeads,
    inventoryLeads,
    totalLeads,
    kams,
  };
}

export function TLDetailPage({ tlId, onBack, onAdjustTargets, onExport, onViewKAM }: TLDetailPageProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Get TL details (fallback to tl1 if not found)
  const tlDetails = buildTLDetails(tlId);

  const getValueColor = (value: number, greenThreshold: number, redThreshold: number) => {
    if (value >= greenThreshold) return 'text-green-700';
    if (value < redThreshold) return 'text-red-700';
    return 'text-amber-700';
  };

  const getI2SIStatus = (channel: 'GS' | 'NGS', value: number) => {
    const targets: Record<string, number> = { GS: 15, NGS: 12 };
    const target = targets[channel] || 15;
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
        <TimeFilterControl
          mode="chips"
          chipStyle="pill"
          value={timePeriod}
          onChange={setTimePeriod}
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
                      className={`h-2 rounded-full ${day.actual >= day.target
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
              const status = getI2SIStatus(channel as 'GS' | 'NGS', data.value);
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
              <span className="text-sm">{tlDetails.sellerLeads} ({tlDetails.totalLeads > 0 ? Math.round((tlDetails.sellerLeads / tlDetails.totalLeads) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Inventory Leads</span>
              <span className="text-sm">{tlDetails.inventoryLeads} ({tlDetails.totalLeads > 0 ? Math.round((tlDetails.inventoryLeads / tlDetails.totalLeads) * 100) : 0}%)</span>
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