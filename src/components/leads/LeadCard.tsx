/**
 * SHARED LEAD CARD COMPONENT v2
 * 
 * Used in:
 * - LeadsPage (main leads listing)
 * - Dealer360View Leads Tab
 * - Dashboard lead widgets
 * 
 * Features:
 * - Works with LeadCardVM from adapter (single source of truth)
 * - Displays lead with proper badges (Channel, Type, Status)
 * - Shows CEP or CEP Pending for C2B/C2D/GS
 * - Shows C24 Quote / LTV value
 * - Shows KAM owner (TL mode only)
 * - Clickable to navigate to Lead Detail
 */

import { ChevronRight } from 'lucide-react';
import type { LeadCardVM } from '../../data/adapters/leadAdapter';

export interface LeadCardProps {
  lead: LeadCardVM;
  onClick?: () => void;
  showKAM?: boolean; // Show KAM owner (TL mode)
}

export function LeadCard({ lead, onClick, showKAM = false }: LeadCardProps) {
  // Format value (C24 Quote / LTV)
  const formatValue = (value: number) => {
    if (value === 0) return '₹0';
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  const formattedValue = formatValue(lead.revenue);
  const valueLabel = lead.channel === 'DCF' ? 'LTV' : 'C24 Quote';

  // Badge color mapping
  const getBadgeClass = (badge: LeadCardVM['badges'][0]) => {
    const colorMap = {
      purple: 'bg-purple-100 text-purple-700',
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      amber: 'bg-amber-100 text-amber-700',
      red: 'bg-red-100 text-red-700',
      gray: 'bg-gray-100 text-gray-700',
    };
    return colorMap[badge.color];
  };

  // Special handling for CEP badge
  const cepBadge = lead.badges.find(b => b.type === 'cep');
  const otherBadges = lead.badges.filter(b => b.type !== 'cep');

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50 cursor-pointer hover:border-blue-300 transition-colors"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-medium text-blue-600">{lead.id}</span>
            {otherBadges.map((badge, idx) => (
              <span key={idx} className={`px-2 py-0.5 rounded text-xs ${getBadgeClass(badge)}`}>
                {badge.label}
              </span>
            ))}
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">{lead.customerName}</div>
          <div className="text-sm text-gray-600">{lead.carDisplay}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {/* Dealer & Location */}
      <div className="text-sm text-gray-600 mb-2">
        {lead.dealerName} • {lead.dealerCode} • {lead.city}
      </div>

      {/* KAM Owner (TL mode only) */}
      {showKAM && lead.kamOwner && (
        <div className="text-xs text-gray-500 mb-2">
          KAM: {lead.kamOwner}
        </div>
      )}

      {/* Bottom Row - CEP & Revenue */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* CEP Badge */}
          {cepBadge && (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                cepBadge.color === 'red'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-black text-white'
              }`}
            >
              {cepBadge.label}
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-green-600">{formattedValue} {valueLabel}</div>
      </div>
    </div>
  );
}