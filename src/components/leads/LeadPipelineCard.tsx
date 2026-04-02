/**
 * LEAD PIPELINE CARD - Premium Sales-Oriented Card (Compact)
 *
 * Treats each lead as a deal in a pipeline — not a database row.
 * Shows: customer, vehicle, channel, stage, key numbers, freshness.
 * Call RA button is top-right for immediate action.
 * Customer phone is intentionally hidden — KAM calls the RA, not the customer.
 */

import { Phone, ChevronRight, Clock, Calendar, Car, AlertCircle } from 'lucide-react';
import { ChannelChip, StatusChip } from '../premium/Chip';
import type { LeadCardVM } from '../../data/adapters/leadAdapter';

// ── Helpers ──

function daysAgo(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function freshnessLabel(dateStr: string): string {
  const d = daysAgo(dateStr);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMoney(n: number | null | undefined): string {
  if (!n) return '--';
  if (n >= 10_000_000) return `\u20B9${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `\u20B9${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `\u20B9${(n / 1_000).toFixed(0)}K`;
  return `\u20B9${n}`;
}

function stageVariant(stage: string): 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple' {
  const s = stage.toLowerCase();
  if (s.includes('payout') || s.includes('stock-in')) return 'success';
  if (s.includes('inspection')) return 'info';
  if (s.includes('pll') || s.includes('in progress')) return 'warning';
  if (s.includes('lost')) return 'danger';
  if (s.includes('pr') || s.includes('created')) return 'purple';
  return 'neutral';
}

// ── Props ──

export interface LeadPipelineCardProps {
  lead: LeadCardVM;
  onTap: () => void;
  onCallRA?: (e: React.MouseEvent) => void;
  /** @deprecated Use onCallRA instead */
  onCall?: (e: React.MouseEvent) => void;
  onOverflow?: (e: React.MouseEvent) => void;
  compact?: boolean;
  showKAM?: boolean;
  showDCFDot?: boolean;
}

// ── Component ──

export function LeadPipelineCard({
  lead,
  onTap,
  onCallRA,
  onCall,
  onOverflow,
  compact = false,
  showKAM = false,
  showDCFDot = false,
}: LeadPipelineCardProps) {
  const age = daysAgo(lead.createdAt);
  const isStale = age > 7;
  const isHot = lead.cep !== null && lead.cep > 0 && age <= 3;
  const isCepPending = !lead.cep || lead.cep === 0;
  const isDCF = lead.channel === 'DCF';
  const secondaryLabel = isDCF ? 'LTV' : 'C24 Quote';

  // Range status chip config (GS/NGS only)
  const rangeChip = !isDCF && lead.rangeStatus
    ? ({
        'Within Range':    { label: 'Within Range',    bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
        'Less than Range': { label: 'Below Range',     bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200'    },
        'More than Range': { label: 'Above Range',     bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200'   },
        'C24 Quote Pending': { label: 'Quote Pending', bg: 'bg-slate-100',   text: 'text-slate-500',   border: 'border-slate-200'   },
      } as const)[lead.rangeStatus]
    : null;

  // Prefer onCallRA, fallback to legacy onCall
  const handleCall = onCallRA || onCall;

  return (
    <div
      onClick={onTap}
      className={`card-premium overflow-hidden cursor-pointer active:scale-[0.995] transition-all duration-200
        ${isCepPending ? 'border-l-[3px] border-l-rose-300' : isStale ? 'border-l-[3px] border-l-amber-300' : isHot ? 'border-l-[3px] border-l-indigo-400' : ''}
      `}
    >
      <div className={`${compact ? 'px-3 pt-2.5 pb-2' : 'px-3.5 py-2.5'}`}>

        {/* Row 1: Customer name + CEP badge + Call RA + Chevron */}
        <div className="flex items-center gap-1.5">
          {showDCFDot && (
            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
          )}
          <h3 className="text-[13px] font-semibold text-slate-800 truncate flex-1 min-w-0">
            {lead.customerName}
          </h3>
          {isCepPending && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex-shrink-0">
              <AlertCircle className="w-2.5 h-2.5" />
              CEP
            </span>
          )}
          {handleCall && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCall(e); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600
                         hover:bg-indigo-100 active:scale-90 transition-all duration-150 flex-shrink-0"
              aria-label="Call RA"
              title="Call RA"
            >
              <Phone className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        </div>

        {/* Row 2: Vehicle + regNo */}
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
          <Car className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="truncate">{lead.carDisplay}</span>
          {lead.regNo && lead.regNo !== 'N/A' && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
              <span className="text-slate-400 font-mono text-[10px]">{lead.regNo}</span>
            </>
          )}
        </div>

        {/* Row 3: Chips + optional inspection + freshness */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <ChannelChip channel={lead.channel} />
          <StatusChip label={lead.stage} variant={stageVariant(lead.stage)} dot size="sm" />
          {lead.leadType && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
              {lead.leadType}
            </span>
          )}
          {isHot && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
              HOT
            </span>
          )}
          {isStale && !isHot && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
              Stale
            </span>
          )}
          {lead.inspectionDate && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium text-sky-600 bg-sky-50 border border-sky-100">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(lead.inspectionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* KAM row (for TL views) */}
        {showKAM && lead.kamOwner && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
            <span className="text-slate-500 font-medium">KAM:</span>
            <span>{lead.kamOwner}</span>
          </div>
        )}
      </div>

      {/* Key numbers strip */}
      {!compact && (
        <div className="px-3.5 py-1.5 bg-slate-50/60 border-t border-slate-100/80">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[9px] text-slate-400 font-medium tracking-wide uppercase">CEP</div>
              <div className={`text-[12px] font-bold tabular-nums ${lead.cep ? 'text-slate-700' : 'text-rose-500'}`}>
                {lead.cep ? formatMoney(lead.cep) : 'Pending'}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 font-medium tracking-wide uppercase">{secondaryLabel}</div>
              {isCepPending ? (
                <div className="text-[10px] text-slate-300">—</div>
              ) : (
                <div className={`text-[12px] font-bold tabular-nums ${lead.secondaryValue > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                  {lead.secondaryValue > 0 ? formatMoney(lead.secondaryValue) : '--'}
                </div>
              )}
              {rangeChip && (
                <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-semibold border ${rangeChip.bg} ${rangeChip.text} ${rangeChip.border}`}>
                  {rangeChip.label}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-[9px] text-slate-400 font-medium tracking-wide uppercase">Created</div>
              <div className={`text-[12px] font-semibold ${isStale ? 'text-amber-600' : 'text-slate-500'}`}>
                {freshnessLabel(lead.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}