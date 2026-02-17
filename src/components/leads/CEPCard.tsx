import { Edit2, Plus } from 'lucide-react';

interface CEPCardProps {
  cepValue: string | null;
  onOpenModal: () => void;
}

export function CEPCard({ cepValue, onOpenModal }: CEPCardProps) {
  const formatCEP = (value: string) => {
    return `₹${parseInt(value).toLocaleString('en-IN')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-gray-900">CEP / OCB Price</h2>
          <span className={`px-2 py-0.5 rounded text-xs ${
            cepValue
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {cepValue ? 'CEP Updated' : 'CEP Pending'}
          </span>
        </div>
        {cepValue && (
          <button
            onClick={onOpenModal}
            className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {cepValue ? (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">CEP (Expected Selling Price)</div>
            <div className="text-2xl text-gray-900 mb-1">{formatCEP(cepValue)}</div>
            <div className="text-xs text-gray-500">Entered by KAM on 2 Dec 2025, 10:30 AM</div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <div className="text-xs text-amber-700">
              CEP not entered – please update CEP before or at the time of appointment.
            </div>
          </div>
          
          <button
            onClick={onOpenModal}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add CEP
          </button>
        </>
      )}
    </div>
  );
}
