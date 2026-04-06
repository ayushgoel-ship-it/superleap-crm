/**
 * INBOX — Smart, Actionable Notification Feed
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  DESIGN NOTE                                        │
 * │                                                     │
 * │  Inbox = "What needs my attention next?"            │
 * │  It complements Activity ("What work happened?").   │
 * │                                                     │
 * │  Notification grouping reduces cognitive load:      │
 * │  Instead of a raw chronological dump, items are     │
 * │  bucketed by intent — Action Required, Feedback     │
 * │  Pending, Dealer Updates, System/Info. The KAM      │
 * │  can collapse low-priority groups and focus on       │
 * │  what truly needs action.                            │
 * │                                                     │
 * │  Taking an action auto-marks the item as read,      │
 * │  so the unread count stays honest and the KAM       │
 * │  always knows how much is left.                      │
 * └─────────────────────────────────────────────────────┘
 */

import { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle, Clock, Phone, FileText, MapPin, Users, TrendingDown,
  ChevronDown, Zap, CheckCircle2, Bell, MessageSquare, Info, Eye,
  User, X,
} from 'lucide-react';
import type { UserRole } from '../../lib/shared/appTypes';
import { LeadDetailV2AdapterForNotifications } from './LeadDetailV2AdapterForNotifications';
import { FilterChip, StatusChip } from '../premium/Chip';
import { EmptyState } from '../premium/EmptyState';
import { toast } from 'sonner@2.0.3';
import {
  getFilteredLeads,
  getFilteredDCFLeads,
  getFilteredCalls,
  classifyLeadStage,
  isStockIn,
  isInspection,
} from '../../data/canonicalMetrics';
import { getRuntimeDBSync } from '../../data/runtimeDB';
import { TimePeriod } from '../../lib/domain/constants';

// ── Types ──

type Channel = 'NGS' | 'GS' | 'DCF';
type NotifGroup = 'action' | 'feedback' | 'dealer' | 'system';
type TabFilter = 'unread' | 'all';

interface SelectedLead {
  regNo: string;
  customer: string;
  channel: Channel | string;
  leadType: 'Seller' | 'Inventory';
  currentStage: string;
}

interface Notification {
  id: string;
  group: NotifGroup;
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  timestamp: string;        // ISO string
  isRead: boolean;
  cta?: { label: string; action: () => void };
  meta?: { label: string; value: string }[];
  lead?: SelectedLead;      // For navigation
}

// ── Group config ──

const GROUP_CONFIG: Record<NotifGroup, { label: string; icon: typeof Zap; color: string; dotColor: string }> = {
  action:   { label: 'Action Required', icon: Zap,              color: 'text-rose-700', dotColor: 'bg-rose-500' },
  feedback: { label: 'Feedback Pending', icon: MessageSquare,   color: 'text-indigo-700', dotColor: 'bg-indigo-500' },
  dealer:   { label: 'Dealer Updates',   icon: Users,           color: 'text-amber-700', dotColor: 'bg-amber-500' },
  system:   { label: 'System / Info',    icon: Info,            color: 'text-slate-600', dotColor: 'bg-slate-400' },
};

const GROUP_ORDER: NotifGroup[] = ['action', 'feedback', 'dealer', 'system'];

// ── Props ──

interface NotificationCenterPageProps {
  userRole: UserRole;
}

// ── Component ──

export function NotificationCenterPage({ userRole }: NotificationCenterPageProps) {
  const [tabFilter, setTabFilter] = useState<TabFilter>('unread');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<NotifGroup>>(new Set());
  const [selectedLead, setSelectedLead] = useState<SelectedLead | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  // Mark as read helper
  const markRead = useCallback((id: string) => {
    setReadIds(prev => new Set([...prev, id]));
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
    toast.success('All marked as read');
  }, []);

  const archiveItem = useCallback((id: string) => {
    setArchivedIds(prev => new Set([...prev, id]));
    markRead(id);
    toast('Archived', { description: 'Notification removed from inbox' });
  }, [markRead]);

  // Action that also marks read
  const handleAction = useCallback((notif: Notification) => {
    markRead(notif.id);
    if (notif.lead) {
      setSelectedLead(notif.lead);
    } else if (notif.cta) {
      notif.cta.action();
    }
  }, [markRead]);

  // ── Lead detail sub-page ──
  if (selectedLead) {
    return (
      <LeadDetailV2AdapterForNotifications
        regNo={selectedLead.regNo}
        customer={selectedLead.customer}
        channel={selectedLead.channel}
        leadType={selectedLead.leadType}
        currentStage={selectedLead.currentStage}
        onBack={() => setSelectedLead(null)}
        userRole={userRole}
      />
    );
  }

  // ── Dynamic notifications from canonical data ──
  const notifications: Notification[] = useMemo(() => {
    const items: Notification[] = [];
    const now = new Date();
    const twoDaysMs = 2 * 24 * 3600000;

    // Fetch recent data (last 7 days = notification expiry window)
    const recentLeads = getFilteredLeads({ period: TimePeriod.LAST_7D });
    const recentDCF = getFilteredDCFLeads({ period: TimePeriod.LAST_7D });
    const recentCalls = getFilteredCalls({ period: TimePeriod.LAST_7D });
    const allLeads30d = getFilteredLeads({ period: TimePeriod.LAST_30D });

    // ── ACTION: CEP Pending (no CEP or CEP=0) ──
    recentLeads
      .filter(l => !l.cep || l.cep === 0)
      .slice(0, 3)
      .forEach((lead) => {
        items.push({
          id: `cep-${lead.id}`,
          group: 'action',
          icon: AlertTriangle,
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-600',
          title: 'CEP Pending',
          description: `${lead.customerName} \u00b7 ${lead.regNo || lead.registrationNumber || 'N/A'} \u2014 No Customer Expected Price set.`,
          timestamp: lead.createdAt,
          isRead: false,
          lead: {
            regNo: lead.regNo || lead.registrationNumber || '',
            customer: lead.customerName,
            channel: lead.channel as Channel,
            leadType: lead.leadType as 'Seller' | 'Inventory',
            currentStage: lead.stage,
          },
          cta: { label: 'View Lead', action: () => {} },
        });
      });

    // ── ACTION: Stale post-inspection (Inspection Done >2 days, not moved) ──
    recentLeads
      .filter(l => {
        const canonical = classifyLeadStage(l.stage, l.createdAt);
        if (canonical !== 'In Nego') return false;
        // Check if inspection date is >2 days old
        const inspDate = l.inspectionDate || l.updatedAt;
        return inspDate && (now.getTime() - new Date(inspDate).getTime()) > twoDaysMs;
      })
      .slice(0, 3)
      .forEach((lead) => {
        const daysSinceInsp = Math.floor((now.getTime() - new Date(lead.inspectionDate || lead.updatedAt).getTime()) / 86_400_000);
        items.push({
          id: `stale-insp-${lead.id}`,
          group: 'action',
          icon: Clock,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          title: `Inspection Done \u2014 ${daysSinceInsp}d stale`,
          description: `${lead.customerName} \u00b7 ${lead.regNo || 'N/A'} \u2014 Inspection completed ${daysSinceInsp} days ago, no OCB/PR raised.`,
          timestamp: lead.updatedAt,
          isRead: false,
          lead: {
            regNo: lead.regNo || lead.registrationNumber || '',
            customer: lead.customerName,
            channel: lead.channel as Channel,
            leadType: lead.leadType as 'Seller' | 'Inventory',
            currentStage: lead.stage,
          },
          cta: { label: 'View Lead', action: () => {} },
          meta: lead.expectedRevenue ? [{ label: 'Potential', value: `\u20B9${(lead.expectedRevenue / 1000).toFixed(1)}K` }] : undefined,
        });
      });

    // ── ACTION: DCF Delayed ──
    recentDCF
      .filter(d => d.overallStatus === 'DELAYED')
      .slice(0, 3)
      .forEach((dcf) => {
        items.push({
          id: `dcf-delay-${dcf.id}`,
          group: 'action',
          icon: AlertTriangle,
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-600',
          title: 'DCF Delayed',
          description: `${dcf.customerName} \u00b7 ${dcf.regNo} \u2014 Loan ${dcf.currentFunnel}/${dcf.currentSubStage} stuck.`,
          timestamp: dcf.lastUpdatedAt || dcf.createdAt,
          isRead: false,
          cta: { label: 'Review', action: () => toast.info(`Opening DCF lead ${dcf.id}`) },
        });
      });

    // ── FEEDBACK: Calls with pending feedback ──
    recentCalls
      .filter(c => c.feedbackStatus === 'PENDING')
      .slice(0, 4)
      .forEach((call) => {
        items.push({
          id: `fb-${call.id}`,
          group: 'feedback',
          icon: Phone,
          iconBg: 'bg-indigo-50',
          iconColor: 'text-indigo-600',
          title: 'Call feedback pending',
          description: `${call.dealerName} (${call.dealerCode}) \u2014 ${call.outcome || call.callStatus} call, feedback not submitted.`,
          timestamp: call.callDate,
          isRead: false,
          cta: { label: 'Add Feedback', action: () => toast.info('Opening feedback form') },
        });
      });

    // ── DEALER: Dormant dealers (0 leads in last 30 days) ──
    const dealerIdsWithLeads30d = new Set(allLeads30d.map(l => l.dealerId));
    (getRuntimeDBSync().dealers as import('../../data/types').Dealer[])
      .filter(d => d.status === 'active' && !dealerIdsWithLeads30d.has(d.id))
      .slice(0, 3)
      .forEach((dealer) => {
        items.push({
          id: `dormant-${dealer.id}`,
          group: 'dealer',
          icon: TrendingDown,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          title: 'Dormant Dealer \u2014 Zero Leads',
          description: `${dealer.name} (${dealer.code}) \u2014 no leads in last 30 days.`,
          timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(), // approximate
          isRead: false,
          cta: { label: 'Call Dealer', action: () => toast.info(`Calling ${dealer.name}...`) },
        });
      });

    // ── SYSTEM: Recent stock-ins (celebration) ──
    recentLeads
      .filter(l => isStockIn(l.stage))
      .slice(0, 3)
      .forEach((lead) => {
        items.push({
          id: `si-${lead.id}`,
          group: 'system',
          icon: CheckCircle2,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
          title: 'Stock-in completed',
          description: `${lead.make} ${lead.model} (${lead.regNo || 'N/A'}) \u2014 ${lead.customerName} stock-in done.`,
          timestamp: lead.updatedAt,
          isRead: true,
        });
      });

    // Sort each group by timestamp (newest first)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items;
  }, []);

  // Apply read/archived overrides
  const liveNotifications = useMemo(
    () => notifications
      .filter(n => !archivedIds.has(n.id))
      .map(n => ({ ...n, isRead: n.isRead || readIds.has(n.id) })),
    [notifications, readIds, archivedIds]
  );

  // Filter by tab
  const visibleNotifications = useMemo(
    () => tabFilter === 'unread'
      ? liveNotifications.filter(n => !n.isRead)
      : liveNotifications,
    [liveNotifications, tabFilter]
  );

  const unreadCount = liveNotifications.filter(n => !n.isRead).length;

  // Group
  const grouped = useMemo(() => {
    const map = new Map<NotifGroup, Notification[]>();
    for (const n of visibleNotifications) {
      if (!map.has(n.group)) map.set(n.group, []);
      map.get(n.group)!.push(n);
    }
    return GROUP_ORDER
      .filter(g => map.has(g))
      .map(g => ({ group: g, items: map.get(g)!, ...GROUP_CONFIG[g] }));
  }, [visibleNotifications]);

  const toggleGroup = (g: NotifGroup) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  // ── Time helpers ──
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  // ── Render ──
  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">

      {/* ═══ HEADER ═══ */}
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Inbox</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[11px] font-bold rounded-full min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Alerts and actions that need attention</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-semibold text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs: Unread | All */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
          {([
            { key: 'unread' as TabFilter, label: 'Unread', count: unreadCount },
            { key: 'all' as TabFilter, label: 'All', count: liveNotifications.length },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTabFilter(key)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 min-h-[36px]
                flex items-center justify-center gap-1.5
                ${tabFilter === key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${tabFilter === key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}
              `}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* TL: KAM selector */}
        {userRole === 'TL' && (
          <TLKAMSelector />
        )}
      </div>

      {/* ═══ BODY ═══ */}
      <div className="flex-1 overflow-y-auto">

        {/* All caught up */}
        {visibleNotifications.length === 0 && tabFilter === 'unread' && (
          <EmptyState
            variant="empty"
            type="notifications"
            title="All caught up!"
            description="No unread notifications right now. Great job staying on top of things."
            secondaryLabel="View all notifications"
            onSecondary={() => setTabFilter('all')}
          />
        )}

        {visibleNotifications.length === 0 && tabFilter === 'all' && (
          <EmptyState
            variant="empty"
            type="notifications"
          />
        )}

        {/* Grouped feed */}
        {grouped.length > 0 && (
          <div className="px-4 pt-3 pb-4 space-y-4 animate-fade-in">
            {grouped.map(({ group, items, label, icon: GroupIcon, color, dotColor }) => {
              const isCollapsed = collapsedGroups.has(group);
              return (
                <div key={group}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center gap-2.5 py-2 group"
                  >
                    <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                    <span className={`text-[13px] font-semibold ${color}`}>{label}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full
                      ${group === 'action' ? 'bg-rose-50 text-rose-700' :
                        group === 'feedback' ? 'bg-indigo-50 text-indigo-700' :
                        group === 'dealer' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-500'}
                    `}>
                      {items.length}
                    </span>
                    <div className="flex-1" />
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200
                      ${isCollapsed ? '-rotate-90' : ''}
                    `} />
                  </button>

                  {/* Items */}
                  {!isCollapsed && (
                    <div className="space-y-2 animate-fade-in">
                      {items.map((notif) => (
                        <NotifCard
                          key={notif.id}
                          notif={notif}
                          timeAgo={timeAgo(notif.timestamp)}
                          onAction={() => handleAction(notif)}
                          onArchive={() => archiveItem(notif.id)}
                          onMarkRead={() => markRead(notif.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="py-2.5 px-4 glass-nav border-t border-slate-200/60 text-[11px] text-slate-400 text-center font-medium tracking-wide">
        {visibleNotifications.length} notification{visibleNotifications.length !== 1 ? 's' : ''}
        {unreadCount > 0 && ` \u00b7 ${unreadCount} unread`}
      </div>
    </div>
  );
}

// ── Notification Card ──

function NotifCard({
  notif,
  timeAgo,
  onAction,
  onArchive,
  onMarkRead,
}: {
  notif: Notification;
  timeAgo: string;
  onAction: () => void;
  onArchive: () => void;
  onMarkRead: () => void;
}) {
  const Icon = notif.icon;

  return (
    <div className={`card-premium overflow-hidden transition-all duration-200
      ${!notif.isRead ? 'border-l-[3px] border-l-indigo-400' : ''}
    `}>
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-8 h-8 rounded-xl ${notif.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${notif.iconColor}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`text-[12px] font-semibold leading-snug
                ${!notif.isRead ? 'text-slate-800' : 'text-slate-600'}
              `}>
                {notif.title}
              </h4>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                )}
                <span className="text-[10px] text-slate-400 font-medium tabular-nums whitespace-nowrap">{timeAgo}</span>
              </div>
            </div>

            <p className={`text-[11px] leading-relaxed mt-0.5 line-clamp-2
              ${!notif.isRead ? 'text-slate-500' : 'text-slate-400'}
            `}>
              {notif.description}
            </p>

            {/* Meta chips */}
            {notif.meta && notif.meta.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {notif.meta.map((m, i) => (
                  <span key={i} className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    {m.label}: {m.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action footer */}
      {(notif.cta || !notif.isRead) && (
        <div className="px-3.5 py-2 bg-slate-50/50 border-t border-slate-100/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!notif.isRead && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
                className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors px-1.5 py-1 rounded-md hover:bg-slate-100"
              >
                Mark read
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(); }}
              className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors px-1.5 py-1 rounded-md hover:bg-slate-100"
            >
              Archive
            </button>
          </div>

          {notif.cta && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(); }}
              className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg
                         hover:bg-indigo-700 active:scale-95 transition-all min-h-[30px]"
            >
              {notif.cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── TL KAM Selector (compact) ──

function TLKAMSelector() {
  const [selectedKAM, setSelectedKAM] = useState('all');
  const [open, setOpen] = useState(false);

  // Extract unique KAM names from actual lead data
  const kams = useMemo(() => {
    const allLeads = getFilteredLeads({ period: TimePeriod.LAST_30D });
    const kamMap = new Map<string, string>(); // kamId -> kamName
    for (const lead of allLeads) {
      if (lead.kamId && lead.kamName && !kamMap.has(lead.kamId)) {
        kamMap.set(lead.kamId, lead.kamName);
      }
    }
    const entries: { id: string; name: string }[] = [{ id: 'all', name: 'All KAMs' }];
    for (const [id, name] of kamMap) {
      entries.push({ id, name });
    }
    return entries;
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <Users className="w-3.5 h-3.5" />
        <span>TL View</span>
      </div>
      <div className="h-4 w-px bg-slate-200" />
      <div className="relative flex-1">
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[13px] font-medium
                     flex items-center justify-between hover:border-slate-300 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {kams.find(k => k.id === selectedKAM)?.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-40 max-h-48 overflow-y-auto animate-scale-in">
              {kams.map((kam) => (
                <button
                  key={kam.id}
                  onClick={() => { setSelectedKAM(kam.id); setOpen(false); }}
                  className={`w-full px-3 py-2.5 text-[13px] text-left transition-colors
                    ${selectedKAM === kam.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}
                    first:rounded-t-xl last:rounded-b-xl
                  `}
                >
                  {kam.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}