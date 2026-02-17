import { useState } from 'react';
import { X, ChevronLeft, Phone, Calendar, MapPin, User, Car, IndianRupee, Clock, Check, Share2, ExternalLink, AlertCircle } from 'lucide-react';
import { validateCEPForAction } from '../../lib/leadBusinessRules';

type LeadType = 'seller' | 'inventory' | 'dcf' | 'gs';
type InspectionType = 'home' | 'dealer' | 'video';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerName: string;
  dealerCode: string;
  dealerCity?: string;
  dealerPhone?: string;
  dealerAddress?: string;
  onLeadCreated?: (leadId: string) => void;
}

interface LeadData {
  type: LeadType | null;
  regNo: string;
  ownerName: string;
  ownerPhone: string;
  city: string;
  make: string;
  model: string;
  variant: string;
  year: string;
  odometer: string;
  ownership: '1st' | '2nd' | '3+' | '';
  cep: string;
  isCEPTentative: boolean;
  bookAppointment: boolean;
  appointmentDate: string;
  appointmentTime: string;
  inspectionType: InspectionType;
  inspectorEmail: string;
  reminderEnabled: boolean;
}

export function CreateLeadModal({
  isOpen,
  onClose,
  dealerName,
  dealerCode,
  dealerCity = 'Delhi',
  dealerPhone,
  dealerAddress,
  onLeadCreated,
}: CreateLeadModalProps) {
  const [step, setStep] = useState(1);
  const [leadData, setLeadData] = useState<LeadData>({
    type: null,
    regNo: '',
    ownerName: '',
    ownerPhone: '',
    city: dealerCity,
    make: '',
    model: '',
    variant: '',
    year: '',
    odometer: '',
    ownership: '',
    cep: '',
    isCEPTentative: false,
    bookAppointment: true,
    appointmentDate: '',
    appointmentTime: '',
    inspectionType: 'home',
    inspectorEmail: '',
    reminderEnabled: true,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState('');

  if (!isOpen) return null;

  const missingDealerInfo = !dealerPhone || !dealerAddress;

  const updateLeadData = (updates: Partial<LeadData>) => {
    setLeadData((prev) => ({ ...prev, ...updates }));
  };

  const handleAutoFillVehicle = () => {
    // Mock auto-fill from registration number
    updateLeadData({
      make: 'Maruti',
      model: 'Swift',
      variant: 'VXI',
      year: '2019',
      odometer: '42500',
      ownership: '1st',
    });
  };

  const canProceedStep1 = leadData.type !== null;
  const canProceedStep2 = leadData.regNo.length > 0;
  const canProceedStep3 = leadData.make && leadData.model && leadData.year;
  const canProceedStep4 = leadData.type === 'dcf' || leadData.cep.length > 0;
  
  // CEP Validation for Appointment Creation
  const getCEPValidationError = () => {
    if (!leadData.bookAppointment) return null; // No appointment, no CEP required
    if (leadData.type === 'dcf') return null; // DCF doesn't need CEP
    
    const channel = leadData.type === 'seller' ? 'C2B' : 
                    leadData.type === 'gs' ? 'GS' : 
                    leadData.type === 'inventory' ? 'C2D' : 'C2B';
    
    const validation = validateCEPForAction(
      channel as 'C2B' | 'GS' | 'C2D',
      leadData.cep,
      'create_appointment'
    );
    
    return validation.valid ? null : validation.error;
  };
  
  const cepValidationError = getCEPValidationError();
  const canCreateLead = !leadData.bookAppointment || 
                        (leadData.appointmentDate && leadData.appointmentTime && !cepValidationError);

  const handleCreateLead = () => {
    // Generate mock lead ID
    const leadId = 'L' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    setCreatedLeadId(leadId);
    setShowSuccess(true);

    // Call callback
    if (onLeadCreated) {
      onLeadCreated(leadId);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep(1);
    setShowSuccess(false);
    setLeadData({
      type: null,
      regNo: '',
      ownerName: '',
      ownerPhone: '',
      city: dealerCity,
      make: '',
      model: '',
      variant: '',
      year: '',
      odometer: '',
      ownership: '',
      cep: '',
      isCEPTentative: false,
      bookAppointment: true,
      appointmentDate: '',
      appointmentTime: '',
      inspectionType: 'home',
      inspectorEmail: '',
      reminderEnabled: true,
    });
    onClose();
  };

  // Success Screen
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
        <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg text-gray-900">Lead Created!</h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Content */}
          <div className="p-6 space-y-6">
            {/* Lead Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-900 mb-2">Lead ID: <span className="font-mono">{createdLeadId}</span></div>
              <div className="text-sm text-gray-700 space-y-1">
                <div>Reg No: {leadData.regNo}</div>
                <div>Owner: {leadData.ownerName}</div>
                {leadData.type !== 'dcf' && leadData.cep && (
                  <div>CEP: ₹{parseInt(leadData.cep).toLocaleString('en-IN')}</div>
                )}
                {leadData.bookAppointment && leadData.appointmentDate && (
                  <div>Appointment: {new Date(leadData.appointmentDate).toLocaleDateString()} {leadData.appointmentTime}</div>
                )}
              </div>
            </div>

            {leadData.type !== 'dcf' && leadData.cep && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-900">
                  💡 CEP: ₹{parseInt(leadData.cep).toLocaleString('en-IN')} will be used for OCB calculation
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm text-gray-900">Quick Actions</h3>

              <button className="w-full p-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                <Phone className="w-4 h-4" />
                Call Owner
              </button>

              {leadData.bookAppointment && (
                <button className="w-full p-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-700">
                  <MapPin className="w-4 h-4" />
                  Start Visit
                </button>
              )}

              <button className="w-full p-3 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
                <ExternalLink className="w-4 h-4" />
                Open Lead
              </button>

              <button className="w-full p-3 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
                <Share2 className="w-4 h-4" />
                Share Lead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-step Form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-lg text-gray-900">Create Lead</h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dealer Info */}
          <div className="text-sm text-gray-600 mb-3">
            {dealerName} ({dealerCode})
          </div>

          {/* Missing Info Banner */}
          {missingDealerInfo && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
              <div className="text-xs text-amber-900">
                ⚠️ Dealer contact incomplete — add phone/address below
              </div>
            </div>
          )}

          {/* Progress Stepper */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-600 mt-1">Step {step} of 5</div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Lead Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm text-gray-900 mb-3">Select Lead Type</h3>
              <div className="space-y-2">
                {[
                  { value: 'seller', label: 'Seller Lead', desc: 'Customer wants to sell car' },
                  { value: 'inventory', label: 'Inventory Lead', desc: 'Dealer inventory for C24' },
                  { value: 'dcf', label: 'DCF Lead', desc: 'Dealer customer financing' },
                  { value: 'gs', label: 'GS Lead', desc: 'Genuine Spares request' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateLeadData({ type: option.value as LeadType })}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      leadData.type === option.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          leadData.type === option.value
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {leadData.type === option.value && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={`w-full p-3 rounded-lg text-white ${
                  canProceedStep1
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 2: Basic Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm text-gray-900 mb-3">Basic Lead Details</h3>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Car Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="DL6CAC9999"
                  value={leadData.regNo}
                  onChange={(e) => updateLeadData({ regNo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  placeholder="Bhavika Nanda"
                  value={leadData.ownerName}
                  onChange={(e) => updateLeadData({ ownerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone Number</label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={leadData.ownerPhone}
                    onChange={(e) => updateLeadData({ ownerPhone: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  {leadData.ownerPhone && (
                    <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">City</label>
                <select
                  value={leadData.city}
                  onChange={(e) => updateLeadData({ city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="Delhi">Delhi</option>
                  <option value="Gurgaon">Gurgaon</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className={`w-full p-3 rounded-lg text-white ${
                  canProceedStep2
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 3: Vehicle Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm text-gray-900">Vehicle Details</h3>
                <button
                  onClick={handleAutoFillVehicle}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Auto-fill from reg no
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Maruti"
                    value={leadData.make}
                    onChange={(e) => updateLeadData({ make: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Swift"
                    value={leadData.model}
                    onChange={(e) => updateLeadData({ model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Variant</label>
                <input
                  type="text"
                  placeholder="VXI"
                  value={leadData.variant}
                  onChange={(e) => updateLeadData({ variant: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="2019"
                    value={leadData.year}
                    onChange={(e) => updateLeadData({ year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Odometer (km)</label>
                  <input
                    type="text"
                    placeholder="42500"
                    value={leadData.odometer}
                    onChange={(e) => updateLeadData({ odometer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Ownership</label>
                <div className="flex gap-2">
                  {['1st', '2nd', '3+'].map((own) => (
                    <button
                      key={own}
                      onClick={() => updateLeadData({ ownership: own as any })}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        leadData.ownership === own
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      {own}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className={`w-full p-3 rounded-lg text-white ${
                  canProceedStep3
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 4: Price & CEP */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm text-gray-900 mb-3">
                {leadData.type === 'dcf' ? 'Loan Details' : 'Price & CEP'}
              </h3>

              {leadData.type !== 'dcf' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      CEP (Expected Selling Price) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="425000"
                        value={leadData.cep}
                        onChange={(e) => updateLeadData({ cep: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      CEP acts as OCB base. Required before appointment.
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={leadData.isCEPTentative}
                      onChange={(e) => updateLeadData({ isCEPTentative: e.target.checked })}
                      className="rounded"
                    />
                    This is tentative
                  </label>
                </>
              )}

              {leadData.type === 'dcf' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-900">
                    DCF leads will proceed to loan application flow. CEP not required.
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(5)}
                disabled={!canProceedStep4}
                className={`w-full p-3 rounded-lg text-white ${
                  canProceedStep4
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 5: Appointment Booking */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm text-gray-900 mb-3">Book Appointment</h3>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={leadData.bookAppointment}
                  onChange={(e) => updateLeadData({ bookAppointment: e.target.checked })}
                  className="rounded"
                />
                Book appointment now?
              </label>

              {leadData.bookAppointment && (
                <>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={leadData.appointmentDate}
                      onChange={(e) => updateLeadData({ appointmentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Time Slot</label>
                    <select
                      value={leadData.appointmentTime}
                      onChange={(e) => updateLeadData({ appointmentTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select time slot</option>
                      <option value="10:00-11:00">10:00 - 11:00 AM</option>
                      <option value="11:00-12:00">11:00 AM - 12:00 PM</option>
                      <option value="12:00-13:00">12:00 - 1:00 PM</option>
                      <option value="14:00-15:00">2:00 - 3:00 PM</option>
                      <option value="15:00-16:00">3:00 - 4:00 PM</option>
                      <option value="16:00-17:00">4:00 - 5:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Inspection Type</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'home', label: 'Home', icon: MapPin },
                        { value: 'dealer', label: 'Dealer', icon: Car },
                        { value: 'video', label: 'Video', icon: Phone },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => updateLeadData({ inspectionType: value as InspectionType })}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm flex items-center justify-center gap-1 ${
                            leadData.inspectionType === value
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Inspector Email (optional)</label>
                    <input
                      type="email"
                      placeholder="rajesh.kumar@cars24.com"
                      value={leadData.inspectorEmail}
                      onChange={(e) => updateLeadData({ inspectorEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={leadData.reminderEnabled}
                      onChange={(e) => updateLeadData({ reminderEnabled: e.target.checked })}
                      className="rounded"
                    />
                    Send reminder 1 hour before appointment
                  </label>
                </>
              )}

              {cepValidationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs text-red-900">
                    ⚠️ {cepValidationError}
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateLead}
                disabled={!canCreateLead}
                className={`w-full p-3 rounded-lg text-white ${
                  canCreateLead
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Confirm & Create Lead
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}