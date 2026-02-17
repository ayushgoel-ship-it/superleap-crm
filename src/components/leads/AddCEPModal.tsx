import { useState } from 'react';
import { X, DollarSign, AlertCircle, Info, Check } from 'lucide-react';

interface AddCEPModalProps {
  leadId?: string;
  currentCEP?: string | null;
  onClose: () => void;
  onSave: (cep: string) => void;
}

export function AddCEPModal({
  leadId,
  currentCEP,
  onClose,
  onSave,
}: AddCEPModalProps) {
  const [cep, setCep] = useState(currentCEP || '');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validateCEP = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'CEP is mandatory. Please enter expected price.';
    }
    const numValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid price amount.';
    }
    if (numValue < 10000) {
      return 'CEP seems too low. Please verify the amount.';
    }
    if (numValue > 50000000) {
      return 'CEP seems too high. Please verify the amount.';
    }
    return null;
  };

  const formatCurrency = (value: string): string => {
    const numValue = value.replace(/,/g, '');
    if (!numValue) return '';
    const parts = numValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleCEPChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const formatted = formatCurrency(cleaned);
    setCep(formatted);
    
    if (touched) {
      setError(validateCEP(cleaned));
    }
  };

  const handleCEPBlur = () => {
    setTouched(true);
    setError(validateCEP(cep.replace(/,/g, '')));
  };

  const handleSubmit = () => {
    const validationError = validateCEP(cep.replace(/,/g, ''));
    setError(validationError);
    setTouched(true);

    if (!validationError) {
      onSave(cep.replace(/,/g, ''));
    }
  };

  const isValid = () => {
    return cep && !validateCEP(cep.replace(/,/g, ''));
  };

  const isEdit = !!currentCEP;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg text-gray-900">
              {isEdit ? 'Edit CEP' : 'Add CEP'}
            </h2>
            {leadId && <div className="text-sm text-gray-500">Lead: {leadId}</div>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Current CEP Display (only if editing) */}
          {isEdit && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Current CEP</div>
              <div className="text-lg text-gray-900 font-medium">
                ₹{formatCurrency(currentCEP || '0')}
              </div>
            </div>
          )}

          {/* CEP Input */}
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-medium">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                {isEdit ? 'New ' : ''}CEP (Customer Expected Price)
                <span className="text-red-600">*</span>
              </div>
            </label>
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="text"
                value={cep}
                onChange={(e) => handleCEPChange(e.target.value)}
                onBlur={handleCEPBlur}
                placeholder="e.g. 3,50,000"
                className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg ${
                  error && touched ? 'border-red-500' : 'border-gray-300'
                }`}
                autoFocus
              />
            </div>
            
            {error && touched && (
              <div className="mt-2 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              This CEP will be used as the <strong>base OCB price</strong> for this lead and passed to RA.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid()}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isValid()
                ? 'bg-black text-white hover:bg-gray-800 shadow-sm'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            {isEdit ? 'Save CEP' : 'Add CEP'}
          </button>
        </div>
      </div>
    </div>
  );
}
