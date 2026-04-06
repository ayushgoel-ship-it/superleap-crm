/**
 * Data Boundary Index - Canonical Exports
 * 
 * Purpose: Single point of access for all data layer concerns
 * Usage: Import from this file instead of scattered imports
 * 
 * Architecture: Engine → Selector → DTO → UI
 * - Engines: Calculate derived values (lib/)
 * - Selectors: Access raw entities (data/selectors.ts)
 * - DTOs: Transform entities → UI contracts (data/dtoSelectors.ts)
 * - UI: Consume DTOs only (components/)
 */

// ============================================================================
// TYPES (Entity Definitions)
// ============================================================================
export type {
  Dealer,
  CallLog,
  VisitLog,
  Lead,
  DCFLead,
  TeamLead,
  KAM,
  LocationChangeRequest,
  DealerSegment,
  DealerTag,
  LeadStage,
  CallOutcome,
  VisitStatus,
} from './types';

// ============================================================================
// ID HELPERS (canonical — no mock dependency)
// ============================================================================
export {
  normalizeDealerId,
  normalizeKAMId,
  normalizeTLId,
  makeUntaggedDealerId,
} from './idUtils';

// ============================================================================
// RUNTIME DB (Supabase-backed, replaces mock arrays)
// ============================================================================
export { getRuntimeDBSync, loadRuntimeDB, clearRuntimeDBCache } from './runtimeDB';

// ============================================================================
// SELECTORS (Data Access Layer)
// ============================================================================
export {
  getDealerById,
  getDealersByKAM,
  getLeadsByDealerId,
  getCallsByDealerId,
  getVisitsByDealerId,
  getDCFLeadsByDealerId,
  getKAMByDealerId,
  getTLByKAMId,
  getAllDealers,
  getAllLeads,
  getAllCalls,
  getAllVisits,
  getAllDCFLeads,
  // Add other selector exports as needed
} from './selectors';

// ============================================================================
// DTO SELECTORS (DTO Transformations for UI)
// ============================================================================
export {
  getDealerDTO,
  // Add other DTO selector exports as needed
} from './dtoSelectors';

// ============================================================================
// V/C SPECIFIC SELECTORS
// ============================================================================
export {
  // Export V/C selectors if they exist
} from './vcSelectors';

// ============================================================================
// ADMIN ORG DATA (Admin-specific data)
// ============================================================================
export {
  // Export admin org data if needed
} from './adminOrgData';

// ============================================================================
// NOTES FOR DEVELOPERS
// ============================================================================
/**
 * DATA FLOW RULES:
 * 
 * 1. NEVER import from mockDatabase directly in UI components
 *    ✅ DO: import { getDealerById } from '@/data'
 *    ❌ DON'T: import { DEALERS } from '@/data/mockDatabase'
 * 
 * 2. NEVER bypass selectors to access data
 *    ✅ DO: const dealer = getDealerById(id)
 *    ❌ DON'T: const dealer = DEALERS.find(d => d.id === id)
 * 
 * 3. UI components MUST consume DTOs, not raw entities
 *    ✅ DO: function DealerCard(props: { dealer: DealerDTO })
 *    ❌ DON'T: function DealerCard(props: { dealer: Dealer })
 * 
 * 4. Calculations go through engines, not inline
 *    ✅ DO: const i2si = calculateI2SI(inspections, stockIns)
 *    ❌ DON'T: const i2si = (stockIns / inspections) * 100
 * 
 * WHERE TO FIND THINGS:
 * - Mock Data: /data/mockDatabase.ts
 * - Selectors: /data/selectors.ts
 * - DTOs: /data/dtoSelectors.ts + /contracts/
 * - Engines: /lib/metricsEngine.ts, /lib/incentiveEngine.ts, etc.
 * - Routes: /navigation/routes.ts
 * 
 * FOR MORE INFO:
 * See /docs/02_TRD_ARCHITECTURE.md → Data Flow section
 * See /docs/09_DATA_BOUNDARY_MAP.md (created during hardening)
 */