import { ArrowLeft, IndianRupee } from 'lucide-react';
import { Badge } from '../ui/badge';

interface DCFDisbursalsListPageProps {
  onBack: () => void;
  dateRange: string;
}

interface DisbursalRow {
  id: string;
  loanId: string;
  customerName: string;
  dealerName: string;
  dealerCode: string;
  car: string;
  amount: string;
  amountValue: number;
  disbursedDate: string;
  tenure: string;
}

export function DCFDisbursalsListPage({ onBack, dateRange }: DCFDisbursalsListPageProps) {
  const disbursals: DisbursalRow[] = [
    { 
      id: '1', 
      loanId: 'DCF24120001', 
      customerName: 'Vikram Singh', 
      dealerName: 'Royal Auto Sales', 
      dealerCode: 'GGN-045',
      car: 'Hyundai Creta SX 2021', 
      amount: '₹4.2L',
      amountValue: 420000,
      disbursedDate: '2024-12-07',
      tenure: '36 months'
    },
    { 
      id: '2', 
      loanId: 'DCF24120002', 
      customerName: 'Kavita Sharma', 
      dealerName: 'Highway Auto', 
      dealerCode: 'FBD-112',
      car: 'Honda Jazz VX 2020', 
      amount: '₹3.8L',
      amountValue: 380000,
      disbursedDate: '2024-12-05',
      tenure: '24 months'
    },
    { 
      id: '3', 
      loanId: 'DCF24120003', 
      customerName: 'Sneha Reddy', 
      dealerName: 'Sharma Motors', 
      dealerCode: 'GGN-002',
      car: 'Maruti Baleno Alpha 2021', 
      amount: '₹3.5L',
      amountValue: 350000,
      disbursedDate: '2024-12-03',
      tenure: '36 months'
    },
    { 
      id: '4', 
      loanId: 'DCF24110004', 
      customerName: 'Rajesh Kumar', 
      dealerName: 'Gupta Auto World', 
      dealerCode: 'GGN-001',
      car: 'Honda City VX 2019', 
      amount: '₹4.5L',
      amountValue: 450000,
      disbursedDate: '2024-11-29',
      tenure: '48 months'
    },
    { 
      id: '5', 
      loanId: 'DCF24110005', 
      customerName: 'Priya Malhotra', 
      dealerName: 'Elite Auto World', 
      dealerCode: 'GGN-098',
      car: 'Hyundai Venue SX 2020', 
      amount: '₹3.2L',
      amountValue: 320000,
      disbursedDate: '2024-11-28',
      tenure: '36 months'
    },
    { 
      id: '6', 
      loanId: 'DCF24110006', 
      customerName: 'Amit Joshi', 
      dealerName: 'Delhi Car Bazaar', 
      dealerCode: 'DLH-034',
      car: 'Maruti Swift VXI 2020', 
      amount: '₹2.8L',
      amountValue: 280000,
      disbursedDate: '2024-11-26',
      tenure: '24 months'
    },
    { 
      id: '7', 
      loanId: 'DCF24110007', 
      customerName: 'Deepak Verma', 
      dealerName: 'Metro Motors', 
      dealerCode: 'NDA-056',
      car: 'Hyundai i20 Sportz 2021', 
      amount: '₹3.6L',
      amountValue: 360000,
      disbursedDate: '2024-11-25',
      tenure: '36 months'
    },
    { 
      id: '8', 
      loanId: 'DCF24110008', 
      customerName: 'Sunita Agarwal', 
      dealerName: 'Premium Car Point', 
      dealerCode: 'GGN-134',
      car: 'Honda Amaze VX 2020', 
      amount: '₹2.9L',
      amountValue: 290000,
      disbursedDate: '2024-11-23',
      tenure: '24 months'
    },
    { 
      id: '9', 
      loanId: 'DCF24110009', 
      customerName: 'Manoj Yadav', 
      dealerName: 'Star Auto Sales', 
      dealerCode: 'DLH-123',
      car: 'Maruti Dzire VXI 2019', 
      amount: '₹3.1L',
      amountValue: 310000,
      disbursedDate: '2024-11-22',
      tenure: '36 months'
    },
    { 
      id: '10', 
      loanId: 'DCF24110010', 
      customerName: 'Anjali Kapoor', 
      dealerName: 'New City Autos', 
      dealerCode: 'NDA-078',
      car: 'Hyundai Creta E 2020', 
      amount: '₹4.8L',
      amountValue: 480000,
      disbursedDate: '2024-11-20',
      tenure: '48 months'
    },
    { 
      id: '11', 
      loanId: 'DCF24110011', 
      customerName: 'Rahul Singh', 
      dealerName: 'Trust Motors', 
      dealerCode: 'NDA-101',
      car: 'Maruti Ertiga VXI 2020', 
      amount: '₹4.0L',
      amountValue: 400000,
      disbursedDate: '2024-11-18',
      tenure: '36 months'
    },
    { 
      id: '12', 
      loanId: 'DCF24110012', 
      customerName: 'Neha Gupta', 
      dealerName: 'Speed Auto Point', 
      dealerCode: 'FBD-067',
      car: 'Honda City ZX 2021', 
      amount: '₹5.2L',
      amountValue: 520000,
      disbursedDate: '2024-11-15',
      tenure: '48 months'
    },
    { 
      id: '13', 
      loanId: 'DCF24110013', 
      customerName: 'Sanjay Sharma', 
      dealerName: 'Gupta Auto World', 
      dealerCode: 'GGN-001',
      car: 'Maruti Baleno Delta 2020', 
      amount: '₹3.3L',
      amountValue: 330000,
      disbursedDate: '2024-11-13',
      tenure: '36 months'
    },
    { 
      id: '14', 
      loanId: 'DCF24110014', 
      customerName: 'Pooja Reddy', 
      dealerName: 'Royal Auto Sales', 
      dealerCode: 'GGN-045',
      car: 'Hyundai Venue S 2020', 
      amount: '₹3.0L',
      amountValue: 300000,
      disbursedDate: '2024-11-12',
      tenure: '24 months'
    },
    { 
      id: '15', 
      loanId: 'DCF24110015', 
      customerName: 'Anil Kumar', 
      dealerName: 'Highway Auto', 
      dealerCode: 'FBD-112',
      car: 'Maruti Swift VXI 2021', 
      amount: '₹3.4L',
      amountValue: 340000,
      disbursedDate: '2024-11-10',
      tenure: '36 months'
    },
    { 
      id: '16', 
      loanId: 'DCF24110016', 
      customerName: 'Ritu Malhotra', 
      dealerName: 'Elite Auto World', 
      dealerCode: 'GGN-098',
      car: 'Honda Amaze S 2019', 
      amount: '₹2.6L',
      amountValue: 260000,
      disbursedDate: '2024-11-08',
      tenure: '24 months'
    },
    { 
      id: '17', 
      loanId: 'DCF24110017', 
      customerName: 'Vikas Joshi', 
      dealerName: 'Delhi Car Bazaar', 
      dealerCode: 'DLH-034',
      car: 'Hyundai i20 Asta 2021', 
      amount: '₹3.9L',
      amountValue: 390000,
      disbursedDate: '2024-11-05',
      tenure: '36 months'
    },
    { 
      id: '18', 
      loanId: 'DCF24110018', 
      customerName: 'Meena Singh', 
      dealerName: 'Metro Motors', 
      dealerCode: 'NDA-056',
      car: 'Maruti Ertiga ZXI 2020', 
      amount: '₹4.3L',
      amountValue: 430000,
      disbursedDate: '2024-11-02',
      tenure: '48 months'
    },
  ];

  const filterChips = [
    { label: 'Section', value: 'Loans' },
    { label: 'Status', value: 'All' },
    { label: 'Channel', value: 'DCF' },
    { label: 'Stage', value: 'Disbursed' },
    { label: 'Date', value: dateRange },
  ];

  // Calculate total
  const totalAmount = disbursals.reduce((sum, d) => sum + d.amountValue, 0);
  const formatTotal = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-gray-900">DCF Disbursals</h1>
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

      {/* Summary Stats */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Total Amount</div>
            <div className="text-xl text-green-600 flex items-center gap-1 font-semibold">
              <IndianRupee className="w-5 h-5" />
              {formatTotal(totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Total Loans</div>
            <div className="text-xl text-gray-900 font-semibold">{disbursals.length}</div>
          </div>
        </div>
      </div>

      {/* Disbursals List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {disbursals.map((disbursal) => (
          <div
            key={disbursal.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="text-gray-900 mb-1">{disbursal.customerName}</div>
                <div className="text-xs text-gray-500">{disbursal.loanId}</div>
              </div>
              <div className="text-right">
                <div className="text-lg text-green-600 flex items-center justify-end gap-1 font-semibold">
                  <IndianRupee className="w-4 h-4" />
                  {disbursal.amount.replace('₹', '')}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{disbursal.tenure}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-xs text-gray-500">Car</div>
                <div className="text-xs text-gray-900">{disbursal.car}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Dealer</div>
                  <div className="text-xs text-gray-900">{disbursal.dealerName} • {disbursal.dealerCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Disbursed</div>
                  <div className="text-xs text-gray-900">{disbursal.disbursedDate}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
