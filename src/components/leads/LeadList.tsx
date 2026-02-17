/**
 * SHARED LEAD LIST COMPONENT v2
 * 
 * Displays a list of leads using LeadCard
 * Used across LeadsPage and Dealer360View
 * Works with LeadCardVM from adapter
 */

import type { LeadCardVM } from '../../data/adapters/leadAdapter';
import { LeadCard } from './LeadCard';
import { InlineEmpty } from '../premium/EmptyState';
import { FileText } from 'lucide-react';

export interface LeadListProps {
  leads: LeadCardVM[];
  onLeadClick?: (leadId: string) => void;
  showKAM?: boolean;
  emptyMessage?: string;
}

export function LeadList({ 
  leads, 
  onLeadClick, 
  showKAM = false,
  emptyMessage = 'No leads found'
}: LeadListProps) {
  if (leads.length === 0) {
    return (
      <InlineEmpty icon={FileText} message={emptyMessage} />
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onClick={() => onLeadClick && onLeadClick(lead.id)}
          showKAM={showKAM}
        />
      ))}
    </div>
  );
}
