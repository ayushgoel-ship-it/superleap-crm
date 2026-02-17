/**
 * ENVIRONMENT CONFIGURATION
 * 
 * Single source of truth for environment-specific settings.
 * Controls feature flags, API endpoints, mock data usage.
 * 
 * Usage:
 *   import { ENV } from '../config/env';
 *   if (ENV.USE_MOCK_DATA) { ... }
 */

// Detect environment mode
type EnvironmentMode = 'dev' | 'staging' | 'prod';

/**
 * Get current environment mode
 * In production build, this would come from build-time env vars
 */
function getEnvironmentMode(): EnvironmentMode {
  // Check build-time environment variable (Vite example)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const mode = import.meta.env.MODE || import.meta.env.VITE_ENV;
    if (mode === 'production') return 'prod';
    if (mode === 'staging') return 'staging';
    return 'dev';
  }
  
  // Check Node environment variable
  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') return 'prod';
    if (nodeEnv === 'staging') return 'staging';
    return 'dev';
  }
  
  // Check hostname for deployment detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('superleap.cars24.com')) return 'prod';
    if (hostname.includes('staging.superleap')) return 'staging';
  }
  
  // Default to dev
  return 'dev';
}

/**
 * Environment configuration
 */
const MODE = getEnvironmentMode();

export const ENV = {
  // Environment mode
  MODE,
  
  // Build info
  IS_DEV: MODE === 'dev',
  IS_STAGING: MODE === 'staging',
  IS_PROD: MODE === 'prod',
  
  // Mock data configuration
  USE_MOCK_DATA: MODE !== 'prod', // Use mock data in dev/staging only
  
  // Feature flags
  ENABLE_IMPERSONATION: MODE !== 'prod', // Disable impersonation in prod
  ENABLE_DEV_WARNINGS: MODE === 'dev', // Show warnings in dev only
  ENABLE_MOCK_CREDENTIALS: MODE === 'dev', // Show mock login credentials in dev only
  ENABLE_AUDIT_LOG: true, // Always enable audit log
  ENABLE_PERFORMANCE_MONITORING: MODE === 'prod', // Monitor performance in prod
  
  // API configuration
  API_BASE_URL: getApiBaseUrl(),
  API_TIMEOUT: 30000, // 30 seconds
  
  // Storage keys prefix (prevent collision between environments)
  STORAGE_PREFIX: getStoragePrefix(),
  
  // Error handling
  SHOW_ERROR_DETAILS: MODE === 'dev', // Show stack traces in dev only
  LOG_TO_CONSOLE: MODE !== 'prod', // Console logs in dev/staging only
  
  // Performance
  ENABLE_LIST_VIRTUALIZATION: true, // Always enable for large lists
  MAX_LIST_ITEMS_WITHOUT_VIRTUALIZATION: 50,
  
  // Location/geofencing
  GEOFENCE_RADIUS_METERS: 100, // 100m radius for visit check-in
  ENABLE_MOCK_LOCATION: MODE === 'dev', // Allow mock location in dev
  
  // Logging
  LOG_LEVEL: getLogLevel(),
  
  // App metadata
  APP_VERSION: '1.0.0',
  APP_BUILD: getBuildNumber(),
  
  // External integrations
  ENABLE_WHATSAPP_DEEP_LINKS: true,
  ENABLE_CALL_INTENTS: true,
  ENABLE_MAPS_INTEGRATION: true,
} as const;

/**
 * Get API base URL based on environment
 */
function getApiBaseUrl(): string {
  switch (MODE) {
    case 'prod':
      return 'https://api.superleap.cars24.com';
    case 'staging':
      return 'https://api-staging.superleap.cars24.com';
    case 'dev':
    default:
      return 'http://localhost:3000'; // Local backend for dev
  }
}

/**
 * Get storage key prefix to prevent collision
 */
function getStoragePrefix(): string {
  switch (MODE) {
    case 'prod':
      return 'prod_superleap_';
    case 'staging':
      return 'staging_superleap_';
    case 'dev':
    default:
      return 'dev_superleap_';
  }
}

/**
 * Get log level based on environment
 */
function getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  switch (MODE) {
    case 'prod':
      return 'error'; // Only log errors in prod
    case 'staging':
      return 'warn'; // Log warnings and errors in staging
    case 'dev':
    default:
      return 'debug'; // Log everything in dev
  }
}

/**
 * Get build number (would come from CI/CD in production)
 */
function getBuildNumber(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BUILD_NUMBER) {
    return import.meta.env.VITE_BUILD_NUMBER;
  }
  
  // Fallback to timestamp-based build number
  return `build-${Date.now()}`;
}

/**
 * Environment-aware logger
 */
export const logger = {
  debug: (...args: any[]) => {
    if (ENV.LOG_LEVEL === 'debug' && ENV.LOG_TO_CONSOLE) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (['debug', 'info'].includes(ENV.LOG_LEVEL) && ENV.LOG_TO_CONSOLE) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (['debug', 'info', 'warn'].includes(ENV.LOG_LEVEL) && ENV.LOG_TO_CONSOLE) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (ENV.LOG_TO_CONSOLE) {
      console.error('[ERROR]', ...args);
    }
    
    // In production, send to error tracking service
    if (ENV.IS_PROD) {
      // TODO: Send to Sentry/DataDog/etc
      // sendToErrorTracking(args);
    }
  }
};

/**
 * Assert environment is development
 * Throws in production to prevent dev-only code from running
 */
export function assertDev(message = 'This code should only run in development') {
  if (!ENV.IS_DEV) {
    throw new Error(`DEV-ONLY CODE IN PRODUCTION: ${message}`);
  }
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    mode: ENV.MODE,
    apiBaseUrl: ENV.API_BASE_URL,
    useMockData: ENV.USE_MOCK_DATA,
    version: ENV.APP_VERSION,
    build: ENV.APP_BUILD,
    storagePrefix: ENV.STORAGE_PREFIX,
    timestamp: new Date().toISOString()
  };
}

/**
 * Print environment info to console (dev only)
 */
if (ENV.IS_DEV && typeof window !== 'undefined') {
  console.log('🚀 SuperLeap CRM Environment:', getEnvironmentInfo());
}

// Freeze the ENV object to prevent modification
Object.freeze(ENV);
