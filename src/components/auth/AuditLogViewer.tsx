/**
 * AUDIT LOG VIEWER
 * 
 * Admin-only screen to view authentication and authorization events
 */

import { useState, useMemo } from 'react';
import { FileText, Download, RefreshCw, Filter, Clock, User, Shield } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  getAuditEvents,
  getAuditSummary,
  formatAuditEvent,
  exportAuditLogCSV,
  AuditEvent,
  AuditEventType
} from '../../auth/auditLog';
import { canPerformAction } from '../../auth/permissions';
import { toast } from 'sonner@2.0.3';

export function AuditLogViewer() {
  const { profile, session } = useAuth();
  const authRole = profile?.role ?? null;
  const activeRole = (session?.activeRole as string) ?? authRole;
  const [filterType, setFilterType] = useState<AuditEventType | 'ALL'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Check permission
  if (!canPerformAction(authRole, activeRole, 'VIEW_AUDIT_LOG')) {
    return (
      <div className="p-8 text-center">
        <Shield className="size-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Only Admins can view audit logs</p>
      </div>
    );
  }
  
  // Get events
  const allEvents = useMemo(() => getAuditEvents(), [refreshKey]);
  const summary = useMemo(() => getAuditSummary(), [refreshKey]);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === 'ALL') return allEvents;
    return allEvents.filter(e => e.type === filterType);
  }, [allEvents, filterType]);
  
  // Handle export
  const handleExport = () => {
    try {
      const csv = exportAuditLogCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit log exported');
    } catch (error) {
      toast.error('Failed to export audit log');
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Audit log refreshed');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="size-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                <p className="text-sm text-gray-600">
                  View authentication and authorization events
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="size-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="size-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Total Events</div>
              <div className="text-2xl font-bold">{summary.totalEvents}</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Unique Users</div>
              <div className="text-2xl font-bold">{summary.uniqueUsers}</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Login Events</div>
              <div className="text-2xl font-bold">
                {summary.eventsByType['LOGIN'] || 0}
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Impersonations</div>
              <div className="text-2xl font-bold">
                {summary.eventsByType['START_IMPERSONATION'] || 0}
              </div>
            </Card>
          </div>
          
          {/* Filter */}
          <div className="flex items-center gap-3">
            <Filter className="size-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as AuditEventType | 'ALL')}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Events</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="START_IMPERSONATION">Start Impersonation</SelectItem>
                <SelectItem value="EXIT_IMPERSONATION">Exit Impersonation</SelectItem>
                <SelectItem value="PERMISSION_DENIED">Permission Denied</SelectItem>
                <SelectItem value="ROUTE_BLOCKED">Route Blocked</SelectItem>
              </SelectContent>
            </Select>
            
            <span className="text-sm text-gray-600 ml-auto">
              Showing {filteredEvents.length} of {allEvents.length} events
            </span>
          </div>
        </div>
        
        {/* Events List */}
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredEvents.length === 0 ? (
              <div className="card-premium p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[12px] text-slate-400 font-medium">No audit events found</p>
              </div>
            ) : (
              filteredEvents.map(event => (
                <AuditEventRow key={event.id} event={event} />
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Single audit event row
 */
function AuditEventRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  
  const getEventColor = (type: AuditEventType) => {
    switch (type) {
      case 'LOGIN': return 'bg-green-100 text-green-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      case 'START_IMPERSONATION': return 'bg-amber-100 text-amber-800';
      case 'EXIT_IMPERSONATION': return 'bg-blue-100 text-blue-800';
      case 'PERMISSION_DENIED': return 'bg-red-100 text-red-800';
      case 'ROUTE_BLOCKED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div 
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Icon */}
        <div className="mt-1">
          {event.type.includes('IMPERSONATION') && <Shield className="size-5 text-amber-600" />}
          {event.type === 'LOGIN' && <User className="size-5 text-green-600" />}
          {event.type === 'LOGOUT' && <User className="size-5 text-gray-600" />}
          {(event.type === 'PERMISSION_DENIED' || event.type === 'ROUTE_BLOCKED') && (
            <Shield className="size-5 text-red-600" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`${getEventColor(event.type)} text-xs`}>
              {event.type.replace(/_/g, ' ')}
            </Badge>
            <span className="text-sm font-medium text-gray-900">
              {event.userName}
            </span>
            <span className="text-xs text-gray-500">({event.userRole})</span>
          </div>
          
          <p className="text-sm text-gray-700">
            {formatAuditEvent(event)}
          </p>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatTime(event.timestamp)}
            </span>
            <span>ID: {event.id.split('_')[1]}</span>
          </div>
        </div>
      </div>
      
      {/* Expanded Metadata */}
      {expanded && (
        <div className="mt-3 ml-9 p-3 bg-gray-100 rounded text-xs">
          <pre className="overflow-x-auto">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}