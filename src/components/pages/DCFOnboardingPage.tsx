/**
 * DCF ONBOARDING PAGE
 * 
 * Multi-step onboarding form for dealers to join DCF program
 * Based on the Google Form fields specification
 */

import { useState } from 'react';
import { ChevronLeft, Upload, Check } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';
import { getDealerDTO } from '../../data/dtoSelectors';
import { useAuth } from '../auth/AuthProvider';

interface DCFOnboardingPageProps {
  dealerId: string;
  onBack: () => void;
  onComplete: () => void;
}

type OnboardingStep = 'dealer-info' | 'owner-details' | 'address' | 'documents' | 'review';

export function DCFOnboardingPage({ dealerId, onBack, onComplete }: DCFOnboardingPageProps) {
  const { profile } = useAuth();
  const dealer = getDealerDTO(dealerId);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('dealer-info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Dealer & Channel
    employeeEmail: profile?.email || '',
    leadSource: '',
    department: '',
    cityName: dealer?.city || '',
    dealerCode: dealer?.code || '',
    dealershipName: dealer?.name || '',

    // Step 2: Owner Details
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownershipType: '',
    dealerType: '',
    cibilConsent: '',

    // Step 3: Address
    address: '',
    pincode: '',
    googleMapLink: '',
    isBoardInstalled: '',

    // Step 4: Documents (mock file names)
    gstCertificate: '',
    aadhaarFront: '',
    aadhaarBack: '',
    pan: '',
    businessProof: '',
    electricityBill: '',
    dealerSelfie: '',
    additionalDocs: '',
  });

  const steps: { id: OnboardingStep; label: string; number: number }[] = [
    { id: 'dealer-info', label: 'Dealer Info', number: 1 },
    { id: 'owner-details', label: 'Owner Details', number: 2 },
    { id: 'address', label: 'Address', number: 3 },
    { id: 'documents', label: 'Documents', number: 4 },
    { id: 'review', label: 'Review', number: 5 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('DCF onboarding submitted successfully!', {
        description: 'Dealer will be marked as DCF onboarded',
      });

      // TODO: Update dealer DCF status in centralized mock DB
      // updateDealerDCFStatus(dealerId, 'onboarded');

      setIsSubmitting(false);
      onComplete();
    }, 1500);
  };

  const handleFileUpload = (fieldName: string) => {
    // Mock file upload
    const fileName = `${fieldName}_${Date.now()}.pdf`;
    setFormData({ ...formData, [fieldName]: fileName });
    toast.success('File uploaded successfully (mock)');
  };

  if (!dealer) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Dealer not found</p>
            <Button onClick={onBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg text-gray-900">DCF Onboarding</h1>
              <p className="text-sm text-gray-600">{dealer.name}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      idx <= currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {idx < currentStepIndex ? <Check className="w-4 h-4" /> : step.number}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 hidden sm:block">{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      idx < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentStep === 'dealer-info' && (
          <DealerInfoStep formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 'owner-details' && (
          <OwnerDetailsStep formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 'address' && (
          <AddressStep formData={formData} setFormData={setFormData} />
        )}
        {currentStep === 'documents' && (
          <DocumentsStep formData={formData} onFileUpload={handleFileUpload} />
        )}
        {currentStep === 'review' && <ReviewStep formData={formData} dealer={dealer} />}
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button onClick={handlePrevious} variant="outline" className="flex-1">
              Previous
            </Button>
          )}
          {currentStepIndex < steps.length - 1 ? (
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Submitting...' : 'Submit Onboarding'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Dealer Info
function DealerInfoStep({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Dealer & Channel Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Employee Email ID</label>
            <input
              type="email"
              value={formData.employeeEmail}
              onChange={(e) => setFormData({ ...formData, employeeEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Lead Source - Channel <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.leadSource}
              onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="Growth Dealer">Growth Dealer</option>
              <option value="Growth Freelancer">Growth Freelancer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="DR North">DR North</option>
              <option value="DR West">DR West</option>
              <option value="DR South">DR South</option>
              <option value="OSS">OSS</option>
              <option value="SM">SM</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">City Name</label>
            <input
              type="text"
              value={formData.cityName}
              onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">C2B Dealer Code</label>
            <input
              type="text"
              value={formData.dealerCode}
              onChange={(e) => setFormData({ ...formData, dealerCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Dealership Name</label>
            <input
              type="text"
              value={formData.dealershipName}
              onChange={(e) => setFormData({ ...formData, dealershipName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 2: Owner Details
function OwnerDetailsStep({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Owner Details</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Owner Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Owner Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.ownerPhone}
              onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Owner Email</label>
            <input
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Ownership Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.ownershipType}
              onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="Proprietor/Individual">Proprietor/Individual</option>
              <option value="Partnership">Partnership</option>
              <option value="Pvt Ltd">Pvt Ltd</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Dealer Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.dealerType}
              onChange={(e) => setFormData({ ...formData, dealerType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Select...</option>
              <option value="Counter Dealer">Counter Dealer</option>
              <option value="Freelancer">Freelancer</option>
              <option value="C2B DSA">C2B DSA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">CIBIL Consent (UCD ID)</label>
            <input
              type="text"
              value={formData.cibilConsent}
              onChange={(e) => setFormData({ ...formData, cibilConsent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Enter UCD ID"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 3: Address
function AddressStep({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Address Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Proper Address with Pincode for F.I. <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
              placeholder="Full address with pincode"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="110001"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Dealership Google Map Link (Optional)
            </label>
            <input
              type="url"
              value={formData.googleMapLink}
              onChange={(e) => setFormData({ ...formData, googleMapLink: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Is Board Installed? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="boardInstalled"
                  value="Yes"
                  checked={formData.isBoardInstalled === 'Yes'}
                  onChange={(e) => setFormData({ ...formData, isBoardInstalled: e.target.value })}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="boardInstalled"
                  value="No"
                  checked={formData.isBoardInstalled === 'No'}
                  onChange={(e) => setFormData({ ...formData, isBoardInstalled: e.target.value })}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 4: Documents
function DocumentsStep({
  formData,
  onFileUpload,
}: {
  formData: any;
  onFileUpload: (fieldName: string) => void;
}) {
  const documents = [
    { name: 'gstCertificate', label: 'GST Certificate / Non-GST Declaration', required: true },
    { name: 'aadhaarFront', label: 'Aadhaar Card - Front', required: true },
    { name: 'aadhaarBack', label: 'Aadhaar Card - Back', required: true },
    { name: 'pan', label: 'PAN Card', required: true },
    { name: 'businessProof', label: 'Business Govt Proof (Udhyam/GST)', required: true },
    { name: 'electricityBill', label: 'Electricity Bill', required: false },
    { name: 'dealerSelfie', label: 'Dealer Selfie', required: true },
    { name: 'additionalDocs', label: 'Additional Documents (Partnership/Pvt Ltd)', required: false },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Document Uploads</h3>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.name} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-700">
                  {doc.label}
                  {doc.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
              {formData[doc.name] ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>{formData[doc.name]}</span>
                </div>
              ) : (
                <button
                  onClick={() => onFileUpload(doc.name)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Step 5: Review
function ReviewStep({ formData, dealer }: { formData: any; dealer: any }) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Review & Confirm</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-600 mb-2">Dealer Information</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Dealership:</span> {formData.dealershipName}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Code:</span> {formData.dealerCode}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">City:</span> {formData.cityName}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-2">Owner Information</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Name:</span> {formData.ownerName || 'Not provided'}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Phone:</span> {formData.ownerPhone || 'Not provided'}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Type:</span> {formData.ownershipType || 'Not provided'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-2">Documents Uploaded</p>
            <div className="text-sm text-gray-900">
              {[
                formData.gstCertificate,
                formData.aadhaarFront,
                formData.aadhaarBack,
                formData.pan,
                formData.businessProof,
                formData.dealerSelfie,
              ].filter(Boolean).length}{' '}
              of 6 required documents uploaded
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          By submitting this form, you confirm that all information provided is accurate and that you
          have the dealer's consent to onboard them to the DCF program.
        </p>
      </div>
    </div>
  );
}