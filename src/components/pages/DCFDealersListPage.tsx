import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';

interface DCFDealersListPageProps {
  onBack: () => void;
  filterType: 'onboarded' | 'leadGiving';
  dateRange: string;
  onDealerClick: (dealerId: string) => void;
}

interface DealerRow {
  id: string;
  name: string;
  code: string;
  city: string;
  status: string;
  dcfLeads?: number;
  mtdLeads?: number;
  mtdDisbursals?: number;
}

export function DCFDealersListPage({ onBack, filterType, dateRange, onDealerClick }: DCFDealersListPageProps) {
  // Mock dealer data based on filter type
  const dealers: DealerRow[] = filterType === 'onboarded' 
    ? [
        { id: '1', name: 'Gupta Auto World', code: 'GGN-001', city: 'Gurugram', status: 'Active', mtdLeads: 12, mtdDisbursals: 5 },
        { id: '2', name: 'Sharma Motors', code: 'GGN-002', city: 'Faridabad', status: 'Active', mtdLeads: 8, mtdDisbursals: 3 },
        { id: '3', name: 'New City Autos', code: 'NDA-078', city: 'Noida', status: 'Active', mtdLeads: 10, mtdDisbursals: 4 },
        { id: '4', name: 'Prime Auto Hub', code: 'FBD-012', city: 'Faridabad', status: 'Pending Docs', mtdLeads: 6, mtdDisbursals: 2 },
        { id: '5', name: 'Delhi Car Bazaar', code: 'DLH-034', city: 'Delhi', status: 'Active', mtdLeads: 15, mtdDisbursals: 7 },
        { id: '6', name: 'Royal Auto Sales', code: 'GGN-045', city: 'Gurugram', status: 'Active', mtdLeads: 11, mtdDisbursals: 6 },
        { id: '7', name: 'Metro Motors', code: 'NDA-056', city: 'Noida', status: 'Active', mtdLeads: 9, mtdDisbursals: 4 },
        { id: '8', name: 'Speed Auto Point', code: 'FBD-067', city: 'Faridabad', status: 'Active', mtdLeads: 7, mtdDisbursals: 3 },
        { id: '9', name: 'City Cars Hub', code: 'DLH-089', city: 'Delhi', status: 'Pending Docs', mtdLeads: 5, mtdDisbursals: 1 },
        { id: '10', name: 'Elite Auto World', code: 'GGN-098', city: 'Gurugram', status: 'Active', mtdLeads: 13, mtdDisbursals: 6 },
        { id: '11', name: 'Trust Motors', code: 'NDA-101', city: 'Noida', status: 'Active', mtdLeads: 8, mtdDisbursals: 3 },
        { id: '12', name: 'Highway Auto', code: 'FBD-112', city: 'Faridabad', status: 'Active', mtdLeads: 10, mtdDisbursals: 5 },
        { id: '13', name: 'Star Auto Sales', code: 'DLH-123', city: 'Delhi', status: 'Active', mtdLeads: 12, mtdDisbursals: 4 },
        { id: '14', name: 'Premium Car Point', code: 'GGN-134', city: 'Gurugram', status: 'Active', mtdLeads: 14, mtdDisbursals: 7 },
        { id: '15', name: 'Super Auto Traders', code: 'NDA-145', city: 'Noida', status: 'Active', mtdLeads: 11, mtdDisbursals: 5 },
      ]
    : [
        { id: '1', name: 'Gupta Auto World', code: 'GGN-001', city: 'Gurugram', status: 'Active', dcfLeads: 12 },
        { id: '2', name: 'Sharma Motors', code: 'GGN-002', city: 'Faridabad', status: 'Active', dcfLeads: 8 },
        { id: '3', name: 'New City Autos', code: 'NDA-078', city: 'Noida', status: 'Active', dcfLeads: 10 },
        { id: '5', name: 'Delhi Car Bazaar', code: 'DLH-034', city: 'Delhi', status: 'Active', dcfLeads: 15 },
        { id: '6', name: 'Royal Auto Sales', code: 'GGN-045', city: 'Gurugram', status: 'Active', dcfLeads: 11 },
        { id: '7', name: 'Metro Motors', code: 'NDA-056', city: 'Noida', status: 'Active', dcfLeads: 9 },
        { id: '8', name: 'Speed Auto Point', code: 'FBD-067', city: 'Faridabad', status: 'Active', dcfLeads: 7 },
        { id: '10', name: 'Elite Auto World', code: 'GGN-098', city: 'Gurugram', status: 'Active', dcfLeads: 13 },
        { id: '11', name: 'Trust Motors', code: 'NDA-101', city: 'Noida', status: 'Active', dcfLeads: 8 },
        { id: '12', name: 'Highway Auto', code: 'FBD-112', city: 'Faridabad', status: 'Active', dcfLeads: 10 },
        { id: '13', name: 'Star Auto Sales', code: 'DLH-123', city: 'Delhi', status: 'Active', dcfLeads: 12 },
        { id: '14', name: 'Premium Car Point', code: 'GGN-134', city: 'Gurugram', status: 'Active', dcfLeads: 14 },
      ];

  const title = filterType === 'onboarded' ? 'DCF Onboarded Dealers' : 'DCF Lead Giving Dealers';
  const filterChips = filterType === 'onboarded'
    ? [
        { label: 'Section', value: 'Dealers' },
        { label: 'Status', value: 'DCF Onboarded' },
        { label: 'Channel', value: 'DCF' },
        { label: 'Date', value: dateRange },
      ]
    : [
        { label: 'Section', value: 'Dealers' },
        { label: 'Status', value: 'DCF Onboarded' },
        { label: 'Channel', value: 'DCF' },
        { label: 'DCF lead', value: '> 0' },
        { label: 'Date', value: dateRange },
      ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-gray-900">{title}</h1>
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

      {/* Dealers List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {dealers.map((dealer) => (
          <button
            key={dealer.id}
            onClick={() => onDealerClick(dealer.id)}
            className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow active:scale-[0.99]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-gray-900 mb-1">{dealer.name}</div>
                <div className="text-xs text-gray-500">{dealer.code} • {dealer.city}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                    dealer.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {dealer.status}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
            
            {filterType === 'onboarded' && (
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">MTD Leads</div>
                  <div className="text-gray-900 font-medium">{dealer.mtdLeads}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">MTD Disbursals</div>
                  <div className="text-gray-900 font-medium">{dealer.mtdDisbursals}</div>
                </div>
              </div>
            )}
            
            {filterType === 'leadGiving' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-0.5">DCF Leads (MTD)</div>
                <div className="text-gray-900 font-medium">{dealer.dcfLeads}</div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
