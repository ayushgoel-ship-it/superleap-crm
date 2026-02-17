// Mock dealer activity data for productivity calculations
import { DealerActivity } from './productivityService';
import { normalizeDealerId } from '../../data/mockDatabase';

/**
 * Mock dealer activities database
 * In production, this would come from backend API
 * All dealer IDs now use canonical format: dealer-<region>-<3digit>
 */
export const mockDealerActivities: Record<string, DealerActivity> = {
  // Daily Motoz - Active dealer with recent activity
  'dealer-ncr-001': {
    dealerId: 'dealer-ncr-001',
    leads: [
      { id: 'lead-1', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), type: 'C2B' }, // 1 hour ago
      { id: 'lead-2', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'C2B' }, // 2 hours ago
      { id: 'lead-3', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'C2D' }, // 5 days ago
    ],
    inspections: [
      { id: 'insp-1', scheduledAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }, // 3 hours ago
    ],
    stockIns: [
      { id: 'stock-1', stockedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }, // 12 hours ago
    ],
    dcfOnboarding: [
      { id: 'dcf-onb-1', onboardedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }, // 15 days ago
    ],
    dcfLeads: [
      { id: 'dcf-lead-1', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // 2 days ago
    ],
    dcfDisbursals: [
      { id: 'dcf-dis-1', disbursedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }, // 4 days ago
    ],
  },
  
  // Gupta Auto World - Top dealer with DCF activity
  'dealer-ncr-002': {
    dealerId: 'dealer-ncr-002',
    leads: [
      { id: 'lead-4', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), type: 'C2B' }, // 20 days ago
    ],
    inspections: [],
    stockIns: [],
    dcfOnboarding: [
      { id: 'dcf-onb-2', onboardedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() }, // 60 days ago
    ],
    dcfLeads: [
      { id: 'dcf-lead-2', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // 2 days ago
      { id: 'dcf-lead-3', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }, // 5 days ago
    ],
    dcfDisbursals: [],
  },
  
  // Sharma Motors - Low activity dealer
  'dealer-ncr-003': {
    dealerId: 'dealer-ncr-003',
    leads: [
      { id: 'lead-5', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), type: 'C2D' }, // 30 days ago
    ],
    inspections: [],
    stockIns: [],
    dcfOnboarding: [],
    dcfLeads: [],
    dcfDisbursals: [],
  },
  
  // AutoMax Delhi - Moderate activity
  'dealer-ncr-004': {
    dealerId: 'dealer-ncr-004',
    leads: [
      { id: 'lead-6', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), type: 'C2B' }, // 15 days ago
    ],
    inspections: [
      { id: 'insp-2', scheduledAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }, // 8 days ago
    ],
    stockIns: [
      { id: 'stock-2', stockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }, // 10 days ago
    ],
    dcfOnboarding: [],
    dcfLeads: [],
    dcfDisbursals: [],
  },
  
  // Singh Motors - No recent activity
  'dealer-ncr-005': {
    dealerId: 'dealer-ncr-005',
    leads: [],
    inspections: [],
    stockIns: [],
    dcfOnboarding: [],
    dcfLeads: [],
    dcfDisbursals: [],
  },
  
  // New City Autos / Royal Cars - Sporadic activity
  'dealer-ncr-006': {
    dealerId: 'dealer-ncr-006',
    leads: [
      { id: 'lead-7', createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), type: 'GS' }, // 45 days ago
    ],
    inspections: [],
    stockIns: [],
    dcfOnboarding: [],
    dcfLeads: [],
    dcfDisbursals: [],
  },
};

/**
 * Get dealer activity data by dealer ID
 * Supports legacy ID formats via normalization
 */
export function getDealerActivity(dealerId: string): DealerActivity {
  const normalizedId = normalizeDealerId(dealerId);
  return mockDealerActivities[normalizedId] || {
    dealerId: normalizedId,
    leads: [],
    inspections: [],
    stockIns: [],
    dcfOnboarding: [],
    dcfLeads: [],
    dcfDisbursals: [],
  };
}