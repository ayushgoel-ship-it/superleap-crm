/**
 * Lead Business Rules Enforcement
 * 
 * This module contains critical business logic for:
 * - CEP mandatory validation
 * - OCB status priority management
 */

/**
 * OCB Status Types
 */
export type OCBStatus = 
  | 'running'           // OCB is currently active
  | 'no_buyer'          // OCB ended - no buyer found
  | 'nego_received'     // OCB ended - negotiation received
  | 'c24_received'      // OCB ended - CARS24 received
  | null;               // No OCB yet

/**
 * Get the display label for OCB status following priority rules
 * 
 * Priority Rule:
 * 1. If OCB is running → show "OCB Running"
 * 2. If OCB ended → show exactly ONE final state
 * 
 * @param ocbStatus - Current OCB status
 * @param isActive - Whether OCB is currently active
 * @returns Display label for the OCB status
 */
export function getOCBDisplayLabel(
  ocbStatus: OCBStatus,
  isActive: boolean = false
): string | null {
  // Rule 1: If OCB is active, always show "OCB Running"
  if (isActive || ocbStatus === 'running') {
    return 'OCB Running';
  }

  // Rule 2: If OCB ended, show the final state
  switch (ocbStatus) {
    case 'no_buyer':
      return 'No Buyer';
    case 'nego_received':
      return 'Nego Received';
    case 'c24_received':
      return 'C24 Received';
    default:
      return null;
  }
}

/**
 * Get badge styling for OCB status
 * 
 * @param ocbStatus - Current OCB status
 * @param isActive - Whether OCB is currently active
 * @returns Tailwind CSS classes for badge
 */
export function getOCBBadgeStyle(
  ocbStatus: OCBStatus,
  isActive: boolean = false
): string {
  if (isActive || ocbStatus === 'running') {
    return 'bg-amber-100 text-amber-700 border border-amber-300';
  }

  switch (ocbStatus) {
    case 'no_buyer':
      return 'bg-gray-100 text-gray-700 border border-gray-300';
    case 'nego_received':
      return 'bg-blue-100 text-blue-700 border border-blue-300';
    case 'c24_received':
      return 'bg-green-100 text-green-700 border border-green-300';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Validate if CEP is mandatory for the given action
 * 
 * CEP Rules:
 * - CEP is mandatory for non-DCF leads
 * - CEP is NOT required for DCF leads
 * - Must be validated before creating appointments
 * 
 * @param channel - Lead channel (NGS, GS, DCF)
 * @param cepValue - Current CEP value (string or null)
 * @param action - Action being performed (e.g., 'create_appointment')
 * @returns Validation result with error message if invalid
 */
export function validateCEPForAction(
  channel: 'NGS' | 'GS' | 'DCF' | string,
  cepValue: string | null,
  action: 'create_appointment' | 'move_to_negotiation'
): { valid: boolean; error?: string } {
  // CEP is never required for DCF leads
  if (channel === 'DCF') {
    return { valid: true };
  }

  // For non-DCF leads, CEP is mandatory for appointments
  if (action === 'create_appointment' || action === 'move_to_negotiation') {
    if (!cepValue || cepValue.trim() === '') {
      return {
        valid: false,
        error: 'CEP is mandatory to proceed',
      };
    }

    // Additional validation: CEP must be a valid number
    const numValue = parseFloat(cepValue);
    if (isNaN(numValue) || numValue <= 0) {
      return {
        valid: false,
        error: 'CEP must be a valid price amount',
      };
    }
  }

  return { valid: true };
}

/**
 * Check if CEP chip should be visible for a lead
 * 
 * @param channel - Lead channel
 * @param leadType - Lead type (Seller or Inventory)
 * @returns true if CEP chip should be shown
 */
export function shouldShowCEP(
  channel: 'NGS' | 'GS' | 'DCF' | string,
  leadType: 'Seller' | 'Inventory'
): boolean {
  // CEP is only shown for non-DCF Seller leads
  return channel !== 'DCF' && leadType === 'Seller';
}

/**
 * Format CEP value for display
 * 
 * @param cepValue - CEP value as string
 * @returns Formatted CEP display string
 */
export function formatCEPDisplay(cepValue: string | null): string {
  if (!cepValue) return 'CEP Pending';
  
  const numValue = parseFloat(cepValue);
  if (isNaN(numValue)) return 'CEP Pending';

  // Format in lakhs for better readability
  const lakhs = numValue / 100000;
  return `CEP: ₹${lakhs.toFixed(2)}L`;
}
