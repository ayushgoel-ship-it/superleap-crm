import { useMemo } from 'react';
import { ArrowLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { getFilteredDCFLeads } from '../../data/canonicalMetrics';
import { toDCFLeadListVM } from '../../data/adapters/dcfAdapter';
import { TimePeriod } from '../../lib/domain/constants';
import { useKamScope } from '../../lib/auth/useKamScope';
import { useActorScope } from '../../lib/auth/useActorScope';
import { KAMFilter } from '../common/KAMFilter';

interface DCFLeadsListPageProps {
  onBack: () => void;
  onLeadClick: (loanId: string) => void;
  dateRange: string;
  customFrom?: string;
  customTo?: string;
}

export function DCFLeadsListPage({ onBack, onLeadClick, dateRange, customFrom, customTo }: DCFLeadsListPageProps) {
  const kamScopeId = useKamScope();
  const { effectiveKamIds, role: actorRole } = useActorScope();
  const leads = useMemo(() => {
    const period = (Object.values(TimePeriod).includes(dateRange as TimePeriod)
      ? dateRange as TimePeriod
      : TimePeriod.MTD);
    const raw = getFilteredDCFLeads({ period, kamId: kamScopeId, kamIds: effectiveKamIds, customFrom, customTo });
    return toDCFLeadListVM(raw);
  }, [dateRange, kamScopeId, effectiveKamIds, customFrom, customTo]);

  const STAGE_COLORS: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-100 text-red-700',
  };

  const filterChips = [
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
          <h1 className="text-gray-900 flex-1">DCF Leads</h1>
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
                <div className="text-xs text-gray-500">{lead.loanId}</div>
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
                  <div className="text-xs text-gray-900">{lead.createdAt}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Dealer</div>
                  <div className="text-xs text-gray-900">{lead.dealerName} &bull; {lead.dealerCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Channel</div>
                  <div className="text-xs text-gray-900">{lead.channel}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {lead.bookFlag}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${lead.carDocsFlag === 'Received' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  Docs: {lead.carDocsFlag}
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {lead.kamName}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
