/**
 * DCF ONBOARDING FLOW COMPONENT
 * 
 * Handles the complete DCF onboarding process for dealers:
 * 1. NOT_ONBOARDED → Show info and initiate button
 * 2. PENDING_DOCS → Show document requirements and upload form
 * 3. PENDING_APPROVAL → Show under review state
 * 4. REJECTED → Show rejection reason with re-submit option
 * 5. APPROVED → Normal DCF operations (handled by parent)
 */

import { useState } from 'react';
import { 
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  IndianRupee
} from 'lucide-react';

export type DCFOnboardingStatus = 
  | 'NOT_ONBOARDED' 
  | 'PENDING_DOCS' 
  | 'PENDING_APPROVAL' 
  | 'REJECTED' 
  | 'APPROVED';

interface DCFOnboardingFlowProps {
  dealerName: string;
  dealerCode: string;
  onboardingStatus: DCFOnboardingStatus;
  rejectionReason?: string;
  onInitiateOnboarding?: () => void;
  onSubmitDocuments?: (documents: Record<string, File | null>) => void;
  onResubmitDocuments?: (documents: Record<string, File | null>) => void;
}

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  mandatory: boolean;
}

const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: 'pan_card',
    name: 'PAN Card',
    description: 'Dealer business PAN card (clear copy)',
    mandatory: true,
  },
  {
    id: 'gst_certificate',
    name: 'GST Certificate',
    description: 'Valid GST registration certificate',
    mandatory: true,
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    description: 'Last 6 months bank statement',
    mandatory: true,
  },
  {
    id: 'dealer_agreement',
    name: 'Dealer Agreement',
    description: 'Signed dealer partnership agreement',
    mandatory: true,
  },
  {
    id: 'address_proof',
    name: 'Address Proof',
    description: 'Shop/Showroom address proof (Electricity bill, Rent agreement)',
    mandatory: true,
  },
  {
    id: 'cancelled_cheque',
    name: 'Cancelled Cheque',
    description: 'Cancelled cheque for bank verification',
    mandatory: false,
  },
];

export function DCFOnboardingFlow({
  dealerName,
  dealerCode,
  onboardingStatus,
  rejectionReason,
  onInitiateOnboarding,
  onSubmitDocuments,
  onResubmitDocuments,
}: DCFOnboardingFlowProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, File | null>>({});
  const [showDocumentList, setShowDocumentList] = useState(false);

  const handleFileUpload = (docId: string, file: File | null) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [docId]: file,
    }));
  };

  const handleSubmit = () => {
    // Check if all mandatory documents are uploaded
    const missingDocs = DOCUMENT_REQUIREMENTS
      .filter(doc => doc.mandatory && !uploadedDocuments[doc.id])
      .map(doc => doc.name);

    if (missingDocs.length > 0) {
      alert(`Please upload the following mandatory documents:\n${missingDocs.join('\n')}`);
      return;
    }

    if (onboardingStatus === 'REJECTED' && onResubmitDocuments) {
      onResubmitDocuments(uploadedDocuments);
    } else if (onSubmitDocuments) {
      onSubmitDocuments(uploadedDocuments);
    }

    // Reset form after submission
    setUploadedDocuments({});
    setShowDocumentList(false);
  };

  // NOT ONBOARDED STATE
  if (onboardingStatus === 'NOT_ONBOARDED') {
    return (
      <div className="space-y-4">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">DCF Not Onboarded</h3>
              <p className="text-sm text-blue-700">
                This dealer is not yet onboarded to the DCF (Dealer Credit Facility) program.
                Onboard them to unlock loan facilitation and earn additional commissions.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Benefits of DCF Onboarding</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">Provide instant loan approvals to customers</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">Earn commission on every loan disbursed</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">Increase car sales with easy financing</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">Digital dashboard for tracking loans</p>
            </div>
          </div>
        </div>

        {/* Document Requirements Preview */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Documents Required</h3>
          <div className="space-y-2">
            {DOCUMENT_REQUIREMENTS.filter(doc => doc.mandatory).map((doc) => (
              <div key={doc.id} className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{doc.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            + {DOCUMENT_REQUIREMENTS.filter(doc => !doc.mandatory).length} optional documents
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onInitiateOnboarding}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Start DCF Onboarding
        </button>
      </div>
    );
  }

  // PENDING DOCS STATE
  if (onboardingStatus === 'PENDING_DOCS' || showDocumentList) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-900 mb-1">Documents Pending</h3>
              <p className="text-sm text-amber-700">
                Please upload the required documents to complete onboarding.
              </p>
            </div>
          </div>
        </div>

        {/* Document Upload Form */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Upload Documents</h3>
            <p className="text-xs text-gray-500 mt-1">
              All documents marked with * are mandatory
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {DOCUMENT_REQUIREMENTS.map((doc) => {
              const file = uploadedDocuments[doc.id];
              const isUploaded = !!file;

              return (
                <div key={doc.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                        {doc.mandatory && (
                          <span className="text-xs text-red-600">*</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0] || null;
                          handleFileUpload(doc.id, selectedFile);
                        }}
                        className="hidden"
                      />
                      <div className={`px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                        isUploaded
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                      }`}>
                        <div className="flex items-center justify-center gap-2">
                          {isUploaded ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 truncate">{file.name}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Choose file</span>
                            </>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Submit Documents
        </button>
      </div>
    );
  }

  // PENDING APPROVAL STATE
  if (onboardingStatus === 'PENDING_APPROVAL') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-pulse" />
          <h3 className="font-medium text-blue-900 mb-2">Under Review</h3>
          <p className="text-sm text-blue-700 mb-4">
            Documents have been submitted and are currently under review by the DCF team.
          </p>
          <div className="bg-white rounded-lg p-4 text-left">
            <div className="text-xs text-gray-500 mb-2">Expected timeline:</div>
            <div className="text-sm font-medium text-gray-900">2-3 business days</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>DCF team will verify submitted documents</span>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>You'll be notified via SMS and email</span>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Once approved, dealer can start submitting loan applications</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REJECTED STATE
  if (onboardingStatus === 'REJECTED') {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-1">Application Rejected</h3>
              <p className="text-sm text-red-700 mb-2">
                The DCF onboarding application was rejected. Please review the reason below and resubmit with correct documents.
              </p>
              {rejectionReason && (
                <div className="bg-white rounded-lg p-3 mt-2">
                  <div className="text-xs text-gray-500 mb-1">Rejection Reason:</div>
                  <div className="text-sm text-gray-900">{rejectionReason}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resubmit Documents Button */}
        <button
          onClick={() => setShowDocumentList(true)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Resubmit Documents
        </button>
      </div>
    );
  }

  // APPROVED STATE (shouldn't reach here as parent handles this)
  return null;
}
