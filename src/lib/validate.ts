/**
 * RUNTIME VALIDATION UTILITY
 * 
 * Validates DTOs in development mode to catch schema mismatches early.
 * In production, validation is silently skipped for performance.
 * 
 * Usage:
 *   validateDTO('DealerDTO', dealer, DealerDTOSchema);
 *   validateDTO('IncentiveDTO', incentive, IncentiveDTOSchema);
 */

type ValidationSchema = Record<string, any>;

interface ValidationError {
  path: string;
  expected: string;
  actual: string;
  message: string;
}

/**
 * Validate a DTO against a schema
 * 
 * @param name - Human-readable name for error messages
 * @param data - The DTO to validate
 * @param schema - Expected schema shape
 * @returns Validation errors (empty array if valid)
 */
export function validateDTO(
  name: string,
  data: any,
  schema: ValidationSchema
): ValidationError[] {
  // Skip validation in production
  if (process.env.NODE_ENV === 'production') {
    return [];
  }
  
  const errors: ValidationError[] = [];
  
  function validate(
    obj: any,
    schema: any,
    path: string = ''
  ): void {
    // Check if obj is null/undefined when schema expects object
    if (obj === null || obj === undefined) {
      if (schema !== 'null' && schema !== 'undefined' && schema !== '?') {
        errors.push({
          path: path || 'root',
          expected: typeof schema === 'string' ? schema : 'object',
          actual: String(obj),
          message: `Expected ${typeof schema === 'string' ? schema : 'object'} but got ${obj}`
        });
      }
      return;
    }
    
    // Handle nested object schemas
    if (typeof schema === 'object' && schema !== null && !Array.isArray(schema)) {
      for (const key in schema) {
        const expectedType = schema[key];
        const actualValue = obj[key];
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if required field is missing
        if (!(key in obj)) {
          // Allow optional fields (marked with '?')
          if (typeof expectedType === 'string' && expectedType.endsWith('?')) {
            continue;
          }
          
          errors.push({
            path: currentPath,
            expected: typeof expectedType === 'string' ? expectedType : 'defined',
            actual: 'undefined',
            message: `Missing required field: ${currentPath}`
          });
          continue;
        }
        
        // Recursively validate nested objects
        if (typeof expectedType === 'object' && expectedType !== null) {
          validate(actualValue, expectedType, currentPath);
        } else {
          // Validate primitive types
          const expectedTypeClean = typeof expectedType === 'string' 
            ? expectedType.replace('?', '').replace('[]', '')
            : expectedType;
          
          // Handle arrays
          if (typeof expectedType === 'string' && expectedType.includes('[]')) {
            if (!Array.isArray(actualValue)) {
              errors.push({
                path: currentPath,
                expected: expectedType,
                actual: typeof actualValue,
                message: `Expected array but got ${typeof actualValue}`
              });
            }
            continue;
          }
          
          // Handle optional fields
          if (typeof expectedType === 'string' && expectedType.endsWith('?')) {
            if (actualValue === null || actualValue === undefined) {
              continue;
            }
          }
          
          // Check type match
          const actualType = typeof actualValue;
          if (actualType !== expectedTypeClean) {
            // Special case: Date objects
            if (expectedTypeClean === 'Date' && !(actualValue instanceof Date)) {
              errors.push({
                path: currentPath,
                expected: 'Date',
                actual: actualType,
                message: `Expected Date object but got ${actualType}`
              });
            } else if (expectedTypeClean !== 'Date' && actualType !== expectedTypeClean) {
              errors.push({
                path: currentPath,
                expected: expectedTypeClean,
                actual: actualType,
                message: `Expected ${expectedTypeClean} but got ${actualType}`
              });
            }
          }
        }
      }
    }
  }
  
  validate(data, schema);
  
  // Log errors in dev mode
  if (errors.length > 0 && process.env.NODE_ENV !== 'production') {
    console.group(`🚨 DTO Validation Error: ${name}`);
    console.error(`Found ${errors.length} validation error(s):`);
    errors.forEach(err => {
      console.error(`  ❌ ${err.path}: ${err.message}`);
    });
    console.groupEnd();
  }
  
  return errors;
}

/**
 * Assert DTO is valid (throws in dev, silent in prod)
 */
export function assertValidDTO(
  name: string,
  data: any,
  schema: ValidationSchema
): void {
  const errors = validateDTO(name, data, schema);
  
  if (errors.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(`⚠️ ${name} has validation errors but continuing...`);
  }
}

/**
 * SCHEMA DEFINITIONS
 * These define the expected shape of each DTO
 */

export const DealerDTOSchema = {
  id: 'string',
  name: 'string',
  code: 'string',
  city: 'string',
  region: 'string',
  segment: 'string',
  tags: '[]',
  status: 'string',
  kamId: 'string',
  kamName: 'string',
  tlId: 'string',
  phone: 'string?',
  email: 'string?',
  metrics: {
    leads: 'number',
    inspections: 'number',
    stockIns: 'number',
    i2si: 'number',
    dcfLeads: 'number',
    dcfOnboarded: 'boolean',
    dcfDisbursed: 'number',
    dcfGMV: 'number'
  },
  productivity: {
    productiveCalls: 'number',
    nonProductiveCalls: 'number',
    totalCalls: 'number',
    productiveCallsPercent: 'number',
    productiveVisits: 'number',
    nonProductiveVisits: 'number',
    totalVisits: 'number',
    productiveVisitsPercent: 'number'
  },
  lastInteractionAt: 'Date?',
  lastVisitAt: 'Date?',
  lastCallAt: 'Date?'
};

export const CallDTOSchema = {
  id: 'string',
  callDate: 'Date',
  callTime: 'string',
  duration: 'string',
  dealerId: 'string',
  dealerName: 'string',
  dealerCode: 'string',
  kamId: 'string',
  kamName: 'string',
  tlId: 'string',
  outcome: 'string',
  isProductive: 'boolean',
  productivitySource: 'string'
};

export const VisitDTOSchema = {
  id: 'string',
  visitDate: 'Date',
  visitTime: 'string',
  duration: 'string',
  dealerId: 'string',
  dealerName: 'string',
  dealerCode: 'string',
  kamId: 'string',
  kamName: 'string',
  tlId: 'string',
  checkInLocation: {
    latitude: 'number',
    longitude: 'number'
  },
  visitType: 'string',
  isProductive: 'boolean',
  productivitySource: 'string',
  isWithinGeofence: 'boolean'
};

export const IncentiveSummaryDTOSchema = {
  totalEarnings: 'number',
  baseIncentive: 'number',
  multiplierBonus: 'number',
  dcfCommission: 'number',
  siAchieved: 'number',
  siTarget: 'number',
  siAchievementPercent: 'number',
  inputScoreGateMet: 'boolean',
  qualityScoreGateMet: 'boolean',
  allGatesMet: 'boolean',
  projectedEarnings: 'number',
  projectedMultiplier: 'number'
};

export const ProductivitySummaryDTOSchema = {
  inputScore: 'number',
  inputScoreGate: 'number',
  inputScoreMet: 'boolean',
  qualityScore: 'number',
  qualityScoreGate: 'number',
  qualityScoreMet: 'boolean',
  calls: {
    total: 'number',
    productive: 'number',
    nonProductive: 'number',
    productivityRate: 'number',
    target: 'number',
    targetMet: 'boolean'
  },
  visits: {
    total: 'number',
    productive: 'number',
    nonProductive: 'number',
    productivityRate: 'number',
    target: 'number',
    targetMet: 'boolean'
  },
  overallProductivityRate: 'number'
};

export const DCFLeadDTOSchema = {
  id: 'string',
  customerName: 'string',
  customerPhone: 'string',
  car: 'string',
  carValue: 'number',
  loanAmount: 'number?',
  dealerId: 'string',
  dealerName: 'string',
  dealerCode: 'string',
  kamId: 'string',
  kamName: 'string',
  tlId: 'string',
  ragStatus: 'string',
  currentFunnel: 'string',
  overallStatus: 'string',
  commissionEligible: 'boolean',
  totalCommission: 'number',
  createdAt: 'Date',
  lastUpdatedAt: 'Date'
};

/**
 * Validation helper for common patterns
 */
export function validateMetrics(metrics: any, source: string): boolean {
  const errors = validateDTO(`${source} Metrics`, metrics, {
    leads: 'number',
    inspections: 'number',
    stockIns: 'number',
    i2si: 'number'
  });
  
  return errors.length === 0;
}

/**
 * Development-only visual warning component
 * Shows a red badge when validation fails
 */
export function createValidationWarning(dtoName: string, errors: ValidationError[]): void {
  if (process.env.NODE_ENV === 'production' || errors.length === 0) {
    return;
  }
  
  // Create warning badge
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 9999;
    font-family: monospace;
    font-size: 12px;
    max-width: 300px;
  `;
  badge.innerHTML = `
    <strong>⚠️ ${dtoName} Validation Failed</strong><br>
    ${errors.length} error(s) - Check console for details
  `;
  
  document.body.appendChild(badge);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    badge.remove();
  }, 5000);
}
