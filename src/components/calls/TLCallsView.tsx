import { useState } from 'react';
import { Search, Phone, Filter, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, User, ChevronDown } from 'lucide-react';

type CallOutcome = 'connected_positive' | 'connected_neutral' | 'connected_negative' | 'not_reachable' | 'switched_off' | 'wrong_number' | 'call_back_later';
type ProductiveStatus = 'productive' | 'non_productive' | 'unknown';
type Channel = 'C2B' | 'C2D' | 'GS' | 'DCF';

interface Call {
  id: string;
  dealerName: string;
  dealerCode: string;
  city: string;
  contactName: string;
  contactPhone: string;
  kamName: string;
  date: string;
  time: string;
  duration: string;
  outcome: CallOutcome;
  productive: ProductiveStatus;
  channel: Channel;
}

export function TLCallsView() {
  const [selectedKAM, setSelectedKAM] = useState<string>('all');
  const [selectedTime, setSelectedTime] = useState<string>('mtd');
  const [searchQuery, setSearchQuery] = useState('');
  const [showKAMDropdown, setShowKAMDropdown] = useState(false);
  
  // Filter state
  const [activeFilterTab, setActiveFilterTab] = useState<'kam' | 'outcome' | 'time' | 'productive' | 'channel'>('kam');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [selectedProductive, setSelectedProductive] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  const kams = [
    { id: 'all', name: 'All KAMs' },
    { id: 'k1', name: 'Rajesh Kumar' },
    { id: 'k2', name: 'Priya Sharma' },
    { id: 'k3', name: 'Amit Patel' },
  ];

  // Mock metrics data
  const metrics = {
    totalCalls: 47,
    connectRate: 68,
    avgDuration: '4m 35s',
    productiveRate: 72,
    callsPerKAM: 15.7,
  };

  // Mock calls data
  const calls: Call[] = [
    {
      id: 'c1',
      dealerName: 'Daily Motoz',
      dealerCode: 'DR080433',
      city: 'Gurugram',
      contactName: 'Ramesh Kumar',
      contactPhone: '+91 98765 43210',
      kamName: 'Rajesh Kumar',
      date: '12 Dec',
      time: '10:15 AM',
      duration: '5m 10s',
      outcome: 'connected_positive',
      productive: 'productive',
      channel: 'C2B',
    },
    {
      id: 'c2',
      dealerName: 'Gupta Auto World',
      dealerCode: 'GGN-001',
      city: 'Gurugram',
      contactName: 'Suresh Gupta',
      contactPhone: '+91 98765 43211',
      kamName: 'Priya Sharma',
      date: '11 Dec',
      time: '6:05 PM',
      duration: '3m 40s',
      outcome: 'not_reachable',
      productive: 'non_productive',
      channel: 'C2D',
    },
    {
      id: 'c3',
      dealerName: 'Sharma Motors',
      dealerCode: 'GGN-002',
      city: 'Gurugram',
      contactName: 'Vijay Sharma',
      contactPhone: '+91 98765 43212',
      kamName: 'Amit Patel',
      date: '10 Dec',
      time: '2:20 PM',
      duration: '7m 05s',
      outcome: 'connected_neutral',
      productive: 'productive',
      channel: 'DCF',
    },
    {
      id: 'c4',
      dealerName: 'Goyal Auto World',
      dealerCode: 'GGN-005',
      city: 'Gurugram',
      contactName: 'Amit Goyal',
      contactPhone: '+91 98765 43213',
      kamName: 'Rajesh Kumar',
      date: '9 Dec',
      time: '11:45 AM',
      duration: '2m 10s',
      outcome: 'call_back_later',
      productive: 'unknown',
      channel: 'C2B',
    },
    {
      id: 'c5',
      dealerName: 'Ravi Auto Sales',
      dealerCode: 'GGN-008',
      city: 'Gurugram',
      contactName: 'Ravi Singh',
      contactPhone: '+91 98765 43214',
      kamName: 'Priya Sharma',
      date: '9 Dec',
      time: '9:30 AM',
      duration: '6m 20s',
      outcome: 'connected_positive',
      productive: 'productive',
      channel: 'C2B',
    },
  ];

  const getOutcomeLabel = (outcome: CallOutcome) => {
    const labels: Record<CallOutcome, string> = {
      connected_positive: 'Connected – Positive',
      connected_neutral: 'Connected – Neutral',
      connected_negative: 'Connected – Negative',
      not_reachable: 'Not reachable',
      switched_off: 'Switched off',
      wrong_number: 'Wrong number',
      call_back_later: 'Call back later',
    };
    return labels[outcome];
  };

  const getOutcomeColor = (outcome: CallOutcome) => {
    if (outcome.startsWith('connected_positive')) return 'bg-green-100 text-green-700';
    if (outcome.startsWith('connected_neutral')) return 'bg-blue-100 text-blue-700';
    if (outcome.startsWith('connected_negative')) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  const resetFilters = () => {
    setSelectedKAM('all');
    setSelectedOutcome('all');
    setSelectedTime('mtd');
    setSelectedProductive('all');
    setSelectedChannel('all');
  };

  const selectedKAMName = kams.find(k => k.id === selectedKAM)?.name || 'All KAMs';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with KAM selector and time filter */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-3">
        {/* KAM Selector */}
        <div className="relative">
          <button
            onClick={() => setShowKAMDropdown(!showKAMDropdown)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900"
          >
            <span>{selectedKAMName}</span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
          
          {showKAMDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              {kams.map((kam) => (
                <button
                  key={kam.id}
                  onClick={() => {
                    setSelectedKAM(kam.id);
                    setShowKAMDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedKAM === kam.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {kam.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time filter chips */}
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedTime('today')}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              selectedTime === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedTime('d1')}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              selectedTime === 'd1'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            D-1
          </button>
          <button
            onClick={() => setSelectedTime('l7d')}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              selectedTime === 'l7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            L7D
          </button>
          <button
            onClick={() => setSelectedTime('mtd')}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              selectedTime === 'mtd'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            MTD
          </button>
          <button
            onClick={() => setSelectedTime('last_month')}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              selectedTime === 'last_month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Last Month
          </button>
        </div>
      </div>

      {/* Metrics section */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm text-gray-600">Team Performance</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl text-gray-900">{metrics.totalCalls}</div>
            <div className="text-xs text-gray-600 mt-1">Total calls</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl text-gray-900">{metrics.connectRate}%</div>
            <div className="text-xs text-gray-600 mt-1">Connect rate</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl text-gray-900">{metrics.avgDuration}</div>
            <div className="text-xs text-gray-600 mt-1">Avg duration</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="text-2xl text-gray-900">{metrics.productiveRate}%</div>
            <div className="text-xs text-gray-600 mt-1">Productive %</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 col-span-2">
            <div className="text-2xl text-gray-900">{metrics.callsPerKAM}</div>
            <div className="text-xs text-gray-600 mt-1">Calls per KAM (avg)</div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by dealer, contact, KAM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200">
        {/* Filter tabs */}
        <div className="px-4 pt-3 flex gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveFilterTab('kam')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              activeFilterTab === 'kam'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            KAM
          </button>
          <button
            onClick={() => setActiveFilterTab('outcome')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              activeFilterTab === 'outcome'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Outcome
          </button>
          <button
            onClick={() => setActiveFilterTab('time')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              activeFilterTab === 'time'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Time
          </button>
          <button
            onClick={() => setActiveFilterTab('productive')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              activeFilterTab === 'productive'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Productive
          </button>
          <button
            onClick={() => setActiveFilterTab('channel')}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              activeFilterTab === 'channel'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Channel
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 whitespace-nowrap"
          >
            Reset
          </button>
        </div>

        {/* Filter chips */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto">
          {activeFilterTab === 'kam' && (
            <>
              {kams.map((kam) => (
                <button
                  key={kam.id}
                  onClick={() => setSelectedKAM(kam.id)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                    selectedKAM === kam.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700'
                  }`}
                >
                  {kam.name}
                </button>
              ))}
            </>
          )}

          {activeFilterTab === 'outcome' && (
            <>
              <button
                onClick={() => setSelectedOutcome('all')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedOutcome === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedOutcome('connected')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedOutcome === 'connected'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                Connected
              </button>
              <button
                onClick={() => setSelectedOutcome('not_reachable')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedOutcome === 'not_reachable'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                Not reachable
              </button>
              <button
                onClick={() => setSelectedOutcome('switched_off')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedOutcome === 'switched_off'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                Switched off
              </button>
            </>
          )}

          {activeFilterTab === 'time' && (
            <>
              <button
                onClick={() => setSelectedTime('today')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedTime === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedTime('d1')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedTime === 'd1'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                D-1
              </button>
              <button
                onClick={() => setSelectedTime('l7d')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedTime === 'l7d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setSelectedTime('mtd')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedTime === 'mtd'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                MTD
              </button>
            </>
          )}

          {activeFilterTab === 'productive' && (
            <>
              <button
                onClick={() => setSelectedProductive('all')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedProductive === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedProductive('productive')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedProductive === 'productive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                Productive only
              </button>
              <button
                onClick={() => setSelectedProductive('non_productive')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedProductive === 'non_productive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                Non-productive only
              </button>
            </>
          )}

          {activeFilterTab === 'channel' && (
            <>
              <button
                onClick={() => setSelectedChannel('all')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedChannel === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedChannel('c2b')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedChannel === 'c2b'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                C2B
              </button>
              <button
                onClick={() => setSelectedChannel('c2d')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedChannel === 'c2d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                C2D
              </button>
              <button
                onClick={() => setSelectedChannel('gs')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedChannel === 'gs'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                GS
              </button>
              <button
                onClick={() => setSelectedChannel('dcf')}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  selectedChannel === 'dcf'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                DCF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Calls list */}
      <div className="p-4 space-y-3">
        {calls.map((call) => (
          <div
            key={call.id}
            className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                {/* Dealer info */}
                <div className="flex items-center gap-2">
                  <h3 className="text-gray-900">{call.dealerName}</h3>
                  <span className="text-xs text-gray-500">
                    {call.dealerCode}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {call.city}
                  </span>
                </div>

                {/* Contact */}
                <div className="text-sm text-gray-600">
                  {call.contactName} • {call.contactPhone}
                </div>

                {/* KAM */}
                <div className="text-sm text-gray-700">
                  KAM: {call.kamName}
                </div>

                {/* Date/time/duration */}
                <div className="text-xs text-gray-500">
                  {call.date} • {call.time} • {call.duration}
                </div>

                {/* Pills */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${getOutcomeColor(call.outcome)}`}>
                    {getOutcomeLabel(call.outcome)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      call.productive === 'productive'
                        ? 'bg-green-100 text-green-700'
                        : call.productive === 'non_productive'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {call.productive === 'productive'
                      ? 'Productive'
                      : call.productive === 'non_productive'
                      ? 'Non-productive'
                      : 'Not analysed'}
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
