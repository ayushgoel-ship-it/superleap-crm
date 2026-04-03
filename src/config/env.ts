/**
 * ENVIRONMENT CONFIGURATION
 * Single source of truth for environment behavior.
 */

type EnvironmentMode = 'dev' | 'staging' | 'prod';

/**
 * Detect environment mode
 */
function getEnvironmentMode(): EnvironmentMode {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const mode = import.meta.env.MODE;
    if (mode === 'production') return 'prod';
    if (mode === 'staging') return 'staging';
    return 'dev';
  }

  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    if (process.env.NODE_ENV === 'production') return 'prod';
    return 'dev';
  }

  return 'dev';
}

const MODE = getEnvironmentMode();

/**
 * Parse boolean from Vite env
 */
function parseBool(value: any, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  return String(value).toLowerCase().trim() === 'true';
}

/**
 * Environment configuration object
 */
export const ENV = {
  // Mode
  MODE,
  IS_DEV: MODE === 'dev',
  IS_STAGING: MODE === 'staging',
  IS_PROD: MODE === 'prod',

  // 🔥 Data source toggle
  // Explicit control via .env.local
  USE_MOCK_DATA: parseBool(
    (import.meta as any)?.env?.VITE_USE_MOCK_DATA,
    false // always use real Supabase data
  ),

  // Supabase
  SUPABASE_URL: (import.meta as any)?.env?.VITE_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ?? '',

  // Feature flags
  ENABLE_IMPERSONATION: MODE !== 'prod',
  ENABLE_DEV_WARNINGS: MODE === 'dev',
  ENABLE_MOCK_CREDENTIALS: false, // Disabled — using Supabase Auth
  ENABLE_AUDIT_LOG: true,

  // API (future backend usage)
  API_BASE_URL:
    MODE === 'prod'
      ? 'https://api.superleap.cars24.com'
      : MODE === 'staging'
        ? 'https://api-staging.superleap.cars24.com'
        : 'http://localhost:3000',

  // Logging
  LOG_LEVEL: MODE === 'prod' ? 'error' : 'debug',

  APP_VERSION: '1.0.0',
} as const;

Object.freeze(ENV);

/**
 * Logger
 */
export const logger = {
  debug: (...args: any[]) => {
    if (ENV.LOG_LEVEL === 'debug') console.log('[DEBUG]', ...args);
  },
  info: (...args: any[]) => {
    if (ENV.LOG_LEVEL === 'debug') console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};

/**
 * Debug print (dev only)
 */
if (ENV.IS_DEV && typeof window !== 'undefined') {
  console.log('🚀 SuperLeap ENV:', {
    mode: ENV.MODE,
    useMock: ENV.USE_MOCK_DATA,
    supabase: ENV.SUPABASE_URL,
  });
}