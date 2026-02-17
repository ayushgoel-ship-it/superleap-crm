import { useState } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface TargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (targetData: TargetData) => void;
  prefilledScope?: 'Global' | 'Region' | 'TL' | 'KAM';
  prefilledId?: string;
}

export interface TargetData {
  scope: 'Global' | 'Region' | 'TL' | 'KAM';
  scopeId?: string;
  metric: string;
  targetValue: number;
  period: 'Monthly' | 'Quarterly' | 'Custom';
  applyToChildren: boolean;
  notes: string;
}

const mockTLs = [
  { id: 'tl1', name: 'Nikhil Verma', region: 'North' },
  { id: 'tl2', name: 'Seema Rao', region: 'West' },
  { id: 'tl3', name: 'Harsh Gupta', region: 'East' },
  { id: 'tl4', name: 'Priya Sharma', region: 'South' },
  { id: 'tl5', name: 'Rajesh Kumar', region: 'NCR' },
];

const mockKAMs = {
  tl1: [
    { id: 'kam1', name: 'Rohit Sharma' },
    { id: 'kam2', name: 'Priya Singh' },
    { id: 'kam3', name: 'Amit Patel' },
  ],
  tl2: [
    { id: 'kam4', name: 'Sneha Gupta' },
    { id: 'kam5', name: 'Vikram Reddy' },
  ],
};

export function TargetsModal({ isOpen, onClose, onSave, prefilledScope, prefilledId }: TargetsModalProps) {
  const [scope, setScope] = useState<'Global' | 'Region' | 'TL' | 'KAM'>(prefilledScope || 'Global');
  const [region, setRegion] = useState('NCR');
  const [selectedTL, setSelectedTL] = useState(prefilledId || 'tl1');
  const [selectedKAM, setSelectedKAM] = useState('kam1');
  const [metric, setMetric] = useState('stockins');
  const [targetValue, setTargetValue] = useState('500');
  const [period, setPeriod] = useState<'Monthly' | 'Quarterly' | 'Custom'>('Monthly');
  const [applyToChildren, setApplyToChildren] = useState(false);
  const [notes, setNotes] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  // Mock current values based on metric
  const getCurrentValue = () => {
    switch (metric) {
      case 'stockins':
        return 420;
      case 'dcfCount':
        return 34;
      case 'dcfValue':
        return 1240000;
      case 'inputScore':
        return 78;
      case 'i2si':
        return 21;
      case 'productiveVisits':
        return 68;
      case 'productiveCalls':
        return 60;
      default:
        return 0;
    }
  };

  const currentValue = getCurrentValue();
  const targetValueNum = parseFloat(targetValue) || 0;
  const percentageChange = ((targetValueNum - currentValue) / currentValue) * 100;

  const handleSave = () => {
    // Check for unrealistic jumps
    if (Math.abs(percentageChange) > 200) {
      setShowWarning(true);
      return;
    }

    const targetData: TargetData = {
      scope,
      scopeId: scope === 'Region' ? region : scope === 'TL' ? selectedTL : scope === 'KAM' ? selectedKAM : undefined,
      metric,
      targetValue: targetValueNum,
      period,
      applyToChildren,
      notes,
    };

    onSave?.(targetData);
    onClose();
  };

  const getMetricLabel = (m: string) => {
    const labels: Record<string, string> = {
      stockins: 'Stock-ins (Count)',
      dcfCount: 'DCF Disbursals (Count)',
      dcfValue: 'DCF Value (₹)',
      inputScore: 'Input Score Gate',
      i2si: 'I2SI (%)',
      productiveVisits: 'Productive Visits (%)',
      productiveCalls: 'Productive Calls (%)',
    };
    return labels[m] || m;
  };

  const formatValue = (value: number, metricType: string) => {
    if (metricType === 'dcfValue') {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (metricType.includes('Percent') || metricType === 'i2si' || metricType === 'productiveVisits' || metricType === 'productiveCalls') {
      return `${value}%`;
    }
    return value.toString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg text-gray-900">Adjust Targets</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Scope Selector */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="Global">Global (All TLs & KAMs)</option>
              <option value="Region">Region</option>
              <option value="TL">Team Lead</option>
              <option value="KAM">KAM</option>
            </select>
          </div>

          {/* Region selector (if scope is Region) */}
          {scope === 'Region' && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">Select Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="NCR">NCR</option>
                <option value="North">North</option>
                <option value="West">West</option>
                <option value="South">South</option>
                <option value="East">East</option>
              </select>
            </div>
          )}

          {/* TL selector (if scope is TL or KAM) */}
          {(scope === 'TL' || scope === 'KAM') && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">Select Team Lead</label>
              <select
                value={selectedTL}
                onChange={(e) => setSelectedTL(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {mockTLs.map((tl) => (
                  <option key={tl.id} value={tl.id}>
                    {tl.name} ({tl.region})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* KAM selector (if scope is KAM) */}
          {scope === 'KAM' && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">Select KAM</label>
              <select
                value={selectedKAM}
                onChange={(e) => setSelectedKAM(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {(mockKAMs[selectedTL as keyof typeof mockKAMs] || []).map((kam) => (
                  <option key={kam.id} value={kam.id}>
                    {kam.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metric Selector */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="stockins">Stock-ins (Count)</option>
              <option value="dcfCount">DCF Disbursals (Count)</option>
              <option value="dcfValue">DCF Value (₹)</option>
              <option value="inputScore">Input Score Gate</option>
              <option value="i2si">I2SI (%)</option>
              <option value="productiveVisits">Productive Visits (%)</option>
              <option value="productiveCalls">Productive Calls (%)</option>
            </select>
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Target Value</label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Enter target value"
            />
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Apply to Children */}
          {(scope === 'Global' || scope === 'Region' || scope === 'TL') && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="applyToChildren"
                checked={applyToChildren}
                onChange={(e) => setApplyToChildren(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="applyToChildren" className="text-sm text-gray-700">
                Apply proportionally to child nodes{' '}
                <span className="text-gray-500">
                  (e.g., {scope === 'TL' ? 'all KAMs under this TL' : scope === 'Region' ? 'all TLs in this region' : 'all TLs'})
                </span>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              rows={3}
              placeholder="Add any notes about this target adjustment..."
            />
          </div>

          {/* Preview Pane */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm text-gray-900 mb-3">Target Preview</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current {getMetricLabel(metric)}:</span>
                <span className="text-gray-900">{formatValue(currentValue, metric)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Proposed Target:</span>
                <span className="text-blue-700">{formatValue(targetValueNum, metric)}</span>
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-200">
                <span className="text-gray-600">Change:</span>
                <span className={`flex items-center gap-1 ${percentageChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {percentageChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(percentageChange).toFixed(1)}%
                </span>
              </div>

              {Math.abs(percentageChange) > 50 && (
                <div className="flex items-start gap-2 pt-2 text-xs text-amber-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Large target change detected. Please confirm this is intentional.</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning modal for unrealistic jumps */}
          {showWarning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <div className="text-sm text-red-900 mb-2">
                    Unrealistic Target Change
                  </div>
                  <div className="text-xs text-red-700 mb-3">
                    The proposed target represents a {Math.abs(percentageChange).toFixed(0)}% change from current value. 
                    Changes above 200% require additional approval.
                  </div>
                  <button
                    onClick={() => setShowWarning(false)}
                    className="text-xs text-red-700 underline"
                  >
                    Adjust target value
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Save Target
          </button>
        </div>
      </div>
    </div>
  );
}
