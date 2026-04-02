/**
 * DEALER ACCOUNT CARD - Portfolio Overview Card
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  DESIGN NOTE                                         │
 * │                                                      │
 * │  Dealer cards are account summaries, not execution    │
 * │  buttons. The KAM scans the portfolio to understand   │
 * │  "how is my dealer base performing?" — every card     │
 * │  answers that at a glance.                            │
 * │                                                      │
 * │  Actions (Call, Visit, Notes) live inside the         │
 * │  DealerDetail screen, which is one tap away.          │
 * │  This separation keeps the list scannable and calm.   │
 * └──────────────────────────────────────────────────────┘
 */

import { MapPin, Clock, ChevronRight, Navigation } from 'lucide-react';
import { StatusChip, SegmentBadge } from '../premium/Chip';

export interface DealerCardData {
  id: string;
  name: string;
  code: string;
  city: string;
  segment: 'A' | 'B' | 'C';
  status: 'active' | 'dormant' | 'inactive';
  tags: string[];
  lastActivity: string;
  lastActivityDaysAgo: number;
  callsMTD: number;
  visitsMTD: number;
  leadsMTD: number;
  sisMTD: number;
  productivityPct: number;
  hasLocation: boolean;
  distanceKm?: number;
  category?: 'Top Dealer' | 'Tagged Dealer' | 'Untagged Dealer';
}

interface DealerAccountCardProps {
  dealer: DealerCardData;
  onTap: () => void;
}

function getStageFromMetrics(dealer: DealerCardData): { label: string; variant: 'success' | 'info' | 'warning' | 'danger' } {
  if (dealer.status === 'dormant' || (dealer.leadsMTD === 0 && dealer.sisMTD === 0)) {
    return { label: 'Dormant', variant: 'danger' };
  }
  if (dealer.sisMTD > 0) return { label: 'Transacting', variant: 'success' };
  if (dealer.leadsMTD > 5) return { label: 'Inspecting', variant: 'info' };
  if (dealer.leadsMTD > 0) return { label: 'Lead Giving', variant: 'warning' };
  return { label: 'Inactive', variant: 'danger' };
}

export function DealerAccountCard({ dealer, onTap }: DealerAccountCardProps) {
  const stage = getStageFromMetrics(dealer);
  const isDormant = stage.variant === 'danger';

  return (
    <div
      onClick={onTap}
      className={`card-premium overflow-hidden cursor-pointer active:scale-[0.995] transition-all duration-200
        ${isDormant ? 'border-l-[3px] border-l-rose-300' : ''}
      `}
    >
      {/* Header Row */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Segment Avatar */}
          <SegmentBadge segment={dealer.segment} />

          {/* Name + Code + City */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-[14px] font-semibold truncate
                ${isDormant ? 'text-slate-400' : 'text-slate-800'}
              `}>
                {dealer.name}
              </h3>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-400 font-medium">{dealer.code}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                <MapPin className="w-2.5 h-2.5" />
                {dealer.city}
              </span>
              {dealer.hasLocation && dealer.distanceKm !== undefined && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="flex items-center gap-0.5 text-[11px] text-indigo-500 font-medium">
                    <Navigation className="w-2.5 h-2.5" />
                    {dealer.distanceKm < 1 ? `${Math.round(dealer.distanceKm * 1000)}m` : `${dealer.distanceKm.toFixed(1)}km`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chips Row */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          <StatusChip label={stage.label} variant={stage.variant} dot size="sm" />
          {dealer.tags.slice(0, 2).map((tag) => (
            <StatusChip
              key={tag}
              label={tag}
              variant={tag === 'Top Dealer' ? 'purple' : tag === 'DCF Onboarded' ? 'warning' : 'neutral'}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Micro Stats Strip */}
      <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100/80">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Leads', value: dealer.leadsMTD },
            { label: 'SIs', value: dealer.sisMTD },
            { label: 'Calls', value: dealer.callsMTD },
            { label: 'Visits', value: dealer.visitsMTD },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">{stat.label}</div>
              <div className={`text-[14px] font-bold tabular-nums mt-0.5
                ${isDormant ? 'text-slate-300' : stat.value === 0 ? 'text-slate-300' : 'text-slate-700'}
              `}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Last Activity (no action buttons) */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>{dealer.lastActivity}</span>
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          {dealer.lastActivityDaysAgo === 0 ? 'Today' :
           dealer.lastActivityDaysAgo === 1 ? '1d ago' :
           dealer.lastActivityDaysAgo < 999 ? `${dealer.lastActivityDaysAgo}d ago` : ''}
        </span>
      </div>
    </div>
  );
}
