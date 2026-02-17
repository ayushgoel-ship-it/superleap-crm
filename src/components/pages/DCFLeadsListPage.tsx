import { ArrowLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';

interface DCFLeadsListPageProps {
  onBack: () => void;
  onLeadClick: (loanId: string) => void;
  dateRange: string;
}

interface LeadRow {
  id: string;
  loanId: string;
  appId: string;
  customerName: string;
  dealerName: string;
  dealerCode: string;
  car: string;
  stage: string;
  date: string;
  stageColor: 'blue' | 'amber' | 'green' | 'gray' | 'red';
  // Enhanced display fields
  carDocs: 'Received' | 'Pending';
  book: 'Own Book' | 'Pmax';
  source: 'Dealer Shared' | 'Partner' | 'Direct';
  funnel: string;
  subStage: string;
  conversionOwner: string;
}

export function DCFLeadsListPage({ onBack, onLeadClick, dateRange }: DCFLeadsListPageProps) {
  const leads: LeadRow[] = [
    {
      id: '1', loanId: 'DCF24120001', appId: 'APP-8801', customerName: 'Vikram Singh',
      dealerName: 'Royal Auto Sales', dealerCode: 'GGN-045', car: 'Hyundai Creta SX 2021',
      stage: 'Disbursed', date: '2024-12-07', stageColor: 'green',
      carDocs: 'Received', book: 'Own Book', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Completed', conversionOwner: 'Rahul M.',
    },
    {
      id: '2', loanId: 'DCF24120002', appId: 'APP-8802', customerName: 'Kavita Sharma',
      dealerName: 'Highway Auto', dealerCode: 'FBD-112', car: 'Honda Jazz VX 2020',
      stage: 'Disbursed', date: '2024-12-05', stageColor: 'green',
      carDocs: 'Received', book: 'Pmax', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Completed', conversionOwner: 'Priya S.',
    },
    {
      id: '3', loanId: 'DCF24120003', appId: 'APP-8803', customerName: 'Sneha Reddy',
      dealerName: 'Sharma Motors', dealerCode: 'GGN-002', car: 'Maruti Baleno Alpha 2021',
      stage: 'Inspection', date: '2024-12-04', stageColor: 'blue',
      carDocs: 'Received', book: 'Own Book', source: 'Partner',
      funnel: 'DCF', subStage: 'Scheduled', conversionOwner: 'Amit K.',
    },
    {
      id: '4', loanId: 'DCF24110004', appId: 'APP-8804', customerName: 'Rajesh Kumar',
      dealerName: 'Gupta Auto World', dealerCode: 'GGN-001', car: 'Honda City VX 2019',
      stage: 'Approved', date: '2024-11-29', stageColor: 'green',
      carDocs: 'Received', book: 'Own Book', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Pending Disbursal', conversionOwner: 'Rahul M.',
    },
    {
      id: '5', loanId: 'DCF24110005', appId: 'APP-8805', customerName: 'Priya Malhotra',
      dealerName: 'Elite Auto World', dealerCode: 'GGN-098', car: 'Hyundai Venue SX 2020',
      stage: 'In Progress', date: '2024-11-28', stageColor: 'amber',
      carDocs: 'Pending', book: 'Pmax', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Doc Verification', conversionOwner: 'Priya S.',
    },
    {
      id: '6', loanId: 'DCF24110006', appId: 'APP-8806', customerName: 'Amit Joshi',
      dealerName: 'Delhi Car Bazaar', dealerCode: 'DLH-034', car: 'Maruti Swift VXI 2020',
      stage: 'Disbursed', date: '2024-11-26', stageColor: 'green',
      carDocs: 'Received', book: 'Own Book', source: 'Direct',
      funnel: 'DCF', subStage: 'Completed', conversionOwner: 'Amit K.',
    },
    {
      id: '7', loanId: 'DCF24110007', appId: 'APP-8807', customerName: 'Deepak Verma',
      dealerName: 'Metro Motors', dealerCode: 'NDA-056', car: 'Hyundai i20 Sportz 2021',
      stage: 'Rejected', date: '2024-11-25', stageColor: 'red',
      carDocs: 'Received', book: 'Own Book', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Credit Reject', conversionOwner: 'Rahul M.',
    },
    {
      id: '8', loanId: 'DCF24110008', appId: 'APP-8808', customerName: 'Sunita Agarwal',
      dealerName: 'Premium Car Point', dealerCode: 'GGN-134', car: 'Honda Amaze VX 2020',
      stage: 'In Progress', date: '2024-11-23', stageColor: 'amber',
      carDocs: 'Pending', book: 'Pmax', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Underwriting', conversionOwner: 'Priya S.',
    },
    {
      id: '9', loanId: 'DCF24110009', appId: 'APP-8809', customerName: 'Manoj Yadav',
      dealerName: 'Star Auto Sales', dealerCode: 'DLH-123', car: 'Maruti Dzire VXI 2019',
      stage: 'Approved', date: '2024-11-22', stageColor: 'green',
      carDocs: 'Received', book: 'Own Book', source: 'Partner',
      funnel: 'DCF', subStage: 'Pending Disbursal', conversionOwner: 'Amit K.',
    },
    {
      id: '10', loanId: 'DCF24110010', appId: 'APP-8810', customerName: 'Anjali Kapoor',
      dealerName: 'New City Autos', dealerCode: 'NDA-078', car: 'Hyundai Creta E 2020',
      stage: 'Disbursed', date: '2024-11-20', stageColor: 'green',
      carDocs: 'Received', book: 'Own Book', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Completed', conversionOwner: 'Rahul M.',
    },
    {
      id: '11', loanId: 'DCF24110011', appId: 'APP-8811', customerName: 'Rahul Singh',
      dealerName: 'Trust Motors', dealerCode: 'NDA-101', car: 'Maruti Ertiga VXI 2020',
      stage: 'Inspection', date: '2024-11-18', stageColor: 'blue',
      carDocs: 'Pending', book: 'Pmax', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Scheduled', conversionOwner: 'Priya S.',
    },
    {
      id: '12', loanId: 'DCF24110012', appId: 'APP-8812', customerName: 'Neha Gupta',
      dealerName: 'Speed Auto Point', dealerCode: 'FBD-067', car: 'Honda City ZX 2021',
      stage: 'Disbursed', date: '2024-11-15', stageColor: 'green',
      carDocs: 'Received', book: 'Own Book', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Completed', conversionOwner: 'Amit K.',
    },
    {
      id: '13', loanId: 'DCF24110013', appId: 'APP-8813', customerName: 'Sanjay Sharma',
      dealerName: 'Gupta Auto World', dealerCode: 'GGN-001', car: 'Maruti Baleno Delta 2020',
      stage: 'In Progress', date: '2024-11-13', stageColor: 'amber',
      carDocs: 'Received', book: 'Own Book', source: 'Direct',
      funnel: 'DCF', subStage: 'Doc Collection', conversionOwner: 'Rahul M.',
    },
    {
      id: '14', loanId: 'DCF24110014', appId: 'APP-8814', customerName: 'Pooja Reddy',
      dealerName: 'Royal Auto Sales', dealerCode: 'GGN-045', car: 'Hyundai Venue S 2020',
      stage: 'Approved', date: '2024-11-12', stageColor: 'green',
      carDocs: 'Received', book: 'Pmax', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Pending Disbursal', conversionOwner: 'Priya S.',
    },
    {
      id: '15', loanId: 'DCF24110015', appId: 'APP-8815', customerName: 'Anil Kumar',
      dealerName: 'Highway Auto', dealerCode: 'FBD-112', car: 'Maruti Swift VXI 2021',
      stage: 'Disbursed', date: '2024-11-10', stageColor: 'green',
      carDocs: 'Received', book: 'Own Book', source: 'Dealer Shared',
      funnel: 'DCF', subStage: 'Completed', conversionOwner: 'Amit K.',
    },
  ];

  const STAGE_COLORS: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-100 text-red-700',
  };

  const filterChips = [
    { label: 'Section', value: 'Leads' },
    { label: 'Status', value: 'All' },
    { label: 'Channel', value: 'DCF' },
    { label: 'Date', value: dateRange },
  ];

  // Stage summary counts
  const stageCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-gray-900">DCF Leads</h1>
        </div>
        
        {/* Filter Chips */}
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {filterChips.map((chip, index) => (
            <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <span className="text-xs">
                {chip.label}: <span className="font-medium">{chip.value}</span>
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Stage Summary */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500 font-medium">Pipeline Summary</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stageCounts).map(([stage, count]) => (
            <span key={stage} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
              {stage}: <span className="font-semibold">{count}</span>
            </span>
          ))}
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-medium">
            Total: {leads.length}
          </span>
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {leads.map((lead) => (
          <button
            key={lead.id}
            onClick={() => onLeadClick(lead.loanId)}
            className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow active:scale-[0.99]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-gray-900 mb-1">{lead.customerName}</div>
                <div className="text-xs text-gray-500">{lead.loanId} &bull; {lead.appId}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${STAGE_COLORS[lead.stageColor]}`}>
                  {lead.stage}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
            
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Car</div>
                  <div className="text-xs text-gray-900">{lead.car}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="text-xs text-gray-900">{lead.date}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Dealer</div>
                  <div className="text-xs text-gray-900">{lead.dealerName} &bull; {lead.dealerCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Source</div>
                  <div className="text-xs text-gray-900">{lead.source}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {lead.book}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${lead.carDocs === 'Received' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  Docs: {lead.carDocs}
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {lead.conversionOwner}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
