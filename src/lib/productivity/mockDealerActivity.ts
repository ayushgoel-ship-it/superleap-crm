/**
 * Dealer Activity Service
 *
 * Computes dealer activity from canonical Supabase data (runtimeDB).
 * No mock data — all derived from sell_leads_master and dcf_leads_master.
 */
import { DealerActivity } from './productivityService';
import { getRuntimeDBSync } from '../../data/runtimeDB';

/**
 * Get dealer activity data by dealer code
 * Computed from canonical leads and DCF data in runtimeDB
 */
export function getDealerActivity(dealerId: string): DealerActivity {
  const db = getRuntimeDBSync();

  // Find leads for this dealer
  const dealerLeads = db.leads.filter(l => l.dealerCode === dealerId || l.dealerId === dealerId);
  const dealerDcf = db.dcfLeads.filter(d => d.dealerCode === dealerId || d.dealerId === dealerId);

  return {
    dealerId,
    leads: dealerLeads.map(l => ({
      id: l.id,
      createdAt: l.createdAt,
      type: l.channel || 'C2B',
    })),
    inspections: dealerLeads
      .filter(l => l.inspectionDate)
      .map(l => ({
        id: l.id,
        scheduledAt: l.inspectionDate!,
      })),
    stockIns: dealerLeads
      .filter(l => l.stockinDate || l.finalSiDate)
      .map(l => ({
        id: l.id,
        stockedAt: (l.finalSiDate || l.stockinDate)!,
      })),
    dcfOnboarding: [],
    dcfLeads: dealerDcf.map(d => ({
      id: d.id,
      createdAt: d.createdAt,
    })),
    dcfDisbursals: dealerDcf
      .filter(d => d.disbursalDate)
      .map(d => ({
        id: d.id,
        disbursedAt: d.disbursalDate!,
      })),
  };
}
