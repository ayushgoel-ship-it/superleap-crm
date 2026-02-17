/**
 * Mock Database Validation
 * Ensures referential integrity and consistency
 */

import { DEALERS, CALLS, VISITS, DCF_LEADS, ORG, LEGACY_ID_MAP } from './mockDatabase';

export interface ValidationResult {
  ok: boolean;
  issues: string[];
}

/**
 * Validate the entire mock database
 */
export function validateMockDatabase(): ValidationResult {
  const issues: string[] = [];

  // 1. Check for duplicate dealer IDs
  const dealerIds = DEALERS.map(d => d.id);
  const duplicateDealerIds = dealerIds.filter((id, index) => dealerIds.indexOf(id) !== index);
  if (duplicateDealerIds.length > 0) {
    issues.push(`Duplicate dealer IDs found: ${duplicateDealerIds.join(', ')}`);
  }

  // 2. Check for duplicate call IDs
  const callIds = CALLS.map(c => c.id);
  const duplicateCallIds = callIds.filter((id, index) => callIds.indexOf(id) !== index);
  if (duplicateCallIds.length > 0) {
    issues.push(`Duplicate call IDs found: ${duplicateCallIds.join(', ')}`);
  }

  // 3. Check for duplicate visit IDs
  const visitIds = VISITS.map(v => v.id);
  const duplicateVisitIds = visitIds.filter((id, index) => visitIds.indexOf(id) !== index);
  if (duplicateVisitIds.length > 0) {
    issues.push(`Duplicate visit IDs found: ${duplicateVisitIds.join(', ')}`);
  }

  // 4. Check for duplicate DCF lead IDs
  const dcfLeadIds = DCF_LEADS.map(l => l.id);
  const duplicateDCFLeadIds = dcfLeadIds.filter((id, index) => dcfLeadIds.indexOf(id) !== index);
  if (duplicateDCFLeadIds.length > 0) {
    issues.push(`Duplicate DCF lead IDs found: ${duplicateDCFLeadIds.join(', ')}`);
  }

  // 5. Validate call dealer references
  CALLS.forEach(call => {
    const dealer = DEALERS.find(d => d.id === call.dealerId);
    if (!dealer) {
      issues.push(`Call ${call.id} references non-existent dealer: ${call.dealerId}`);
    } else {
      // Check consistency
      if (dealer.name !== call.dealerName) {
        issues.push(`Call ${call.id}: dealer name mismatch. Expected "${dealer.name}", got "${call.dealerName}"`);
      }
      if (dealer.code !== call.dealerCode) {
        issues.push(`Call ${call.id}: dealer code mismatch. Expected "${dealer.code}", got "${call.dealerCode}"`);
      }
    }
  });

  // 6. Validate visit dealer references
  VISITS.forEach(visit => {
    const dealer = DEALERS.find(d => d.id === visit.dealerId);
    if (!dealer) {
      issues.push(`Visit ${visit.id} references non-existent dealer: ${visit.dealerId}`);
    } else {
      // Check consistency
      if (dealer.name !== visit.dealerName) {
        issues.push(`Visit ${visit.id}: dealer name mismatch. Expected "${dealer.name}", got "${visit.dealerName}"`);
      }
      if (dealer.code !== visit.dealerCode) {
        issues.push(`Visit ${visit.id}: dealer code mismatch. Expected "${dealer.code}", got "${visit.dealerCode}"`);
      }
    }
  });

  // 7. Validate DCF lead dealer references
  DCF_LEADS.forEach(lead => {
    const dealer = DEALERS.find(d => d.id === lead.dealerId);
    if (!dealer) {
      issues.push(`DCF lead ${lead.id} references non-existent dealer: ${lead.dealerId}`);
    } else {
      // Check consistency
      if (dealer.name !== lead.dealerName) {
        issues.push(`DCF lead ${lead.id}: dealer name mismatch. Expected "${dealer.name}", got "${lead.dealerName}"`);
      }
      if (dealer.code !== lead.dealerCode) {
        issues.push(`DCF lead ${lead.id}: dealer code mismatch. Expected "${dealer.code}", got "${lead.dealerCode}"`);
      }
    }
  });

  // 8. Validate KAM references in dealers
  const allKAMs = ORG.tls.flatMap(tl => tl.kams);
  const allKAMIds = allKAMs.map(k => k.id);
  
  DEALERS.forEach(dealer => {
    if (!allKAMIds.includes(dealer.kamId)) {
      issues.push(`Dealer ${dealer.id} (${dealer.name}) references non-existent KAM: ${dealer.kamId}`);
    } else {
      const kam = allKAMs.find(k => k.id === dealer.kamId);
      if (kam && kam.name !== dealer.kamName) {
        issues.push(`Dealer ${dealer.id}: KAM name mismatch. Expected "${kam.name}", got "${dealer.kamName}"`);
      }
    }
  });

  // 9. Validate TL references in dealers
  const allTLIds = ORG.tls.map(tl => tl.id);
  
  DEALERS.forEach(dealer => {
    if (!allTLIds.includes(dealer.tlId)) {
      issues.push(`Dealer ${dealer.id} (${dealer.name}) references non-existent TL: ${dealer.tlId}`);
    }
  });

  // 10. Check for legacy IDs in active data (should all be normalized)
  const legacyIdKeys = Object.keys(LEGACY_ID_MAP);
  
  DEALERS.forEach(dealer => {
    if (legacyIdKeys.includes(dealer.id)) {
      issues.push(`Dealer ${dealer.name} is using legacy ID format: ${dealer.id}`);
    }
    if (legacyIdKeys.includes(dealer.kamId)) {
      issues.push(`Dealer ${dealer.name} references KAM using legacy ID: ${dealer.kamId}`);
    }
    if (legacyIdKeys.includes(dealer.tlId)) {
      issues.push(`Dealer ${dealer.name} references TL using legacy ID: ${dealer.tlId}`);
    }
  });

  CALLS.forEach(call => {
    if (legacyIdKeys.includes(call.dealerId)) {
      issues.push(`Call ${call.id} references dealer using legacy ID: ${call.dealerId}`);
    }
    if (legacyIdKeys.includes(call.kamId)) {
      issues.push(`Call ${call.id} references KAM using legacy ID: ${call.kamId}`);
    }
    if (legacyIdKeys.includes(call.tlId)) {
      issues.push(`Call ${call.id} references TL using legacy ID: ${call.tlId}`);
    }
  });

  VISITS.forEach(visit => {
    if (legacyIdKeys.includes(visit.dealerId)) {
      issues.push(`Visit ${visit.id} references dealer using legacy ID: ${visit.dealerId}`);
    }
    if (legacyIdKeys.includes(visit.kamId)) {
      issues.push(`Visit ${visit.id} references KAM using legacy ID: ${visit.kamId}`);
    }
    if (legacyIdKeys.includes(visit.tlId)) {
      issues.push(`Visit ${visit.id} references TL using legacy ID: ${visit.tlId}`);
    }
  });

  DCF_LEADS.forEach(lead => {
    if (legacyIdKeys.includes(lead.dealerId)) {
      issues.push(`DCF lead ${lead.id} references dealer using legacy ID: ${lead.dealerId}`);
    }
    if (legacyIdKeys.includes(lead.kamId)) {
      issues.push(`DCF lead ${lead.id} references KAM using legacy ID: ${lead.kamId}`);
    }
    if (legacyIdKeys.includes(lead.tlId)) {
      issues.push(`DCF lead ${lead.id} references TL using legacy ID: ${lead.tlId}`);
    }
  });

  // 11. Validate ID format consistency
  const dealerIdPattern = /^dealer-[a-z]+-\d{3}$/;
  const kamIdPattern = /^kam-[a-z]+-\d{2}$/;
  const tlIdPattern = /^tl-[a-z]+-\d{2}$/;

  DEALERS.forEach(dealer => {
    if (!dealerIdPattern.test(dealer.id)) {
      issues.push(`Dealer ${dealer.name} has invalid ID format: ${dealer.id} (expected: dealer-<region>-<3digit>)`);
    }
  });

  allKAMs.forEach(kam => {
    if (!kamIdPattern.test(kam.id)) {
      issues.push(`KAM ${kam.name} has invalid ID format: ${kam.id} (expected: kam-<region>-<2digit>)`);
    }
  });

  ORG.tls.forEach(tl => {
    if (!tlIdPattern.test(tl.id)) {
      issues.push(`TL ${tl.name} has invalid ID format: ${tl.id} (expected: tl-<region>-<2digit>)`);
    }
  });

  return {
    ok: issues.length === 0,
    issues,
  };
}

/**
 * Run validation and log results (dev mode helper)
 */
export function runValidation(): void {
  const result = validateMockDatabase();
  
  if (result.ok) {
    console.log('✅ Mock database validation passed!');
  } else {
    console.error('❌ Mock database validation failed:');
    result.issues.forEach(issue => console.error(`  - ${issue}`));
  }
}
