/**
 * LEAD DETAIL V2 ADAPTER FOR NOTIFICATIONS
 * 
 * Phase 3A compatibility shim: accepts the prop interface that
 * NotificationCenterPage passes (regNo, customer, channel, etc.)
 * and resolves to the canonical LeadDetailPageV2 via leadId lookup.
 * 
 * Resolution strategy (first match wins):
 *   1. Exact lead.id match on regNo
 *   2. Exact lead.regNo match
 *   3. Exact lead.registrationNumber match
 *   4. Fallback: pass regNo as leadId (V2 will show "Lead not found" — same as v1 behavior)
 * 
 * Zero UI/behavior change from user perspective.
 */

import { LeadDetailPageV2 } from './LeadDetailPageV2';
import { getAllLeads } from '../../data/selectors';
import type { UserRole } from '../../lib/shared/appTypes';

interface NotificationLeadDetailProps {
  regNo: string;
  customer: string;
  channel: 'C2B' | 'C2D' | 'GS' | 'DCF';
  leadType: 'Seller' | 'Inventory';
  currentStage: string;
  onBack: () => void;
  userRole?: UserRole;
}

export function LeadDetailV2AdapterForNotifications({
  regNo,
  customer,
  channel,
  leadType,
  currentStage,
  onBack,
  userRole,
}: NotificationLeadDetailProps) {
  // Attempt to resolve a canonical leadId from notification data.
  // NotificationCenter passes regNo (e.g. "C24-876542") which may match
  // lead.id, lead.regNo, or lead.registrationNumber in the mock database.
  const leads = getAllLeads();
  const match = leads.find(
    l => l.id === regNo || l.regNo === regNo || l.registrationNumber === regNo
  );

  // If no match found, fall back to regNo — LeadDetailPageV2 will show
  // its standard "Lead not found" view, identical to current v1 behavior.
  const resolvedLeadId = match?.id || regNo;

  return (
    <LeadDetailPageV2
      leadId={resolvedLeadId}
      onBack={onBack}
      userRole={userRole}
    />
  );
}