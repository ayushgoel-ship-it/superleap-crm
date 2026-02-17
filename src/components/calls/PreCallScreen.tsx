import { useState } from 'react';
import { Phone, X, ChevronDown } from 'lucide-react';

interface PreCallScreenProps {
  dealerName: string;
  dealerCode: string;
  contactName: string;
  contactPhone: string;
  context?: string;
  onStartCall: (purpose: string) => void;
  onClose: () => void;
}

export function PreCallScreen({
  dealerName,
  dealerCode,
  contactName,
  contactPhone,
  context = 'General dealer engagement',
  onStartCall,
  onClose,
}: PreCallScreenProps) {
  const [purpose, setPurpose] = useState<string>('lead_followup');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);

  const purposes = [
    { id: 'lead_followup', label: 'Lead follow-up' },
    { id: 'visit_confirmation', label: 'Visit confirmation' },
    { id: 'dcf_onboarding', label: 'DCF onboarding' },
    { id: 'price_discussion', label: 'Price/offer discussion' },
    { id: 'relationship', label: 'General relationship' },
    { id: 'other', label: 'Other' },
  ];

  const selectedPurposeLabel = purposes.find(p => p.id === purpose)?.label || '';

  const handleStartCall = () => {
    const finalPurpose = purpose === 'other' ? customPurpose : selectedPurposeLabel;
    onStartCall(finalPurpose);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-t-2xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <h2 className="text-gray-900">Prepare for call</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Dealer & Contact Info */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-gray-900">{dealerName}</h3>
              <span className="text-xs text-gray-600">{dealerCode}</span>
            </div>
            <div className="text-sm text-gray-700">
              {contactName} • {contactPhone}
            </div>
            <div className="text-xs text-blue-700 mt-2">
              Context: {context}
            </div>
          </div>

          {/* Call Purpose */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-700">
              Call purpose
            </label>
            
            <div className="relative">
              <button
                onClick={() => setShowPurposeDropdown(!showPurposeDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
              >
                <span>{selectedPurposeLabel}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              
              {showPurposeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {purposes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPurpose(p.id);
                        setShowPurposeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        purpose === p.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom purpose field */}
            {purpose === 'other' && (
              <input
                type="text"
                placeholder="Enter custom purpose..."
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleStartCall}
            disabled={purpose === 'other' && !customPurpose.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Start Call
          </button>
        </div>
      </div>
    </div>
  );
}
