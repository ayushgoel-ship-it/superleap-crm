import { useState } from 'react';
import { Search, Bell, ChevronDown, MapPin } from 'lucide-react';
import { TLVisitCard } from './TLVisitCard';
import { TLVisitSummaryCard } from './TLVisitSummaryCard';
import { TLVisitDetailPage } from './TLVisitDetailPage';

type ProductivityStatus = 'productive' | 'neutral' | 'not-productive';

interface Visit {
  id: string;
  dealer: string;
  dealerCode: string;
  city: string;
  kamName: string;
  dealerTags: string[];
  visitDate: string;
  visitTime: string;
  visitType: 'Planned' | 'Ad-hoc';
  visitPurpose: string;
  productivity: ProductivityStatus;
  dealerType: 'top' | 'tagged' | 'untagged';
  postVisitSummary: string;
}

export function TLVisitsView() {
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  
  // TL-specific filters
  const [selectedKAM, setSelectedKAM] = useState<string>('all');
  const [showKAMDropdown, setShowKAMDropdown] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('mtd');
  const [selectedDealerType, setSelectedDealerType] = useState<string>('all');
  const [selectedProductivity, setSelectedProductivity] = useState<string>('all');

  // Mock visit data for TL view
  const allVisits: Visit[] = [
    {
      id: '1',
      dealer: 'Daily Motoz',
      dealerCode: 'DR080433',
      city: 'Gurugram',
      kamName: 'Rajesh Kumar',
      dealerTags: ['Top Dealer', 'DCF Onboarded'],
      visitDate: '8 Dec 2025',
      visitTime: '11:10–11:40 AM',
      visitType: 'Planned',
      visitPurpose: 'Reactivation + DCF onboarding',
      productivity: 'productive',
      dealerType: 'top',
      postVisitSummary: 'Post-visit: +5 leads, Stock-ins 2, DCF leads 3',
    },
    {
      id: '2',
      dealer: 'Royal Car Bazaar',
      dealerCode: 'DEL-045',
      city: 'Delhi',
      kamName: 'Priya Sharma',
      dealerTags: ['Tagged Dealer'],
      visitDate: '7 Dec 2025',
      visitTime: '2:15–2:45 PM',
      visitType: 'Planned',
      visitPurpose: 'Issue Resolution',
      productivity: 'neutral',
      dealerType: 'tagged',
      postVisitSummary: 'Post-visit: No significant change in metrics',
    },
    {
      id: '3',
      dealer: 'New City Autos',
      dealerCode: 'NDA-078',
      city: 'Noida',
      kamName: 'Amit Patel',
      dealerTags: ['Untagged'],
      visitDate: '6 Dec 2025',
      visitTime: '10:00–10:30 AM',
      visitType: 'Ad-hoc',
      visitPurpose: 'Relationship building',
      productivity: 'not-productive',
      dealerType: 'untagged',
      postVisitSummary: 'Post-visit: No change in leads, Lead volume dropped',
    },
    {
      id: '4',
      dealer: 'Prime Auto Hub',
      dealerCode: 'FBD-012',
      city: 'Faridabad',
      kamName: 'Rajesh Kumar',
      dealerTags: ['Top Dealer', 'DCF Onboarded'],
      visitDate: '5 Dec 2025',
      visitTime: '3:30–4:00 PM',
      visitType: 'Planned',
      visitPurpose: 'DCF Training',
      productivity: 'productive',
      dealerType: 'top',
      postVisitSummary: 'Post-visit: +3 leads, DCF onboarded successfully',
    },
    {
      id: '5',
      dealer: 'Gupta Auto World',
      dealerCode: 'GGN-001',
      city: 'Gurugram',
      kamName: 'Priya Sharma',
      dealerTags: ['Tagged Dealer', 'DCF Onboarded'],
      visitDate: '4 Dec 2025',
      visitTime: '11:30 AM–12:00 PM',
      visitType: 'Planned',
      visitPurpose: 'Reactivation',
      productivity: 'productive',
      dealerType: 'tagged',
      postVisitSummary: 'Post-visit: +4 leads, Leads increased from 0 to 4',
    },
    {
      id: '6',
      dealer: 'Sharma Motors',
      dealerCode: 'GGN-002',
      city: 'Gurugram',
      kamName: 'Amit Patel',
      dealerTags: ['Tagged Dealer'],
      visitDate: '3 Dec 2025',
      visitTime: '9:00–9:30 AM',
      visitType: 'Ad-hoc',
      visitPurpose: 'Quick check-in',
      productivity: 'neutral',
      dealerType: 'tagged',
      postVisitSummary: 'Post-visit: +1 lead, Minor improvement',
    },
  ];

  // Filter visits for TL view
  const getFilteredVisits = () => {
    return allVisits.filter((visit) => {
      // KAM filter
      if (selectedKAM !== 'all' && visit.kamName !== selectedKAM) return false;
      
      // Dealer type filter
      if (selectedDealerType !== 'all' && visit.dealerType !== selectedDealerType) return false;
      
      // Productivity filter
      if (selectedProductivity !== 'all' && visit.productivity !== selectedProductivity) return false;
      
      return true;
    });
  };

  const filteredVisits = getFilteredVisits();

  // Calculate summary metrics
  const getSummaryMetrics = () => {
    const totalVisits = filteredVisits.length;
    const dealersCovered = new Set(filteredVisits.map(v => v.dealerCode)).size;
    const topDealers = filteredVisits.filter(v => v.dealerType === 'top').length;
    const taggedDealers = filteredVisits.filter(v => v.dealerType === 'tagged').length;
    const untaggedDealers = filteredVisits.filter(v => v.dealerType === 'untagged').length;
    const productiveVisits = filteredVisits.filter(v => v.productivity === 'productive').length;
    const productivePercentage = totalVisits > 0 ? Math.round((productiveVisits / totalVisits) * 100) : 0;

    return {
      totalVisits,
      dealersCovered,
      topDealers,
      taggedDealers,
      untaggedDealers,
      productiveVisits,
      productivePercentage,
    };
  };

  const handleReset = () => {
    setSelectedKAM('all');
    setSelectedTime('mtd');
    setSelectedDealerType('all');
    setSelectedProductivity('all');
  };

  const hasActiveFilters = () => {
    return selectedKAM !== 'all' || 
           selectedTime !== 'mtd' || 
           selectedDealerType !== 'all' || 
           selectedProductivity !== 'all';
  };

  // Visit detail data generator
  const getVisitDetailData = (visit: Visit) => {
    const isProductive = visit.productivity === 'productive';
    const isNotProductive = visit.productivity === 'not-productive';

    return {
      productivityExplanation: isProductive
        ? 'Productive – Leads increased from 0 (prev 7d) to 4 (next 7d), dealer onboarded to DCF.'
        : isNotProductive
        ? 'Not Productive – No improvement, lead volume stayed flat or dropped.'
        : 'Neutral – Minor changes, no significant improvement in dealer performance.',
      beforeAfterData: {
        leads: isProductive ? { before: 0, after: 4 } : isNotProductive ? { before: 5, after: 2 } : { before: 3, after: 4 },
        inspections: isProductive ? { before: 0, after: 2 } : isNotProductive ? { before: 2, after: 1 } : { before: 1, after: 1 },
        stockIns: isProductive ? { before: 0, after: 1 } : isNotProductive ? { before: 1, after: 0 } : { before: 0, after: 0 },
        dcfLeads: isProductive ? { before: 0, after: 2 } : isNotProductive ? { before: 0, after: 0 } : { before: 0, after: 1 },
      },
      visitDetails: {
        meetingPerson: 'Mr. Goyal – Owner',
        discussionPoints: `Discussed dealer performance and opportunities for improvement.\n\nKey topics:\n- Lead generation strategies\n- DCF onboarding process\n- Commission structure\n- App usage and training needs`,
        actionItems: [
          'Follow up on DCF documentation',
          'Schedule training session for dealer staff',
          'Review payout status next week',
        ],
        nextFollowUpDate: '15 Dec 2025',
      },
      shopPhotos: ['photo1', 'photo2', 'photo3'],
      recentActivity: [
        {
          id: '1',
          type: 'lead',
          description: 'New C2B lead created – DL6CAC9999',
          date: '10 Dec 2025',
        },
        {
          id: '2',
          type: 'inspection',
          description: 'Inspection completed – HR26DK8888',
          date: '9 Dec 2025',
        },
        {
          id: '3',
          type: 'stockin',
          description: 'Stock-in confirmed – UP16CD5555',
          date: '8 Dec 2025',
        },
        {
          id: '4',
          type: 'dcf',
          description: 'DCF lead submitted – DL3CAA7777',
          date: '7 Dec 2025',
        },
      ],
    };
  };

  // If viewing visit detail in TL mode
  if (selectedVisit) {
    const detailData = getVisitDetailData(selectedVisit);
    return (
      <TLVisitDetailPage
        dealer={selectedVisit.dealer}
        dealerCode={selectedVisit.dealerCode}
        city={selectedVisit.city}
        kamName={selectedVisit.kamName}
        dealerTags={selectedVisit.dealerTags}
        visitDate={selectedVisit.visitDate}
        visitTime={selectedVisit.visitTime}
        visitType={selectedVisit.visitType}
        visitPurpose={selectedVisit.visitPurpose}
        productivity={selectedVisit.productivity}
        productivityExplanation={detailData.productivityExplanation}
        beforeAfterData={detailData.beforeAfterData}
        visitDetails={detailData.visitDetails}
        shopPhotos={detailData.shopPhotos}
        recentActivity={detailData.recentActivity}
        onBack={() => setSelectedVisit(null)}
      />
    );
  }

  // TL View - Team Visit Analytics
  const metrics = getSummaryMetrics();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl text-gray-900">Team Visits</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filters - Line 1: KAM Dropdown + Time + Reset */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {/* KAM Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowKAMDropdown(!showKAMDropdown)}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm transition-colors ${
                  selectedKAM !== 'all'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <span className="text-xs text-gray-500 mr-2">KAM:</span>
                <span className="flex-1 text-left">{selectedKAM === 'all' ? 'All' : selectedKAM}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showKAMDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showKAMDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowKAMDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {['all', 'Rajesh Kumar', 'Priya Sharma', 'Amit Patel'].map((kam) => (
                      <button
                        key={kam}
                        onClick={() => {
                          setSelectedKAM(kam);
                          setShowKAMDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          selectedKAM === kam
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {kam === 'all' ? 'All KAMs' : kam}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Time Chips - Compact */}
            <div className="flex gap-1 overflow-x-auto">
              {['mtd', 'today', 'last_7d'].map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-2 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    selectedTime === time
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {time === 'mtd' && 'MTD'}
                  {time === 'today' && 'Today'}
                  {time === 'last_7d' && '7d'}
                </button>
              ))}
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              disabled={!hasActiveFilters()}
              className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap flex-shrink-0 transition-colors ${
                hasActiveFilters()
                  ? 'text-blue-600 hover:bg-blue-50'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              Reset
            </button>
          </div>

          {/* Filters - Line 2: Dealer Type + Productivity */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {/* Dealer Type */}
            {['all', 'top', 'tagged', 'untagged'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedDealerType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  selectedDealerType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type === 'all' && 'All Dealers'}
                {type === 'top' && 'Top'}
                {type === 'tagged' && 'Tagged'}
                {type === 'untagged' && 'Untagged'}
              </button>
            ))}

            <div className="w-px bg-gray-300 mx-1" />

            {/* Productivity */}
            {['all', 'productive', 'neutral', 'not-productive'].map((prod) => (
              <button
                key={prod}
                onClick={() => setSelectedProductivity(prod)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  selectedProductivity === prod
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {prod === 'all' && 'All'}
                {prod === 'productive' && 'Productive'}
                {prod === 'neutral' && 'Neutral'}
                {prod === 'not-productive' && 'Not Productive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary Card */}
        <TLVisitSummaryCard
          totalVisits={metrics.totalVisits}
          dealersCovered={metrics.dealersCovered}
          topDealers={metrics.topDealers}
          taggedDealers={metrics.taggedDealers}
          untaggedDealers={metrics.untaggedDealers}
          productiveVisits={metrics.productiveVisits}
          productivePercentage={metrics.productivePercentage}
          timePeriod={selectedTime}
          selectedKAM={selectedKAM}
        />

        {/* Visit List */}
        <div className="space-y-3">
          {filteredVisits.length === 0 ? (
            <div className="card-premium p-6 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-[13px] font-medium text-slate-500 mb-0.5">No visits found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your filters</p>
            </div>
          ) : (
            filteredVisits.map((visit) => (
              <TLVisitCard
                key={visit.id}
                dealer={visit.dealer}
                dealerCode={visit.dealerCode}
                kamName={visit.kamName}
                dealerTags={visit.dealerTags}
                visitDate={visit.visitDate}
                visitTime={visit.visitTime}
                visitType={visit.visitType}
                productivity={visit.productivity}
                postVisitSummary={visit.postVisitSummary}
                onClick={() => setSelectedVisit(visit)}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-gray-200 text-sm text-gray-600 text-center">
        Showing {filteredVisits.length} of {allVisits.length} visits
      </div>
    </div>
  );
}