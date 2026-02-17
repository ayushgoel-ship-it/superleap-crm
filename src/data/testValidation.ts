/**
 * Quick validation test script
 * Run this to verify mock database integrity
 */

import { runValidation } from './validateMockDB';

// Run validation
console.log('=== Running Mock Database Validation ===\n');
runValidation();
console.log('\n=== Validation Complete ===');
