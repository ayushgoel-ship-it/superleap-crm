import { useState } from 'react';
import { Check, Circle, Clock, ChevronDown, ChevronUp, DollarSign, User, Building2, MapPin, FileText, TrendingUp, CreditCard, Phone, Play, Mail, ExternalLink, AlertTriangle } from 'lucide-react';

type Channel = 'C2B' | 'GS' | 'C2D' | 'DCF';

interface TimelineStage {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  time?: string;
  metadata?: {
    label: string;
    value: string;
    icon?: any;
    isButton?: boolean;
    buttonAction?: () => void;
  }[];
}

interface LeadTimelineProps {
  channel: Channel;
  currentStage: string;
  leadData?: any;
  ocbStatus?: 'running' | 'raised' | null;
  sellerBackout?: boolean;
  leadFeeRefunded?: boolean;
}

export function LeadTimeline({ channel, currentStage, leadData = {}, ocbStatus, sellerBackout, leadFeeRefunded }: LeadTimelineProps) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set([currentStage]));
  const [isFullJourneyExpanded, setIsFullJourneyExpanded] = useState(true); // Default to expanded for full journey view

  // Generate timeline stages based on channel
  const getTimelineStages = (): TimelineStage[] => {
    if (channel === 'C2B' || channel === 'GS') {
      return getC2BTimeline();
    } else if (channel === 'C2D') {
      return getC2DTimeline();
    } else if (channel === 'DCF') {
      return getDCFTimeline();
    }
    return [];
  };

  const getC2BTimeline = (): TimelineStage[] => {
    const stages = [
      'lead_created',
      'contact_completed',
      'inspection_scheduled',
      'inspection_done',
      'hb_discovered',
      'ocb_raised',
      'pr_confirmed',
      'stockin',
      'payout',
    ];

    const currentIndex = stages.indexOf(currentStage);

    return [
      {
        id: 'lead_created',
        label: 'Lead Created',
        status: currentIndex >= 0 ? 'completed' : 'pending',
        date: '2 Dec 2025',
        time: '10:30 AM',
        metadata: [
          { label: 'CEP entered by KAM', value: '₹4,25,000', icon: DollarSign },
        ],
      },
      {
        id: 'contact_completed',
        label: '3CA Completed',
        status: currentIndex >= 1 ? (currentIndex === 1 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 1 ? '2 Dec 2025' : undefined,
        time: currentIndex >= 1 ? '11:00 AM' : undefined,
        metadata: currentIndex >= 1 ? [
          { label: 'RA name & phone', value: 'Suresh RA • +91 88776 65544', icon: User },
          { label: 'Calls', value: '3 attempts, 1 connect', icon: Phone },
          { label: 'First connect date & time', value: '2 Dec 2025, 11:00 AM', icon: Clock },
          { label: 'Last call recording', value: 'Listen to 4m 32s recording', icon: Play },
        ] : undefined,
      },
      {
        id: 'inspection_scheduled',
        label: 'Inspection Scheduled',
        status: currentIndex >= 2 ? (currentIndex === 2 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 2 ? '2 Dec 2025' : undefined,
        time: currentIndex >= 2 ? '11:15 AM' : undefined,
        metadata: currentIndex >= 2 ? [
          { label: 'Slot', value: '2 Dec 2025, 3:00–4:00 PM', icon: Clock },
          { label: 'CJ email ID', value: 'mohit.singh@cars24.com', icon: Mail },
        ] : undefined,
      },
      {
        id: 'inspection_done',
        label: 'Inspection Done',
        status: currentIndex >= 3 ? (currentIndex === 3 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 3 ? '2 Dec 2025' : undefined,
        time: currentIndex >= 3 ? '3:25 PM' : undefined,
        metadata: currentIndex >= 3 ? [
          { label: 'RA email ID', value: 'rajesh.kumar@cars24.com', icon: Mail },
          { label: 'LMS link', value: 'View in LMS (APP ID: DL6CAC9999)', icon: ExternalLink, isButton: true },
        ] : undefined,
      },
      {
        id: 'hb_discovered',
        label: 'HB Discovered',
        status: currentIndex >= 4 ? (currentIndex === 4 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 4 ? '2 Dec 2025' : undefined,
        time: currentIndex >= 4 ? '4:00 PM' : undefined,
        metadata: currentIndex >= 4 ? [
          { label: 'TP (Target Price)', value: '₹4,60,000', icon: DollarSign },
          { label: 'C24 Price', value: '₹4,35,000', icon: DollarSign },
          { label: 'Margin / Income %', value: '7% (₹30,000)', icon: TrendingUp },
        ] : undefined,
      },
      {
        id: 'ocb_raised',
        label: ocbStatus === 'running' ? 'OCB Running' : 'OCB Raised',
        status: currentIndex >= 5 ? (currentIndex === 5 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 5 ? '2 Dec 2025' : undefined,
        time: currentIndex >= 5 ? '4:15 PM' : undefined,
        metadata: currentIndex >= 5 ? [
          { label: 'Status', value: ocbStatus === 'running' ? 'OCB Running' : 'OCB Raised (Closed)', icon: FileText },
          { label: 'OCB / Nego Price', value: '₹4,50,000', icon: DollarSign },
          { label: 'TP band', value: '₹4,45,000 – ₹4,55,000', icon: TrendingUp },
        ] : undefined,
      },
      {
        id: 'pr_confirmed',
        label: 'PR Punched',
        status: currentIndex >= 6 ? (currentIndex === 6 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 6 ? '2 Dec 2025' : undefined,
        time: currentIndex >= 6 ? '5:05 PM' : undefined,
        metadata: currentIndex >= 6 ? [
          { label: 'Customer payout (CP)', value: '₹4,05,000', icon: DollarSign },
          { label: 'RA name', value: 'Rajesh Kumar', icon: User },
        ] : undefined,
      },
      {
        id: 'stockin',
        label: 'Stock-in',
        status: currentIndex >= 7 ? (currentIndex === 7 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 7 ? '3 Dec 2025' : undefined,
        time: currentIndex >= 7 ? '11:20 AM' : undefined,
        metadata: currentIndex >= 7 ? [
          { label: 'Payment Type', value: 'RC', icon: CreditCard },
        ] : undefined,
      },
      {
        id: 'payout',
        label: 'Payout',
        status: currentIndex >= 8 ? 'completed' : 'pending',
        date: currentIndex >= 8 ? '3 Dec 2025' : undefined,
        time: currentIndex >= 8 ? '11:22 AM' : undefined,
        metadata: currentIndex >= 8 ? [
          { label: 'Payout amount', value: '₹4,05,000', icon: DollarSign },
          { label: 'UTR', value: 'UTR-HDFC-20251203-4412', icon: FileText },
        ] : undefined,
      },
    ];
  };

  const getC2DTimeline = (): TimelineStage[] => {
    const stages = [
      'lead_created',
      'contact_completed',
      'inspection_ocb',
      'lead_purchased',
      'dealer_reinspection',
      'im_raised',
      'mode_selected',
      'payment_initiated',
      'stockin_stockout',
      'payout',
    ];

    const currentIndex = stages.indexOf(currentStage);
    
    // If seller backout and lead fee refunded, stop showing stages after backout
    const showRemainingStages = !(sellerBackout && leadFeeRefunded);

    return [
      {
        id: 'lead_created',
        label: 'Lead Created',
        status: currentIndex >= 0 ? 'completed' : 'pending',
        date: '4 Dec 2025',
        time: '9:30 AM',
        metadata: [
          { label: 'CEP entered by KAM', value: '₹4,20,000', icon: DollarSign },
        ],
      },
      {
        id: 'contact_completed',
        label: 'Dealer Contact',
        status: currentIndex >= 1 ? (currentIndex === 1 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 1 ? '4 Dec 2025' : undefined,
        time: currentIndex >= 1 ? '9:50 AM' : undefined,
        metadata: currentIndex >= 1 ? [
          { label: 'KAM', value: 'Priya Sharma • +91 98765 22002', icon: User },
        ] : undefined,
      },
      {
        id: 'inspection_ocb',
        label: 'Inspection & OCB Raised',
        status: currentIndex >= 2 ? (currentIndex === 2 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 2 ? '4 Dec 2025' : undefined,
        time: currentIndex >= 2 ? '11:00 AM' : undefined,
        metadata: currentIndex >= 2 ? [
          { label: 'Status', value: ocbStatus === 'running' ? 'OCB Running' : 'OCB Raised (Closed)', icon: FileText },
          { label: 'OCB Price', value: '₹4,20,000', icon: DollarSign },
          { label: 'TP band', value: '₹4,10,000 – ₹4,25,000', icon: TrendingUp },
        ] : undefined,
      },
      {
        id: 'lead_purchased',
        label: 'Lead Purchased',
        status: currentIndex >= 3 ? (currentIndex === 3 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 3 ? '4 Dec 2025' : undefined,
        time: currentIndex >= 3 ? '12:10 PM' : undefined,
        metadata: currentIndex >= 3 ? [
          { label: 'Buying Dealer', value: 'Gupta Auto World (GGN-001)', icon: Building2 },
          { label: 'Region', value: 'Gurugram', icon: MapPin },
          { label: 'Purchase price (C24)', value: '₹4,10,000', icon: DollarSign },
        ] : undefined,
      },
      {
        id: 'dealer_reinspection',
        label: 'Dealer Re-inspection',
        status: currentIndex >= 4 ? (currentIndex === 4 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 4 ? '4 Dec 2025' : undefined,
        time: currentIndex >= 4 ? '2:15 PM' : undefined,
        metadata: currentIndex >= 4 ? [
          { label: 'Buying Dealer & Region', value: 'Gupta Auto World – Gurugram', icon: Building2 },
          { label: 'Mode', value: 'Physical', icon: FileText },
        ] : undefined,
      },
      {
        id: 'im_raised',
        label: 'IM Raised',
        status: currentIndex >= 5 ? (currentIndex === 5 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 5 ? '4 Dec 2025' : undefined,
        time: currentIndex >= 5 ? '2:20 PM' : undefined,
        metadata: currentIndex >= 5 ? [
          { label: 'IM Raised', value: 'Yes', icon: AlertTriangle },
          { label: 'IM Status', value: 'Approved', icon: Check },
          { label: 'Refund Status', value: 'Not Refunded', icon: FileText },
        ] : undefined,
      },
      {
        id: 'mode_selected',
        label: 'Mode Selected',
        status: !showRemainingStages ? 'pending' : currentIndex >= 6 ? (currentIndex === 6 ? 'current' : 'completed') : 'pending',
        date: !showRemainingStages ? undefined : currentIndex >= 6 ? '4 Dec 2025' : undefined,
        time: !showRemainingStages ? undefined : currentIndex >= 6 ? '2:25 PM' : undefined,
        metadata: !showRemainingStages ? undefined : currentIndex >= 6 ? [
          { label: 'Mode', value: 'Full Assist', icon: TrendingUp },
        ] : undefined,
      },
      {
        id: 'payment_initiated',
        label: 'Payment Initiated',
        status: !showRemainingStages ? 'pending' : currentIndex >= 7 ? (currentIndex === 7 ? 'current' : 'completed') : 'pending',
        date: !showRemainingStages ? undefined : currentIndex >= 7 ? '4 Dec 2025' : undefined,
        time: !showRemainingStages ? undefined : currentIndex >= 7 ? '3:00 PM' : undefined,
        metadata: !showRemainingStages ? undefined : currentIndex >= 7 ? [
          { label: 'Payment to Selling Dealer', value: '₹4,10,000', icon: DollarSign },
          { label: 'Bank reference / UTR', value: 'UTR-HDFC-20251204-8812', icon: FileText },
        ] : undefined,
      },
      {
        id: 'stockin_stockout',
        label: 'Stock-in / Stock-out',
        status: !showRemainingStages ? 'pending' : currentIndex >= 8 ? (currentIndex === 8 ? 'current' : 'completed') : 'pending',
        date: !showRemainingStages ? undefined : currentIndex >= 8 ? '4 Dec 2025' : undefined,
        time: !showRemainingStages ? undefined : currentIndex >= 8 ? '5:10 PM' : undefined,
        metadata: !showRemainingStages ? undefined : currentIndex >= 8 ? [
          { label: 'Stock-in', value: '4 Dec 2025, 5:10 PM – Gurugram Yard', icon: MapPin },
          { label: 'Stock-out', value: '5 Dec 2025, 11:00 AM – Delivered to Gupta Auto World', icon: MapPin },
        ] : undefined,
      },
      {
        id: 'payout',
        label: 'Payout',
        status: !showRemainingStages ? 'pending' : currentIndex >= 9 ? 'completed' : 'pending',
        date: !showRemainingStages ? undefined : currentIndex >= 9 ? '5 Dec 2025' : undefined,
        time: !showRemainingStages ? undefined : currentIndex >= 9 ? '2:30 PM' : undefined,
        metadata: !showRemainingStages ? undefined : currentIndex >= 9 ? [
          { label: 'Payout amount', value: '₹4,10,000', icon: DollarSign },
          { label: 'UTR', value: 'UTR-HDFC-20251205-9921', icon: FileText },
        ] : undefined,
      },
    ];
  };

  const getDCFTimeline = (): TimelineStage[] => {
    const stages = [
      'lead_submitted',
      'docs_submitted',
      'cibil_check',
      'loan_approved',
      'inspection_done',
      'disbursed',
    ];

    const currentIndex = stages.indexOf(currentStage);

    return [
      {
        id: 'lead_submitted',
        label: 'Lead Submitted',
        status: currentIndex >= 0 ? 'completed' : 'pending',
        date: '2 Dec 2025',
        time: '11:00 AM',
        metadata: [
          { label: 'Dealer name & code', value: 'Daily Motoz • DR080433', icon: Building2 },
          { label: 'Loan amount requested', value: '₹2,80,000', icon: DollarSign },
          { label: 'Car details', value: 'Maruti Swift VXI 2019', icon: FileText },
        ],
      },
      {
        id: 'docs_submitted',
        label: 'Docs Submitted',
        status: currentIndex >= 1 ? (currentIndex === 1 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 1 ? '3 Dec 2025' : undefined,
        time: currentIndex >= 1 ? '4:30 PM' : undefined,
        metadata: currentIndex >= 1 ? [
          { label: 'Date & time docs uploaded', value: '3 Dec 2025, 4:30 PM', icon: Clock },
          { label: 'Docs count', value: '7/7 received', icon: FileText },
        ] : undefined,
      },
      {
        id: 'cibil_check',
        label: 'CIBIL Check',
        status: currentIndex >= 2 ? (currentIndex === 2 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 2 ? '4 Dec 2025' : undefined,
        time: currentIndex >= 2 ? '10:15 AM' : undefined,
        metadata: currentIndex >= 2 ? [
          { label: 'Status', value: 'Approved ✓', icon: Check },
          { label: 'Score', value: '742', icon: TrendingUp },
        ] : undefined,
      },
      {
        id: 'loan_approved',
        label: 'Loan Approved',
        status: currentIndex >= 3 ? (currentIndex === 3 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 3 ? '5 Dec 2025' : undefined,
        time: currentIndex >= 3 ? '2:00 PM' : undefined,
        metadata: currentIndex >= 3 ? [
          { label: 'Approved amount', value: '₹2,80,000', icon: DollarSign },
          { label: 'Tenure & ROI', value: '36 months @ 11.5% p.a.', icon: TrendingUp },
          { label: 'EMI amount', value: '₹9,250/month', icon: DollarSign },
          { label: 'Sanction date', value: '5 Dec 2025', icon: Clock },
        ] : undefined,
      },
      {
        id: 'inspection_done',
        label: 'Inspection Done',
        status: currentIndex >= 4 ? (currentIndex === 4 ? 'current' : 'completed') : 'pending',
        date: currentIndex >= 4 ? '6 Dec 2025' : undefined,
        time: currentIndex >= 4 ? '11:30 AM' : undefined,
        metadata: currentIndex >= 4 ? [
          { label: 'Vehicle inspection date & time', value: '6 Dec 2025, 11:30 AM', icon: Clock },
          { label: 'Location', value: 'Dealer yard', icon: MapPin },
          { label: 'Valuation', value: '₹4,20,000', icon: DollarSign },
        ] : undefined,
      },
      {
        id: 'disbursed',
        label: 'Disbursed',
        status: currentIndex >= 5 ? 'completed' : 'pending',
        date: currentIndex >= 5 ? '7 Dec 2025' : undefined,
        time: currentIndex >= 5 ? '3:45 PM' : undefined,
        metadata: currentIndex >= 5 ? [
          { label: 'Disbursed amount', value: '₹2,80,000', icon: DollarSign },
          { label: 'Disbursal to', value: 'Dealer – Daily Motoz', icon: Building2 },
          { label: 'UTR', value: 'UTR-KOTAK-20251207-6621', icon: FileText },
          { label: 'Dealer margin', value: '₹15,000', icon: DollarSign },
          { label: 'CARS24 NBFC margin', value: '₹12,000', icon: DollarSign },
        ] : undefined,
      },
    ];
  };

  const stages = getTimelineStages();
  const currentStageIndex = stages.findIndex(s => s.id === currentStage);

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const getVisibleStages = () => {
    if (isFullJourneyExpanded) {
      return stages;
    }

    // Show current + 1 before + 1 after
    const visibleIndices = new Set<number>();
    
    if (currentStageIndex !== -1) {
      visibleIndices.add(currentStageIndex);
      if (currentStageIndex > 0) visibleIndices.add(currentStageIndex - 1);
      if (currentStageIndex < stages.length - 1) visibleIndices.add(currentStageIndex + 1);
    }

    return stages.filter((_, index) => visibleIndices.has(index));
  };

  const visibleStages = getVisibleStages();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900">Lead Journey</h2>
        <span className={`px-3 py-1 rounded-lg text-xs ${
          channel === 'C2B' ? 'bg-blue-100 text-blue-700' :
          channel === 'GS' ? 'bg-purple-100 text-purple-700' :
          channel === 'C2D' ? 'bg-green-100 text-green-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {channel} Flow
        </span>
      </div>

      {/* DCF Conversion Partner Badge */}
      {channel === 'DCF' && (
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-700" />
            <div>
              <div className="text-xs text-amber-600">Conversion Partner</div>
              <div className="text-sm text-amber-900">Shriram Finance</div>
            </div>
          </div>
        </div>
      )}

      {/* Seller Backout Notice (C2D only) */}
      {channel === 'C2D' && sellerBackout && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-red-900 mb-1">Seller Backout</div>
              <div className="text-xs text-red-700 space-y-1">
                <div>Seller backout date: 4 Dec 2025, 1:30 PM</div>
                <div>Lead fee refunded: {leadFeeRefunded ? 'Yes' : 'No'}</div>
                {leadFeeRefunded && (
                  <div className="mt-2 pt-2 border-t border-red-200 italic">
                    No further actions – lead fee refunded
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {visibleStages.map((stage, index) => {
          const isExpanded = expandedStages.has(stage.id);
          const hasMetadata = stage.metadata && stage.metadata.length > 0;
          const isDisabledDueToBackout = channel === 'C2D' && sellerBackout && leadFeeRefunded && 
            ['mode_selected', 'payment_initiated', 'stockin_stockout', 'payout'].includes(stage.id);
          
          return (
            <div key={stage.id} className="relative">
              {/* Connector Line */}
              {index < visibleStages.length - 1 && (
                <div
                  className={`absolute left-4 top-10 w-0.5 h-full ${
                    stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Stage Card */}
              <button
                onClick={() => hasMetadata && !isDisabledDueToBackout && toggleStage(stage.id)}
                disabled={isDisabledDueToBackout}
                className={`w-full text-left transition-all ${
                  isDisabledDueToBackout 
                    ? 'cursor-not-allowed opacity-50'
                    : hasMetadata 
                      ? 'cursor-pointer hover:bg-gray-50' 
                      : 'cursor-default'
                } rounded-lg`}
              >
                <div
                  className={`relative border rounded-lg p-3 ${
                    isDisabledDueToBackout
                      ? 'bg-gray-50 border-gray-200'
                      : stage.status === 'completed'
                      ? 'bg-white border-gray-200'
                      : stage.status === 'current'
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDisabledDueToBackout
                          ? 'bg-gray-300'
                          : stage.status === 'completed'
                          ? 'bg-green-500'
                          : stage.status === 'current'
                          ? 'bg-blue-500'
                          : 'bg-gray-200'
                      }`}
                    >
                      {stage.status === 'completed' && !isDisabledDueToBackout ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : stage.status === 'current' && !isDisabledDueToBackout ? (
                        <Circle className="w-4 h-4 text-white fill-current" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-500" />
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-sm ${
                            isDisabledDueToBackout
                              ? 'text-gray-400'
                              : stage.status === 'completed'
                              ? 'text-gray-900'
                              : stage.status === 'current'
                              ? 'text-blue-900'
                              : 'text-gray-500'
                          }`}
                        >
                          {stage.label}
                        </h3>
                        {hasMetadata && !isDisabledDueToBackout && (
                          <div className="flex-shrink-0 ml-2">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {stage.date && !isDisabledDueToBackout && (
                        <div className="text-xs text-gray-500">
                          {stage.date} {stage.time && `• ${stage.time}`}
                        </div>
                      )}

                      {isDisabledDueToBackout && (
                        <div className="text-xs text-gray-400 italic">
                          No further actions – lead fee refunded
                        </div>
                      )}

                      {/* Expanded Metadata */}
                      {hasMetadata && isExpanded && !isDisabledDueToBackout && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2.5">
                          {stage.metadata!.map((meta, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              {meta.icon && <meta.icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-600">{meta.label}</div>
                                {meta.isButton ? (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      meta.buttonAction?.();
                                    }}
                                    className="text-blue-600 hover:text-blue-700 underline mt-0.5 cursor-pointer inline-block"
                                  >
                                    {meta.value}
                                  </div>
                                ) : (
                                  <div className="text-gray-900">{meta.value}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse Toggle */}
      <button
        onClick={() => setIsFullJourneyExpanded(!isFullJourneyExpanded)}
        className="w-full mt-4 pt-4 border-t border-gray-200 text-sm text-blue-600 hover:text-blue-700 transition-colors"
      >
        {isFullJourneyExpanded ? 'Collapse journey' : `View full journey (${stages.length} stages)`}
      </button>

      {/* Progress Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">Progress</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{
                width: `${(stages.filter(s => s.status === 'completed').length / stages.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-sm text-gray-700">
            {stages.filter(s => s.status === 'completed').length}/{stages.length}
          </span>
        </div>
      </div>
    </div>
  );
}