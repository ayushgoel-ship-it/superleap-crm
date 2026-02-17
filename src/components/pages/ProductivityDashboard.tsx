import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Phone, MapPin, Target, ChevronRight } from 'lucide-react';
import { useActivity } from '../../contexts/ActivityContext';
import { countInteractionsByStatus } from '../../lib/productivityEngine';
import { UnproductiveCallsList } from './UnproductiveCallsList';
import { UnproductiveVisitsList } from './UnproductiveVisitsList';

type TimeRange = '7d' | '30d';
type DrillDownView = 'none' | 'calls' | 'visits';

interface ProductivityDashboardProps {
  onBack?: () => void;
}

export function ProductivityDashboard({ onBack }: ProductivityDashboardProps) {
  const { calls, visits } = useActivity();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [drillDownView, setDrillDownView] = useState<DrillDownView>('none');

  // Filter data by time range
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === '7d') {
      cutoffDate.setDate(now.getDate() - 7);
    } else {
      cutoffDate.setDate(now.getDate() - 30);
    }

    // 60-day hard cap
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);
    const finalCutoffDate = cutoffDate < sixtyDaysAgo ? sixtyDaysAgo : cutoffDate;

    const filteredCalls = calls.filter(call => 
      new Date(call.timestamp) >= finalCutoffDate
    );

    const filteredVisits = visits.filter(visit => 
      visit.checkInTime && new Date(visit.checkInTime) >= finalCutoffDate
    );

    return { calls: filteredCalls, visits: filteredVisits };
  }, [calls, visits, timeRange]);

  // Calculate call metrics using productivity engine
  const callMetrics = useMemo(() => {
    const counts = countInteractionsByStatus(filteredData.calls);
    const total = counts.total;
    const productive = counts.productive;
    const nonProductive = counts.nonProductive;
    
    const productiveRate = total > 0 ? Math.round((productive / total) * 100) : 0;
    const nonProductiveRate = total > 0 ? Math.round((nonProductive / total) * 100) : 0;

    return { total, productive, nonProductive, productiveRate, nonProductiveRate };
  }, [filteredData.calls]);

  // Calculate visit metrics (simplified - only productive vs non-productive)
  const visitMetrics = useMemo(() => {
    const completedVisits = filteredData.visits.filter(v => v.status === 'completed');
    const total = completedVisits.length;
    
    // Non-productive = visits without follow-up action
    const nonProductive = completedVisits.filter(v => 
      !v.nextAction || v.nextAction.trim() === ''
    ).length;
    
    const productive = total - nonProductive;
    
    const productiveRate = total > 0 ? Math.round((productive / total) * 100) : 0;
    const nonProductiveRate = total > 0 ? Math.round((nonProductive / total) * 100) : 0;

    return { total, productive, nonProductive, productiveRate, nonProductiveRate };
  }, [filteredData.visits]);

  // Show drill-down views
  if (drillDownView === 'calls') {
    return <UnproductiveCallsList onBack={() => setDrillDownView('none')} />;
  }

  if (drillDownView === 'visits') {
    return <UnproductiveVisitsList onBack={() => setDrillDownView('none')} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg text-gray-900">Productivity Dashboard</h1>
              <p className="text-sm text-gray-500">Track productive vs non-productive interactions</p>
            </div>
            <Target className="w-6 h-6 text-blue-600" />
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                timeRange === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                timeRange === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 days
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Calls Analysis */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Calls Analysis</h3>
          </div>

          {/* Summary Grid - ONLY Productive and Non-Productive */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Productive */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-2xl font-bold text-green-700">{callMetrics.productiveRate}%</div>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-xs text-green-700 font-medium mb-1">Productive</div>
              <div className="text-xs text-gray-600">{callMetrics.productive} of {callMetrics.total} calls</div>
            </div>

            {/* Non-Productive */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-2xl font-bold text-red-700">{callMetrics.nonProductiveRate}%</div>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-xs text-red-700 font-medium mb-1">Non-Productive</div>
              <div className="text-xs text-gray-600">{callMetrics.nonProductive} of {callMetrics.total} calls</div>
            </div>
          </div>

          {/* CTA to drill down - ONLY show count, not list */}
          {callMetrics.nonProductive > 0 && (
            <button
              onClick={() => setDrillDownView('calls')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">
                View all {callMetrics.nonProductive} non-productive calls
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )}

          {callMetrics.total === 0 && (
            <div className="card-premium p-4 text-center animate-fade-in">
              <p className="text-[12px] text-slate-400 font-medium">No calls in this period</p>
            </div>
          )}
        </div>

        {/* Visits Analysis */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">Visits Analysis</h3>
          </div>

          {/* Summary Grid - ONLY Productive and Non-Productive */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Productive */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-2xl font-bold text-green-700">{visitMetrics.productiveRate}%</div>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-xs text-green-700 font-medium mb-1">Productive</div>
              <div className="text-xs text-gray-600">{visitMetrics.productive} of {visitMetrics.total} visits</div>
            </div>

            {/* Non-Productive */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-2xl font-bold text-red-700">{visitMetrics.nonProductiveRate}%</div>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-xs text-red-700 font-medium mb-1">Non-Productive</div>
              <div className="text-xs text-gray-600">{visitMetrics.nonProductive} of {visitMetrics.total} visits</div>
            </div>
          </div>

          {/* CTA to drill down - ONLY show count, not list */}
          {visitMetrics.nonProductive > 0 && (
            <button
              onClick={() => setDrillDownView('visits')}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">
                View all {visitMetrics.nonProductive} non-productive visits
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )}

          {visitMetrics.total === 0 && (
            <div className="card-premium p-4 text-center animate-fade-in">
              <p className="text-[12px] text-slate-400 font-medium">No visits in this period</p>
            </div>
          )}
        </div>

        {/* Summary Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• {callMetrics.total} calls made in the last {timeRange === '7d' ? '7' : '30'} days</p>
            <p>• {visitMetrics.total} visits completed in the last {timeRange === '7d' ? '7' : '30'} days</p>
            <p>• Overall productivity rate: {callMetrics.total + visitMetrics.total > 0 
                ? Math.round(((callMetrics.productive + visitMetrics.productive) / (callMetrics.total + visitMetrics.total)) * 100) 
                : 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}