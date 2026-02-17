/**
 * SINGLE SOURCE OF TRUTH FOR ALL CONSTANTS & ENUMS
 * 
 * This file centralizes all magic strings, enums, and constants used across the app.
 * DO NOT define duplicate enums or magic strings in components.
 * Import from this file instead.
 */

// ============================================================================
// TIME PERIODS
// ============================================================================

/**
 * Time period filter options
 * Used in: Admin scope bar, KAM/TL dashboards, reports, all time filter controls
 *
 * Phase 3: This is THE canonical time enum for the entire app.
 * Every screen must use TimePeriod — no local time type aliases.
 */
export enum TimePeriod {
  TODAY = 'Today',
  D_MINUS_1 = 'D-1',
  MTD = 'MTD',
  LMTD = 'LMTD',
  LAST_MONTH = 'Last Month',
  LAST_7D = 'Last 7D',
  LAST_30D = 'Last 30D',
  LAST_6M = 'Last 6M',
  LIFETIME = 'Lifetime',
  QTD = 'QTD',
  CUSTOM = 'Custom',
}

/**
 * Resolved date range from a TimePeriod.
 * fromISO is inclusive, toISO is exclusive (start of next boundary).
 * All dates are ISO-8601 strings in local timezone (IST for CARS24).
 */
export interface TimeResolvedRange {
  fromISO: string;
  toISO: string;
}

/**
 * @deprecated Phase 3 — Use TimePeriod enum directly.
 * Retained for backward compatibility; will be removed in Phase 4.
 */
export type TimePeriodValue = 'Today' | 'D-1' | 'MTD' | 'LMTD' | 'Last Month';

/**
 * @deprecated Phase 3 — Use TimePeriod enum directly.
 * Retained for backward compatibility; will be removed in Phase 4.
 */
export type TimeRange = 'today' | 'd-1' | 'mtd' | 'last-month' | 'last-7d' | 'last-30d' | 'last-6m' | 'lifetime';

/**
 * @deprecated Phase 3 — Use TimePeriod enum directly.
 * Map lowercase time range to canonical TimePeriod.
 */
export function normalizeTimeRange(range: TimeRange): TimePeriod {
  const mapping: Record<TimeRange, TimePeriod> = {
    'today': TimePeriod.TODAY,
    'd-1': TimePeriod.D_MINUS_1,
    'mtd': TimePeriod.MTD,
    'last-month': TimePeriod.LAST_MONTH,
    'last-7d': TimePeriod.LAST_7D,
    'last-30d': TimePeriod.LAST_30D,
    'last-6m': TimePeriod.LAST_6M,
    'lifetime': TimePeriod.LIFETIME,
  };
  return mapping[range];
}

// ============================================================================
// RAG STATUS (Red-Amber-Green)
// ============================================================================

/**
 * RAG status for metrics (standardized scheme)
 * Use this enum everywhere - no more 'green'/'yellow'/'red' variants
 */
export enum RAGStatus {
  GOOD = 'good',
  WARNING = 'warning',
  DANGER = 'danger',
}

/**
 * Color mappings for RAG status (Tailwind classes)
 */
export const RAG_COLORS = {
  [RAGStatus.GOOD]: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
  },
  [RAGStatus.WARNING]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  [RAGStatus.DANGER]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
};

/**
 * Legacy color scheme mapping (for migration period)
 */
export type LegacyColorState = 'green' | 'yellow' | 'red';

export function legacyColorToRAG(color: LegacyColorState): RAGStatus {
  const mapping: Record<LegacyColorState, RAGStatus> = {
    green: RAGStatus.GOOD,
    yellow: RAGStatus.WARNING,
    red: RAGStatus.DANGER,
  };
  return mapping[color];
}

// ============================================================================
// DEALER STAGES
// ============================================================================

/**
 * Dealer lifecycle stages based on engagement and performance
 */
export enum DealerStage {
  LEAD_GIVING = 'Lead giving',
  INSPECTING = 'Inspecting',
  TRANSACTING = 'Transacting',
  DORMANT = 'Dormant',
}

/**
 * All dealer stages as array (for dropdowns/filters)
 */
export const DEALER_STAGES = Object.values(DealerStage);

// ============================================================================
// PRODUCTIVITY STATUS
// ============================================================================

/**
 * Productivity classification for calls/visits
 * Based on activity delta within tracking window
 */
export enum ProductivityStatus {
  PRODUCTIVE = 'productive',
  NON_PRODUCTIVE = 'non_productive',
  PROVISIONAL = 'provisional',
}

/**
 * Productivity tracking windows (days)
 */
export const PRODUCTIVITY_WINDOWS = {
  CALL: 7,   // 7 days after call
  VISIT: 30, // 30 days after visit
} as const;

// ============================================================================
// BUSINESS CHANNELS
// ============================================================================

/**
 * Business verticals/channels
 */
export enum BusinessChannel {
  C2B = 'C2B',
  C2D = 'C2D',
  GS = 'GS',
  DCF = 'DCF',
}

/**
 * All channels as array
 */
export const BUSINESS_CHANNELS = Object.values(BusinessChannel);

// ============================================================================
// CALL OUTCOMES
// ============================================================================

/**
 * Possible outcomes for a dealer call
 */
export enum CallOutcome {
  CONNECTED = 'Connected',
  NO_ANSWER = 'No Answer',
  BUSY = 'Busy',
  LEFT_VM = 'Left VM',
}

/**
 * All call outcomes as array
 */
export const CALL_OUTCOMES = Object.values(CallOutcome);

// ============================================================================
// ENGAGEMENT FILTERS
// ============================================================================

/**
 * Engagement-based filters for dealers
 */
export enum EngagementFilter {
  NOT_CONNECTED_7D = 'not-connected-7d',
  NOT_CONNECTED_30D = 'not-connected-30d',
  NOT_VISITED_7D = 'not-visited-7d',
  NOT_VISITED_30D = 'not-visited-30d',
}

/**
 * All engagement filters as array
 */
export const ENGAGEMENT_FILTERS = Object.values(EngagementFilter);

// ============================================================================
// DEALER SEGMENTS
// ============================================================================

/**
 * Dealer performance segments
 */
export enum DealerSegment {
  A = 'A', // High value
  B = 'B', // Medium value
  C = 'C', // Low value
}

/**
 * All segments as array
 */
export const DEALER_SEGMENTS = Object.values(DealerSegment);

// ============================================================================
// LEAD STAGES
// ============================================================================

/**
 * Lead funnel stages
 */
export enum LeadStage {
  NEW = 'New',
  CONTACTED = 'Contacted',
  INSPECTION_SCHEDULED = 'Inspection Scheduled',
  INSPECTED = 'Inspected',
  OFFER_MADE = 'Offer Made',
  WON = 'Won',
  LOST = 'Lost',
}

// ============================================================================
// DCF STAGES
// ============================================================================

/**
 * DCF onboarding stages
 */
export enum DCFOnboardingStage {
  PITCHED = 'Pitched',
  DOCS_SUBMITTED = 'Docs Submitted',
  VERIFICATION_PENDING = 'Verification Pending',
  ONBOARDED = 'Onboarded',
  REJECTED = 'Rejected',
}

/**
 * DCF loan stages
 */
export enum DCFLoanStage {
  LEAD_CREATED = 'Lead Created',
  DOCS_PENDING = 'Docs Pending',
  UNDER_REVIEW = 'Under Review',
  APPROVED = 'Approved',
  DISBURSED = 'Disbursed',
  REJECTED = 'Rejected',
}

// ============================================================================
// NAVIGATION / ROUTES
// ============================================================================

/**
 * All application pages/routes
 * Replaces scattered PageView and AdminPage types
 */
export enum AppRoute {
  // Auth
  AUTH_LOGIN = 'auth-login',
  AUTH_FORGOT_PASSWORD = 'auth-forgot-password',
  
  // Profile
  PROFILE = 'profile',
  PROFILE_COMPLETE = 'profile-complete',
  
  // KAM/TL Pages
  HOME = 'home',
  DEALERS = 'dealers',
  LEADS = 'leads',
  LEAD_DETAIL = 'lead-detail',
  LEAD_CREATE = 'lead-create',
  VISITS = 'visits',
  /** @deprecated Unmounted — detail handled inline by VisitsPage. Kept for type compat. Phase 4.5 */
  VISIT_DETAIL = 'visit-detail',
  /** @deprecated Unmounted — detail handled inline by VisitsPage. Kept for type compat. Phase 4.5 */
  CALL_DETAIL = 'call-detail',
  /** @deprecated Unmounted — planned but never implemented. Kept for type compat. Phase 4.5 */
  TL_CALL_DETAIL = 'tl-call-detail',
  NOTIFICATIONS = 'notifications',
  PERFORMANCE = 'performance',
  PRODUCTIVITY = 'productivity',
  LEADERBOARD = 'leaderboard',
  
  // DCF Pages
  DCF = 'dcf',
  DCF_DEALERS = 'dcf-dealers',
  DCF_LEADS = 'dcf-leads',
  DCF_DISBURSALS = 'dcf-disbursals',
  DCF_DEALER_DETAIL = 'dcf-dealer-detail',
  DCF_LEAD_DETAIL = 'dcf-lead-detail',
  DCF_ONBOARDING_DETAIL = 'dcf-onboarding-detail',
  DCF_ONBOARDING = 'dcf-onboarding',
  /** @deprecated Unmounted — 'dcf-onboarding' is the live route. Kept for type compat. Phase 4.5 */
  DCF_ONBOARDING_FORM = 'dcf-onboarding-form',
  
  // Feedback Pages
  CALL_FEEDBACK = 'call-feedback',
  VISIT_FEEDBACK = 'visit-feedback',
  /** @deprecated Unmounted — check-in handled inline by VisitsPage. Kept for type compat. Phase 4.5 */
  VISIT_CHECKIN = 'visit-checkin',
  
  // Tools
  INCENTIVE_SIMULATOR = 'incentive-simulator',
  
  // Navigation Detail Pages (no bottom nav, reached via in-app navigation)
  DEALER_LOCATION_UPDATE = 'dealer-location-update',
  
  // Admin Pages
  ADMIN_DASHBOARD = 'admin-dashboard',
  ADMIN_HOME = 'admin-home',
  ADMIN_DEALERS = 'admin-dealers',
  ADMIN_LEADS = 'admin-leads',
  ADMIN_VC = 'admin-vc',
  ADMIN_DCF = 'admin-dcf',
  ADMIN_TL_LEADERBOARD = 'admin-tl-leaderboard',
  ADMIN_TL_DETAIL = 'admin-tl-detail',
  
  // Demo Pages
  DEMO_LOCATION_UPDATE = 'demo-location-update',
  DEMO_VISIT_FEEDBACK = 'demo-visit-feedback',
}

/**
 * Type for route values (for backward compatibility)
 */
export type AppRouteValue = `${AppRoute}`;

/**
 * Admin-specific routes
 */
export const ADMIN_ROUTES = [
  AppRoute.ADMIN_HOME,
  AppRoute.ADMIN_DEALERS,
  AppRoute.ADMIN_LEADS,
  AppRoute.ADMIN_VC,
  AppRoute.ADMIN_DCF,
] as const;

/**
 * Type for admin routes only
 */
export type AdminRoute = typeof ADMIN_ROUTES[number];

// ============================================================================
// USER ROLES (Note: Keep auth/types.ts as source of truth for UserRole type)
// ============================================================================
// Don't define UserRole here - it lives in /lib/auth/types.ts
// Import from there when needed

// ============================================================================
// METRIC THRESHOLDS
// ============================================================================

/**
 * Standard RAG thresholds for metrics
 */
export const METRIC_THRESHOLDS = {
  // Achievement % thresholds
  ACHIEVEMENT: {
    GOOD: 100,    // >= 100% of target
    WARNING: 80,  // >= 80% of target
    // < 80% = DANGER
  },
  
  // Input Score thresholds
  INPUT_SCORE: {
    GOOD: 75,     // >= 75
    WARNING: 70,  // >= 70
    // < 70 = DANGER
  },
  
  // Quality % thresholds (lower is better)
  QUALITY: {
    GOOD: 85,     // <= 85%
    WARNING: 90,  // <= 90%
    // > 90% = DANGER
  },
  
  // Unique Raise % thresholds
  UNIQUE_RAISE: {
    GOOD: 75,     // >= 75%
    WARNING: 60,  // >= 60%
    // < 60% = DANGER
  },
  
  // Productivity % thresholds
  PRODUCTIVITY: {
    GOOD: 70,     // >= 70%
    WARNING: 50,  // >= 50%
    // < 50% = DANGER
  },
} as const;

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filter categories for dealers page
 */
export enum FilterType {
  STATUS = 'status',
  STAGE = 'stage',
  TIME = 'time',
  ENGAGEMENT = 'engagement',
}

// ============================================================================
// VIEW MODES
// ============================================================================

/**
 * Application view modes
 */
export enum ViewMode {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a route is an admin route
 */
export function isAdminRoute(route: AppRoute | string): boolean {
  return (ADMIN_ROUTES as readonly string[]).includes(route);
}

/**
 * Get default home route for a role
 */
export function getDefaultHomeRoute(role: 'KAM' | 'TL' | 'Admin'): AppRoute {
  if (role === 'Admin') {
    return AppRoute.ADMIN_HOME;
  }
  return AppRoute.HOME;
}