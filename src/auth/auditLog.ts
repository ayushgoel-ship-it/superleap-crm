/**
 * AUDIT LOG SYSTEM
 * 
 * Tracks all authentication and authorization events.
 * Stores in localStorage (client-side mock).
 * 
 * In production, this would send to backend API.
 */

// localStorage key
const LS_AUDIT_LOG_KEY = 'superleap_audit_log';
const MAX_AUDIT_ENTRIES = 200; // Keep last 200 events

/**
 * Audit Event Types
 */
export type AuditEventType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'START_IMPERSONATION'
  | 'EXIT_IMPERSONATION'
  | 'PERMISSION_DENIED'
  | 'ROUTE_BLOCKED'
  | 'ACTION_BLOCKED'
  | 'LOCATION_APPROVAL'
  | 'TARGET_UPDATE'
  | 'EXPORT_DATA';

/**
 * Audit Event
 */
export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: string;
  metadata: Record<string, any>;
  ipAddress?: string; // Mock for now
  userAgent?: string; // Mock for now
}

/**
 * Log an audit event
 */
export function logAuditEvent(
  type: AuditEventType,
  metadata: Record<string, any>
): void {
  try {
    const event: AuditEvent = {
      id: generateEventId(),
      type,
      timestamp: new Date().toISOString(),
      userId: metadata.userId || metadata.adminUserId || 'unknown',
      userName: metadata.name || metadata.adminName || 'Unknown',
      userRole: metadata.role || 'Unknown',
      metadata,
      ipAddress: getMockIpAddress(),
      userAgent: getMockUserAgent()
    };
    
    // Get existing events
    const events = getAuditEvents();
    
    // Add new event at the beginning
    events.unshift(event);
    
    // Keep only last MAX_AUDIT_ENTRIES
    const trimmed = events.slice(0, MAX_AUDIT_ENTRIES);
    
    // Save to localStorage
    localStorage.setItem(LS_AUDIT_LOG_KEY, JSON.stringify(trimmed));
    
    // Log to console in dev mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUDIT] ${type}:`, metadata);
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Get all audit events (newest first)
 */
export function getAuditEvents(): AuditEvent[] {
  try {
    const data = localStorage.getItem(LS_AUDIT_LOG_KEY);
    if (!data) return [];
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get audit events:', error);
    return [];
  }
}

/**
 * Get audit events filtered by type
 */
export function getAuditEventsByType(type: AuditEventType): AuditEvent[] {
  return getAuditEvents().filter(e => e.type === type);
}

/**
 * Get audit events for a specific user
 */
export function getAuditEventsByUser(userId: string): AuditEvent[] {
  return getAuditEvents().filter(e => e.userId === userId);
}

/**
 * Get audit events in date range
 */
export function getAuditEventsByDateRange(
  startDate: Date,
  endDate: Date
): AuditEvent[] {
  return getAuditEvents().filter(e => {
    const eventDate = new Date(e.timestamp);
    return eventDate >= startDate && eventDate <= endDate;
  });
}

/**
 * Get impersonation events
 */
export function getImpersonationEvents(): AuditEvent[] {
  return getAuditEvents().filter(e => 
    e.type === 'START_IMPERSONATION' || e.type === 'EXIT_IMPERSONATION'
  );
}

/**
 * Get recent events (last N)
 */
export function getRecentAuditEvents(count: number = 50): AuditEvent[] {
  return getAuditEvents().slice(0, count);
}

/**
 * Clear audit log (Admin only)
 */
export function clearAuditLog(): void {
  localStorage.removeItem(LS_AUDIT_LOG_KEY);
  
  // Log the clear action itself
  logAuditEvent('ACTION_BLOCKED', {
    action: 'CLEAR_AUDIT_LOG',
    reason: 'Admin cleared audit log'
  });
}

/**
 * Export audit log as JSON
 */
export function exportAuditLog(): string {
  const events = getAuditEvents();
  return JSON.stringify(events, null, 2);
}

/**
 * Export audit log as CSV
 */
export function exportAuditLogCSV(): string {
  const events = getAuditEvents();
  
  if (events.length === 0) {
    return 'No audit events to export';
  }
  
  // CSV headers
  const headers = ['ID', 'Type', 'Timestamp', 'User ID', 'User Name', 'Role', 'Metadata'];
  
  // CSV rows
  const rows = events.map(event => [
    event.id,
    event.type,
    event.timestamp,
    event.userId,
    event.userName,
    event.userRole,
    JSON.stringify(event.metadata)
  ]);
  
  // Combine
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csv;
}

/**
 * Get audit summary statistics
 */
export function getAuditSummary(): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  uniqueUsers: number;
  dateRange: { earliest: string; latest: string };
} {
  const events = getAuditEvents();
  
  if (events.length === 0) {
    return {
      totalEvents: 0,
      eventsByType: {},
      uniqueUsers: 0,
      dateRange: { earliest: '', latest: '' }
    };
  }
  
  // Count by type
  const eventsByType: Record<string, number> = {};
  events.forEach(e => {
    eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
  });
  
  // Unique users
  const uniqueUsers = new Set(events.map(e => e.userId)).size;
  
  // Date range
  const timestamps = events.map(e => e.timestamp).sort();
  const earliest = timestamps[timestamps.length - 1];
  const latest = timestamps[0];
  
  return {
    totalEvents: events.length,
    eventsByType,
    uniqueUsers,
    dateRange: { earliest, latest }
  };
}

/**
 * Format audit event for display
 */
export function formatAuditEvent(event: AuditEvent): string {
  const date = new Date(event.timestamp).toLocaleString();
  
  switch (event.type) {
    case 'LOGIN':
      return `${date}: ${event.userName} logged in`;
      
    case 'LOGOUT':
      return `${date}: ${event.userName} logged out`;
      
    case 'START_IMPERSONATION':
      return `${date}: ${event.metadata.adminName} started impersonating ${event.metadata.targetName} (${event.metadata.targetRole})`;
      
    case 'EXIT_IMPERSONATION':
      return `${date}: ${event.metadata.adminName} stopped impersonating ${event.metadata.targetName}`;
      
    case 'PERMISSION_DENIED':
      return `${date}: ${event.userName} was denied permission for ${event.metadata.action}`;
      
    case 'ROUTE_BLOCKED':
      return `${date}: ${event.userName} was blocked from accessing ${event.metadata.route}`;
      
    case 'LOCATION_APPROVAL':
      return `${date}: ${event.userName} approved location change for ${event.metadata.dealerName}`;
      
    case 'TARGET_UPDATE':
      return `${date}: ${event.userName} updated targets`;
      
    case 'EXPORT_DATA':
      return `${date}: ${event.userName} exported ${event.metadata.dataType}`;
      
    default:
      return `${date}: ${event.type} by ${event.userName}`;
  }
}

/**
 * Helper: Generate unique event ID
 */
function generateEventId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper: Get mock IP address
 */
function getMockIpAddress(): string {
  // In production, this would be the real IP
  return '192.168.1.' + Math.floor(Math.random() * 255);
}

/**
 * Helper: Get mock user agent
 */
function getMockUserAgent(): string {
  // In production, this would be the real user agent
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent;
  }
  return 'Unknown';
}

/**
 * Seed initial audit events (for demo)
 */
export function seedInitialAuditEvents(): void {
  const existingEvents = getAuditEvents();
  if (existingEvents.length > 0) {
    return; // Already seeded
  }
  
  const now = Date.now();
  const mockEvents: Omit<AuditEvent, 'id' | 'ipAddress' | 'userAgent'>[] = [
    {
      type: 'LOGIN',
      timestamp: new Date(now - 3600000).toISOString(),
      userId: 'admin-01',
      userName: 'Admin User',
      userRole: 'ADMIN',
      metadata: { email: 'admin@cars24.com' }
    },
    {
      type: 'START_IMPERSONATION',
      timestamp: new Date(now - 3000000).toISOString(),
      userId: 'admin-01',
      userName: 'Admin User',
      userRole: 'ADMIN',
      metadata: {
        adminUserId: 'admin-01',
        adminName: 'Admin User',
        targetUserId: 'tl-ncr-01',
        targetName: 'Rajesh Kumar',
        targetRole: 'TL'
      }
    },
    {
      type: 'EXIT_IMPERSONATION',
      timestamp: new Date(now - 2400000).toISOString(),
      userId: 'admin-01',
      userName: 'Admin User',
      userRole: 'ADMIN',
      metadata: {
        adminUserId: 'admin-01',
        adminName: 'Admin User',
        targetUserId: 'tl-ncr-01',
        targetName: 'Rajesh Kumar',
        targetRole: 'TL',
        duration: 600000
      }
    },
    {
      type: 'LOGIN',
      timestamp: new Date(now - 1800000).toISOString(),
      userId: 'kam-ncr-01',
      userName: 'Amit Verma',
      userRole: 'KAM',
      metadata: { email: 'amit.verma@cars24.com' }
    },
    {
      type: 'PERMISSION_DENIED',
      timestamp: new Date(now - 1200000).toISOString(),
      userId: 'kam-ncr-01',
      userName: 'Amit Verma',
      userRole: 'KAM',
      metadata: {
        action: 'IMPERSONATE',
        reason: 'Only Admins can impersonate'
      }
    }
  ];
  
  mockEvents.forEach(event => {
    logAuditEvent(event.type, event.metadata);
  });
}
