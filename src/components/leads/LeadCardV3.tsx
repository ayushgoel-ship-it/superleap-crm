/**
 * LEAD CARD V3 - Premium CRM Design
 */

import { ChevronRight, Calendar, MapPin, User, Phone } from 'lucide-react';
import type { LeadCardVM } from '../../data/adapters/leadAdapter';

export interface LeadCardV3Props {
  lead: LeadCardVM;
  onClick?: () => void;
  showKAM?: boolean;
}

export function LeadCardV3({ lead, onClick, showKAM = false }: LeadCardV3Props) {
  const formatRevenue = (revenue: number) => {
    if (revenue === 0) return '\u20B90';
    if (revenue >= 10000000) return `\u20B9${(revenue / 10000000).toFixed(2)}Cr`;
    if (revenue >= 100000) return `\u20B9${(revenue / 100000).toFixed(2)}L`;
    return `\u20B9${revenue.toLocaleString()}`;
  };

  const formatCEP = (cep: number | null) => {
    if (!cep) return 'CEP Pending';
    if (cep >= 10000000) return `\u20B9${(cep / 10000000).toFixed(2)}Cr`;
    if (cep >= 100000) return `\u20B9${(cep / 100000).toFixed(2)}L`;
    return `\u20B9${cep.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'C2B': return 'bg-violet-50 text-violet-700 border-violet-100';
      case 'C2D': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'GS': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'DCF': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStageColor = (stage: string) => {
    const stageLower = stage.toLowerCase();
    if (stageLower.includes('stock-in') || stageLower.includes('payout')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
    if (stageLower.includes('inspection')) {
      return 'bg-sky-50 text-sky-700 border-sky-100';
    }
    if (stageLower.includes('lost')) {
      return 'bg-rose-50 text-rose-700 border-rose-100';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const formattedRevenue = formatRevenue(lead.revenue);
  const formattedCEP = formatCEP(lead.cep);
  const createdDate = formatDate(lead.createdAt);

  return (
    <div
      onClick={onClick}
      className="card-premium p-4 cursor-pointer active:scale-[0.99] transition-all duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono font-semibold text-slate-400">{lead.id}</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getChannelColor(lead.channel)}`}>
            {lead.channel}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
            {lead.leadType}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </div>

      {/* Customer & Car */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <h3 className="text-[13px] font-semibold text-slate-800">{lead.customerName}</h3>
        </div>
        <div className="text-[12px] text-slate-500 ml-9">
          {lead.carDisplay}
          {lead.regNo && lead.regNo !== 'N/A' && (
            <span className="text-slate-400 ml-1.5">\u2022 {lead.regNo}</span>
          )}
        </div>
      </div>

      {/* Dealer */}
      <div className="flex items-center gap-1.5 mb-3 text-[11px] text-slate-400">
        <MapPin className="w-3 h-3" />
        <span>{lead.dealerName}</span>
        <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
        <span>{lead.city}</span>
      </div>

      {/* KAM Owner */}
      {showKAM && lead.kamOwner && (
        <div className="flex items-center gap-1.5 mb-3 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg">
          <Phone className="w-3 h-3 text-slate-400" />
          <span>KAM: {lead.kamOwner}</span>
        </div>
      )}

      {/* Stage & Date */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStageColor(lead.stage)}`}>
          <span className={`w-1.5 h-1.5 rounded-full
            ${lead.stage.toLowerCase().includes('stock-in') || lead.stage.toLowerCase().includes('payout') ? 'bg-emerald-500' :
              lead.stage.toLowerCase().includes('inspection') ? 'bg-sky-500' :
              lead.stage.toLowerCase().includes('lost') ? 'bg-rose-500' : 'bg-slate-400'}
          `} />
          {lead.stage}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{createdDate}</span>
        </div>
      </div>

      {/* Bottom Row - CEP & C24 Quote / LTV */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          <div className="text-[10px] text-slate-400 mb-0.5">Customer Price</div>
          <div className={`text-[13px] font-bold ${lead.cep ? 'text-slate-800' : 'text-rose-600'}`}>
            {formattedCEP}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 mb-0.5">{lead.channel === 'DCF' ? 'LTV' : 'C24 Quote'}</div>
          <div className={`text-[13px] font-bold ${lead.revenue > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
            {formattedRevenue}
          </div>
        </div>
      </div>

      {/* Inspection Date */}
      {lead.inspectionDate && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-sky-600 bg-sky-50 px-2.5 py-1.5 rounded-lg">
            <Calendar className="w-3 h-3" />
            <span>Inspection: {new Date(lead.inspectionDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}</span>
          </div>
        </div>
      )}
    </div>
  );
}