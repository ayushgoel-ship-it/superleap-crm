import { useMemo } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { getAllDealers, getDealersByKAM } from '../../data/selectors';
import { getFilteredDCFLeads, getDealerLeadMetrics, deriveDealerActivityStage } from '../../data/canonicalMetrics';
import { TimePeriod } from '../../lib/domain/constants';
import { useActorScope } from '../../lib/auth/useActorScope';
import { KAMFilter } from '../common/KAMFilter';

interface DCFDealersListPageProps {
  onBack: () => void;
  filterType: 'onboarded' | 'leadGiving';
  dateRange: string;
  customFrom?: string;
  customTo?: string;
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

export function DCFDealersListPage({ onBack, filterType, dateRange, customFrom, customTo, onDealerClick }: DCFDealersListPageProps) {
  const { effectiveKamIds, role: actorRole } = useActorScope();
  // Derive dealer list from canonical time-filtered data
  const dealers: DealerRow[] = useMemo(() => {
    const period = (Object.values(TimePeriod).includes(dateRange as TimePeriod)
      ? dateRange as TimePeriod
      : TimePeriod.MTD);
    const allDealers = effectiveKamIds && effectiveKamIds.length > 0
      ? (() => {
          const seen = new Set<string>();
          const union: any[] = [];
          for (const kid of effectiveKamIds) {
            for (const d of getDealersByKAM(kid)) {
              if (!seen.has(d.id)) { seen.add(d.id); union.push(d); }
            }
          }
          return union;
        })()
      : getAllDealers();
    const allDCFLeads = getFilteredDCFLeads({ period, customFrom, customTo, kamIds: effectiveKamIds });

    const rows: DealerRow[] = allDealers.map(d => {
      const dcfLeads = allDCFLeads.filter(l => l.dealerId === d.id);
      const disbursed = dcfLeads.filter(l => (l.overallStatus || '').toLowerCase() === 'disbursed');
      const metrics = getDealerLeadMetrics(d.id, { period, customFrom, customTo, kamIds: effectiveKamIds });
      const stage = deriveDealerActivityStage(metrics, d.status);
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        city: d.city,
        status: stage === 'Inactive' ? 'Inactive' : stage === 'Dormant' ? 'Dormant' : 'Active',
        dcfLeads: dcfLeads.length,
        mtdLeads: dcfLeads.length,
        mtdDisbursals: disbursed.length,
      };
    });

    if (filterType === 'leadGiving') {
      return rows.filter(d => (d.dcfLeads ?? 0) > 0);
    }
    return rows;
  }, [filterType, dateRange, customFrom, customTo, effectiveKamIds]);

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
          <h1 className="text-gray-900 flex-1">{title}</h1>
          {(actorRole === 'TL' || actorRole === 'Admin') && <KAMFilter />}
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
