import { ArrowLeft, CheckCircle2, Circle, AlertCircle, FileText, Calendar } from 'lucide-react';

type OnboardingStep = 'form_filled' | 'docs_cibil' | 'inspection' | 'finance_approval' | 'onboarded';

interface OnboardingStatus {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  rejectionReason?: string;
}

interface DCFDealerOnboardingDetailPageProps {
  dealerId: string;
  onBack: () => void;
}

export function DCFDealerOnboardingDetailPage({ dealerId, onBack }: DCFDealerOnboardingDetailPageProps) {
  // Mock data - in real app this would come from props or API
  const dealerData = {
    id: dealerId,
    name: dealerId === '4' ? 'Prime Auto Hub' : dealerId === '6' ? 'Metro Motors' : 'Elite Automobiles',
    code: dealerId === '4' ? 'FBD-012' : dealerId === '6' ? 'GGN-089' : 'FBD-156',
    onboardingStatus: dealerId === '4' ? 'Pending Docs' : dealerId === '6' ? 'Inspection Pending' : 'Finance Review',
    onboarding: {
      currentStep: (dealerId === '4' ? 'docs_cibil' : dealerId === '6' ? 'inspection' : 'finance_approval') as OnboardingStep,
      completedSteps: (dealerId === '4' 
        ? ['form_filled'] 
        : dealerId === '6' 
        ? ['form_filled', 'docs_cibil']
        : ['form_filled', 'docs_cibil', 'inspection']) as OnboardingStep[],
    },
    lastUpdated: dealerId === '4' ? '2 hours ago' : dealerId === '6' ? '1 day ago' : '3 hours ago',
  };

  const onboardingSteps = [
    { 
      key: 'form_filled', 
      label: 'Form Filled',
      description: 'DCF onboarding form submitted by dealer',
      date: '15 Dec 2024',
    },
    { 
      key: 'docs_cibil', 
      label: 'Docs Submission & CIBIL Check',
      description: 'Required documents uploaded and CIBIL verification',
      date: dealerId !== '4' ? '16 Dec 2024' : undefined,
    },
    { 
      key: 'inspection', 
      label: 'Physical Inspection',
      description: 'On-site inspection of dealer premises',
      date: dealerId === '7' ? '17 Dec 2024' : undefined,
    },
    { 
      key: 'finance_approval', 
      label: 'Approved / Rejected by Finance',
      description: 'Final review and approval from finance team',
      date: undefined,
    },
    { 
      key: 'onboarded', 
      label: 'Onboarded',
      description: 'Dealer is ready to share DCF leads',
      date: undefined,
    },
  ];

  const requiredDocuments = [
    { name: 'PAN Card', status: dealerId === '4' ? 'pending' : 'uploaded', uploadDate: dealerId !== '4' ? '16 Dec 2024' : undefined },
    { name: 'GST Certificate', status: dealerId === '4' ? 'pending' : 'uploaded', uploadDate: dealerId !== '4' ? '16 Dec 2024' : undefined },
    { name: 'Bank Account Details', status: dealerId === '4' ? 'pending' : 'uploaded', uploadDate: dealerId !== '4' ? '16 Dec 2024' : undefined },
    { name: 'Shop Establishment License', status: dealerId === '4' ? 'pending' : 'uploaded', uploadDate: dealerId !== '4' ? '16 Dec 2024' : undefined },
    { name: 'Proprietor/Director CIBIL', status: dealerId === '4' ? 'pending' : 'verified', uploadDate: dealerId !== '4' ? '16 Dec 2024' : undefined },
  ];

  const comments = [
    {
      id: '1',
      author: 'Rajesh Kumar (KAM)',
      text: dealerId === '4' 
        ? 'Dealer needs to submit pending documents. Following up via phone.'
        : dealerId === '6'
        ? 'Physical inspection scheduled for 18th Dec. Dealer premises verified on maps.'
        : 'All documents verified. Sent to finance team for final approval.',
      date: dealerId === '4' ? '2 hours ago' : dealerId === '6' ? '1 day ago' : '3 hours ago',
    },
    {
      id: '2',
      author: 'System',
      text: 'DCF onboarding form submitted successfully',
      date: '15 Dec 2024, 10:30 AM',
    },
  ];

  const renderStepStatus = (stepKey: string) => {
    const isCompleted = dealerData.onboarding.completedSteps.includes(stepKey as OnboardingStep);
    const isCurrent = dealerData.onboarding.currentStep === stepKey;
    const isRejected = stepKey === 'finance_approval' && dealerData.onboarding.rejectionReason;

    if (isCompleted) {
      return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    } else if (isCurrent) {
      return <Circle className="w-6 h-6 text-amber-600 fill-current" />;
    } else if (isRejected) {
      return <AlertCircle className="w-6 h-6 text-red-600" />;
    } else {
      return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStepBgColor = (stepKey: string) => {
    const isCompleted = dealerData.onboarding.completedSteps.includes(stepKey as OnboardingStep);
    const isCurrent = dealerData.onboarding.currentStep === stepKey;
    
    if (isCompleted) return 'bg-green-50 border-green-200';
    if (isCurrent) return 'bg-amber-50 border-amber-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900">{dealerData.name}</h1>
            <div className="text-xs text-gray-500">{dealerData.code}</div>
          </div>
        </div>
        <div className="px-4 pb-3">
          <span className="inline-block px-2.5 py-1 rounded text-xs bg-amber-100 text-amber-700">
            DCF – Not Onboarded ({dealerData.onboardingStatus})
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Onboarding Progress Stepper */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-gray-900 mb-4">Onboarding Progress</h3>
          <div className="space-y-3">
            {onboardingSteps.map((step, index) => (
              <div key={step.key}>
                <div className={`flex gap-3 p-3 rounded-lg border ${getStepBgColor(step.key)}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {renderStepStatus(step.key)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 mb-0.5">{step.label}</div>
                    <div className="text-xs text-gray-600">{step.description}</div>
                    {step.date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {step.date}
                      </div>
                    )}
                  </div>
                </div>
                {/* Connector Line */}
                {index < onboardingSteps.length - 1 && (
                  <div className={`w-0.5 h-4 ml-6 ${
                    dealerData.onboarding.completedSteps.includes(step.key as OnboardingStep)
                      ? 'bg-green-300'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Required Documents */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-gray-900 mb-3">Required Documents</h3>
          <div className="space-y-2">
            {requiredDocuments.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-gray-900">{doc.name}</div>
                    {doc.uploadDate && (
                      <div className="text-xs text-gray-500">Uploaded on {doc.uploadDate}</div>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    doc.status === 'verified'
                      ? 'bg-green-100 text-green-700'
                      : doc.status === 'uploaded'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {doc.status === 'verified' ? 'Verified' : doc.status === 'uploaded' ? 'Uploaded' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes / Comments */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-gray-900 mb-3">Notes / Comments</h3>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-blue-500 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-900">{comment.author}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{comment.date}</span>
                </div>
                <p className="text-xs text-gray-700">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600">Last updated</div>
          <div className="text-xs text-gray-900">{dealerData.lastUpdated}</div>
        </div>

        {/* Greyed-out Metrics Area */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 opacity-50">
          <h3 className="text-gray-900 mb-3">DCF Performance Metrics</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">DCF Leads</div>
              <div className="text-2xl text-gray-400">--</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">Approvals</div>
              <div className="text-2xl text-gray-400">--</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">Disbursals</div>
              <div className="text-2xl text-gray-400">--</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            Will be available once DCF onboarding is completed.
          </p>
        </div>
      </div>
    </div>
  );
}
