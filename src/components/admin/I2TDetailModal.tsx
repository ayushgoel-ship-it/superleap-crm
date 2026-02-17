import { X, TrendingUp } from 'lucide-react';

interface Dealer {
  id: string;
  name: string;
  city: string;
  inspections: number;
  stockins: number;
}

interface I2TDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  numerator: number;
  denominator: number;
  percentage: number;
  dealers: Dealer[];
  onViewDealer?: (dealerId: string) => void;
}

export function I2TDetailModal({
  isOpen,
  onClose,
  numerator,
  denominator,
  percentage,
  dealers,
  onViewDealer,
}: I2TDetailModalProps) {
  if (!isOpen) return null;

  const getBandColor = () => {
    if (percentage < 30) return 'text-red-600';
    if (percentage < 60) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg text-gray-900">Inspect → Transact Conversion</h2>
            <p className="text-sm text-gray-600 mt-1">
              Dealers who progressed from inspection to transaction
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calculation Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Inspecting Dealers</div>
              <div className="text-3xl text-gray-900">{denominator}</div>
              <div className="text-xs text-gray-500 mt-1">Had ≥1 inspection</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Converted to Transaction</div>
              <div className="text-3xl text-green-600">{numerator}</div>
              <div className="text-xs text-gray-500 mt-1">Had inspections + stock-ins</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
              <div className={`text-3xl ${getBandColor()}`}>{percentage}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {percentage < 30 ? 'Poor' : percentage < 60 ? 'Medium' : 'Good'}
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="bg-white rounded-lg p-3 text-sm">
            <div className="text-gray-600 mb-1">Calculation:</div>
            <div className="font-mono text-gray-900">
              I→T% = ({numerator} converted ÷ {denominator} inspectors) × 100 = {percentage}%
            </div>
          </div>
        </div>

        {/* Dealer List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm text-gray-900 mb-3">
            Dealers who converted ({numerator})
          </h3>

          {dealers.length === 0 ? (
            <div className="card-premium p-6 text-center animate-fade-in">
              <p className="text-[12px] text-slate-400 font-medium">No dealers converted from inspection to transaction in this period</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dealers.map((dealer) => (
                <button
                  key={dealer.id}
                  onClick={() => onViewDealer?.(dealer.id)}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm text-gray-900">{dealer.name}</div>
                      <div className="text-xs text-gray-600">{dealer.city}</div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <TrendingUp className="w-3 h-3" />
                      Converted
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-500">Inspections:</span>{' '}
                      <span className="text-gray-900">{dealer.inspections}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock-ins:</span>{' '}
                      <span className="text-gray-900">{dealer.stockins}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              {denominator - numerator} inspecting dealers did not transact
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}