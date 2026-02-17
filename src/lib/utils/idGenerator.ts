/**
 * ID GENERATOR UTILITY
 * 
 * Generates unique IDs for various entities.
 */

let callCounter = 1;
let visitCounter = 1;

export function generateId(prefix: 'CALL' | 'VISIT'): string {
  const timestamp = Date.now();
  
  if (prefix === 'CALL') {
    const id = `CALL-${timestamp}-${String(callCounter++).padStart(4, '0')}`;
    return id;
  }
  
  if (prefix === 'VISIT') {
    const id = `VISIT-${timestamp}-${String(visitCounter++).padStart(4, '0')}`;
    return id;
  }
  
  return `${prefix}-${timestamp}`;
}

export function resetCounters() {
  callCounter = 1;
  visitCounter = 1;
}
