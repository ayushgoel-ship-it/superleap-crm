/**
 * VISITS TAB CONTENT — Complete field-visit engine inside Activity screen.
 *
 * Sections (top → bottom):
 *   1. Start Visit Block (opens dealer selection sheet)
 *   2. Suggested Visit (single best-scored dealer)
 *   3. All Dealers (search + filters + list/map toggle)
 *   4. Past Visits (with time filter inside)
 *
 * Key features:
 *   - Dealer Selection Bottom Sheet (search by name/code, distance groups)
 *   - 200m geo-fence validation
 *   - Update dealer location flow
 *   - Mandatory feedback form (blocks next visit)
 *   - Visit lifecycle state machine
 *   - GPS accuracy awareness
 *   - Search & quick-filters on dealer list
 *   - Canvas-based proximity map with colored markers
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  MapPin, Navigation, AlertTriangle, Info, ChevronRight, Clock,
  User, MessageSquare, LocateFixed, Search, X,
  List, Map as MapIcon, Loader2,
} from 'lucide-react';
import { useActivity, type Visit } from '../../contexts/ActivityContext';
import { getAllDealers } from '../../data/selectors';
import { StatusChip } from '../premium/Chip';
import { toast } from 'sonner@2.0.3';

import {
  // Types
  type UserLocation, type DealerWithDistance, type ScoredDealer,
  type TimeFilter, type ListFilterKey, type ViewMode,
  type GeoFenceState, type UnifiedFeedbackData,
  // Constants
  FALLBACK_LOCATION, GEO_FENCE_RADIUS_M, MAX_GPS_ACCURACY_M,
  // Functions
  haversineKm, haversineM, formatDistance, timeAgo, formatDuration,
  dealerInitials, getDealerMarkerColor, scoreDealerForVisit,
  filterVisitsByTime, getVisitBlocker,
} from './visitHelpers';
import { TimePeriod } from '../../lib/domain/constants';

import {
  GeoFenceModal, UpdateLocationModal, UnifiedFeedbackModal,
  CustomDatePickerModal, VisitBlockerModal,
} from './VisitModals';

import { DealerMapView } from './DealerMapView';

import * as visitApi from '../../api/visit.api';
import { enqueue, getPendingCount } from '../../lib/feedbackRetryQueue';

// Persistent user ID for DB operations
const CURRENT_USER_ID = 'current-user';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface VisitsTabContentProps {
  onNavigateToVisitFeedback?: (visitId: string) => void;
  onNavigateToVisitCheckIn?: (dealerId: string, dealerName: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Start Visit Block ──

function StartVisitBlock({
  locationEnabled,
  locationStatus,
  hasActiveVisit,
  activeVisitDealer,
  gpsWaiting,
  onStartVisit,
  onEnableLocation,
  onEndVisit,
}: {
  locationEnabled: boolean;
  locationStatus: 'granted' | 'prompt' | 'denied';
  hasActiveVisit: boolean;
  activeVisitDealer?: string;
  gpsWaiting: boolean;
  onStartVisit: () => void;
  onEnableLocation: () => void;
  onEndVisit: () => void;
}) {
  const subtitle = hasActiveVisit
    ? `Active visit at ${activeVisitDealer || 'a dealer'}`
    : locationEnabled
      ? 'Begin an in-person dealer visit'
      : locationStatus === 'denied'
        ? 'Location disabled in browser settings'
        : 'Enable location to start visit';

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
          ${hasActiveVisit ? 'bg-emerald-50' : locationEnabled ? 'bg-indigo-50' : 'bg-slate-100'}
        `}>
          {hasActiveVisit ? (
            <Navigation className="w-5 h-5 text-emerald-600" />
          ) : gpsWaiting ? (
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5 text-indigo-600" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-slate-900">
            {hasActiveVisit ? 'Visit in Progress' : 'Start a Visit'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          {!locationEnabled && !hasActiveVisit && locationStatus !== 'denied' && (
            <button
              onClick={onEnableLocation}
              className="text-[11px] text-indigo-600 font-medium mt-1 hover:underline"
            >
              Enable location
            </button>
          )}
        </div>

        {/* CTA */}
        {hasActiveVisit ? (
          <button
            onClick={onEndVisit}
            className="px-4 py-2.5 bg-rose-600 text-white text-[12px] font-semibold rounded-xl
                       hover:bg-rose-700 active:scale-95 transition-all min-h-[38px] flex-shrink-0"
          >
            End Visit
          </button>
        ) : (
          <button
            onClick={onStartVisit}
            disabled={!locationEnabled}
            className={`px-4 py-2.5 text-[12px] font-semibold rounded-xl transition-all min-h-[38px] flex-shrink-0
              ${locationEnabled
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            Start Visit
          </button>
        )}
      </div>
    </div>
  );
}

// ── 2. Suggested Visit Card ──

function SuggestedVisitCard({
  dealer,
  onStartVisit,
}: {
  dealer: ScoredDealer;
  onStartVisit: (dealerId: string, dealerName: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[13px] font-semibold text-slate-700">Suggested Visit</h3>
        <button
          className="relative"
          onClick={() => setShowTooltip(!showTooltip)}
          onBlur={() => setTimeout(() => setShowTooltip(false), 150)}
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          {showTooltip && (
            <div className="absolute right-0 top-5 z-20 w-56 p-2.5 bg-slate-800 text-white text-[10px]
                            leading-relaxed rounded-lg shadow-lg animate-fade-in">
              Based on proximity, visit recency and dealer activity
            </div>
          )}
        </button>
      </div>

      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-[14px] font-semibold text-slate-900 truncate">{dealer.name}</h4>
            <span className="text-[11px] text-slate-500">{dealer.code}</span>
          </div>
          {dealer.distanceKm != null && (
            <span className="flex-shrink-0 px-2.5 py-1 bg-white border border-slate-200 rounded-full
                             text-[11px] font-semibold text-slate-700 tabular-nums">
              {formatDistance(dealer.distanceKm)}
            </span>
          )}
        </div>

        {dealer.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dealer.reasons.map((reason) => (
              <span
                key={reason}
                className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => onStartVisit(dealer.id, dealer.name)}
          className="w-full py-2.5 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl
                     hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          Start Visit
        </button>
      </div>
    </div>
  );
}

// ── 3. List/Map Toggle ──

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5 w-[180px]">
      <button
        onClick={() => onChange('list')}
        className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5
          ${value === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}
        `}
      >
        <List className="w-3.5 h-3.5" /> List
      </button>
      <button
        onClick={() => onChange('map')}
        className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5
          ${value === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}
        `}
      >
        <MapIcon className="w-3.5 h-3.5" /> Map
      </button>
    </div>
  );
}

// ── 4. Search + Quick Filters ──

function DealerSearchBar({
  query,
  onQueryChange,
  filters,
  onToggleFilter,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  filters: Set<ListFilterKey>;
  onToggleFilter: (f: ListFilterKey) => void;
}) {
  const filterDefs: { key: ListFilterKey; label: string }[] = [
    { key: 'nearby', label: 'Nearby (<2km)' },
    { key: 'feedback-pending', label: 'Feedback pending' },
    { key: 'no-visit-30d', label: 'No visit 30d' },
  ];

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search dealer name or code"
          className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl
                     text-[13px] text-slate-800 placeholder:text-slate-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Quick filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {filterDefs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onToggleFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all
              ${filters.has(key)
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 5. Dealer Row ──

function DealerRow({
  dealer,
  onStartVisit,
  onFillFeedback,
}: {
  dealer: DealerWithDistance;
  onStartVisit: (dealerId: string, dealerName: string) => void;
  onFillFeedback: (visitId: string) => void;
}) {
  const initials = dealerInitials(dealer.name);

  return (
    <div
      className={`bg-white rounded-2xl p-3.5 transition-all border
        ${dealer.feedbackPending
          ? 'border-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.1)]'
          : 'border-slate-100 shadow-sm'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Initials avatar */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${dealer.feedbackPending ? 'bg-amber-50' : 'bg-slate-100'}
        `}>
          <span className={`text-[12px] font-bold ${dealer.feedbackPending ? 'text-amber-600' : 'text-slate-500'}`}>
            {initials}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-slate-800 truncate">{dealer.name}</h4>
          <span className="text-[11px] text-slate-400">{dealer.code}</span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {dealer.lastVisitDaysAgo === 0
              ? 'Visited today'
              : dealer.lastVisitDaysAgo < 999
                ? `Last visit: ${dealer.lastVisitDaysAgo}d ago`
                : 'Never visited'}
          </p>
        </div>

        {/* Distance pill */}
        {dealer.distanceKm != null && (
          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold tabular-nums flex-shrink-0 border
            ${dealer.distanceKm <= 2
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-slate-50 border-slate-200 text-slate-600'
            }
          `}>
            {formatDistance(dealer.distanceKm)}
          </span>
        )}

        {/* Arrow */}
        <button
          onClick={() => onStartVisit(dealer.id, dealer.name)}
          className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0
                     hover:bg-indigo-100 active:scale-95 transition-all"
        >
          <ChevronRight className="w-4 h-4 text-indigo-600" />
        </button>
      </div>

      {/* Feedback pending banner */}
      {dealer.feedbackPending && dealer.lastVisitObj && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-medium text-amber-700">Feedback pending</span>
          </div>
          <button
            onClick={() => onFillFeedback(dealer.lastVisitObj!.id)}
            className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px]
                       font-semibold rounded-lg hover:bg-amber-100 active:scale-95 transition-all"
          >
            Fill Feedback
          </button>
        </div>
      )}
    </div>
  );
}

// ── 6. Visit History Card ──

function VisitHistoryCard({
  visit,
  onViewSummary,
  onFillFeedback,
}: {
  visit: Visit;
  onViewSummary: () => void;
  onFillFeedback: () => void;
}) {
  const hasFeedback = !!(visit.outcome || visit.notes);
  const statusLabel = hasFeedback ? 'Completed' : 'Feedback Pending';
  const statusVariant = hasFeedback ? 'success' : 'warning';
  const visitTime = visit.checkInTime || visit.createdAt || visit.scheduledTime;
  const duration =
    visit.checkInTime && visit.checkOutTime
      ? formatDuration(visit.checkInTime, visit.checkOutTime)
      : null;

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all
      ${!hasFeedback ? 'border-amber-200' : 'border-slate-100'}
    `}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-[13px] font-semibold text-slate-800">{visit.dealerName}</h4>
          <span className="text-[11px] text-slate-400">
            {visitTime ? timeAgo(visitTime) : '--'}
          </span>
        </div>
        <StatusChip label={statusLabel} variant={statusVariant} size="sm" />
      </div>

      <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-3">
        {duration && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{duration}
          </span>
        )}
        {visit.meetingPerson && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />{visit.meetingPerson}
          </span>
        )}
        {visit.purpose && visit.purpose.length > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {visit.purpose.length} topic{visit.purpose.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {hasFeedback ? (
        <button
          onClick={onViewSummary}
          className="w-full py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-medium
                     rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          View Summary<ChevronRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          onClick={onFillFeedback}
          className="w-full py-2 bg-indigo-600 text-white text-[12px] font-semibold rounded-xl
                     hover:bg-indigo-700 active:scale-[0.98] transition-all"
        >
          Fill Feedback
        </button>
      )}
    </div>
  );
}

// ── 7. GPS Accuracy Banner ──

function GpsAccuracyBanner({ accuracy }: { accuracy: number | null }) {
  if (accuracy == null || accuracy <= MAX_GPS_ACCURACY_M) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
      <Loader2 className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" />
      <span className="text-[11px] text-amber-700 font-medium">
        Waiting for accurate GPS signal ({Math.round(accuracy)}m accuracy, need {'<'}{MAX_GPS_ACCURACY_M}m)
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEALER SELECTION BOTTOM SHEET
// ═══════════════════════════════════════════════════════════════════════════

interface DealerGroup {
  label: string;
  tag: string;
  tagColor: string;
  dealers: DealerWithDistance[];
}

function DealerSelectionSheet({
  dealers,
  open,
  onClose,
  onSelect,
}: {
  dealers: DealerWithDistance[];
  open: boolean;
  onClose: () => void;
  onSelect: (dealerId: string, dealerName: string) => void;
}) {
  const [sheetQuery, setSheetQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when sheet opens
  useEffect(() => {
    if (open) {
      setSheetQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!sheetQuery.trim()) return dealers;
    const q = sheetQuery.toLowerCase();
    return dealers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q),
    );
  }, [dealers, sheetQuery]);

  // Group by distance
  const groups: DealerGroup[] = useMemo(() => {
    const inPerimeter: DealerWithDistance[] = [];
    const nearby: DealerWithDistance[] = [];
    const others: DealerWithDistance[] = [];

    for (const d of filtered) {
      if (d.distanceKm != null && d.distanceKm <= 0.2) {
        inPerimeter.push(d);
      } else if (d.distanceKm != null && d.distanceKm <= 2) {
        nearby.push(d);
      } else {
        others.push(d);
      }
    }

    // Sort each group by distance
    const byDist = (a: DealerWithDistance, b: DealerWithDistance) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      return a.name.localeCompare(b.name);
    };
    inPerimeter.sort(byDist);
    nearby.sort(byDist);
    others.sort(byDist);

    const result: DealerGroup[] = [];
    if (inPerimeter.length > 0)
      result.push({ label: 'In Perimeter', tag: 'In Perimeter', tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', dealers: inPerimeter });
    if (nearby.length > 0)
      result.push({ label: 'Nearby', tag: 'Nearby', tagColor: 'bg-blue-50 text-blue-700 border-blue-200', dealers: nearby });
    if (others.length > 0)
      result.push({ label: 'All Other Dealers', tag: '', tagColor: '', dealers: others });
    return result;
  }, [filtered]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up max-w-md mx-auto w-full">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Title */}
        <div className="px-4 pb-3 border-b border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900">Select Dealer to Visit</h3>
        </div>

        {/* Search input */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={sheetQuery}
              onChange={(e) => setSheetQuery(e.target.value)}
              placeholder="Search dealer name or dealer code"
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl
                         text-[13px] text-slate-800 placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
            />
            {sheetQuery && (
              <button
                onClick={() => setSheetQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable dealer list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
          {groups.length === 0 && (
            <div className="py-10 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-[12px] text-slate-400">No dealers match "{sheetQuery}"</p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.label}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-2 px-0.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </span>
                {group.tag && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${group.tagColor}`}>
                    {group.tag}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">({group.dealers.length})</span>
              </div>

              {/* Dealer rows */}
              <div className="space-y-1.5">
                {group.dealers.map((dealer) => {
                  const initials = dealerInitials(dealer.name);
                  const hasNoVisit30d = dealer.lastVisitDaysAgo >= 30;

                  return (
                    <button
                      key={dealer.id}
                      onClick={() => {
                        onClose();
                        onSelect(dealer.id, dealer.name);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                        active:scale-[0.98] hover:bg-slate-50
                        ${dealer.feedbackPending
                          ? 'bg-amber-50/50 border border-amber-200'
                          : 'bg-white border border-slate-100'
                        }
                      `}
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${dealer.feedbackPending ? 'bg-amber-100' : 'bg-slate-100'}
                      `}>
                        <span className={`text-[11px] font-bold ${dealer.feedbackPending ? 'text-amber-600' : 'text-slate-500'}`}>
                          {initials}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{dealer.name}</p>
                        <p className="text-[11px] text-slate-400">{dealer.code}</p>
                      </div>

                      {/* Status chips */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {/* Distance badge */}
                        {dealer.distanceKm != null && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums border
                            ${dealer.distanceKm <= 0.2
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : dealer.distanceKm <= 2
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }
                          `}>
                            {formatDistance(dealer.distanceKm)}
                          </span>
                        )}
                        {/* Feedback pending chip */}
                        {dealer.feedbackPending && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Feedback pending
                          </span>
                        )}
                        {/* No visit 30d chip */}
                        {!dealer.feedbackPending && hasNoVisit30d && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                            No visit 30d
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Time Filter Bar (used inside Past Visits section) ──

function TimeFilterBar({
  value,
  onChange,
  onCustom,
}: {
  value: TimeFilter;
  onChange: (v: TimeFilter) => void;
  onCustom: () => void;
}) {
  const options: { key: TimeFilter; label: string }[] = [
    { key: TimePeriod.TODAY, label: 'Today' },
    { key: TimePeriod.LAST_7D, label: '7 Days' },
    { key: TimePeriod.LAST_30D, label: '30 Days' },
    { key: TimePeriod.CUSTOM, label: 'Custom' },
  ];

  return (
    <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => {
            if (key === TimePeriod.CUSTOM) { onCustom(); return; }
            onChange(key);
          }}
          className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 min-h-[34px]
            ${value === key
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function VisitsTabContent({
  onNavigateToVisitFeedback,
  onNavigateToVisitCheckIn,
}: VisitsTabContentProps) {
  // ── Location state ──
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'granted' | 'prompt' | 'denied'>('prompt');
  const [locationRequested, setLocationRequested] = useState(false);
  const [gpsWaiting, setGpsWaiting] = useState(false);

  // ── UI state ──
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(TimePeriod.LAST_7D);
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [listFilters, setListFilters] = useState<Set<ListFilterKey>>(new Set());
  const [showDealerSheet, setShowDealerSheet] = useState(false);

  // ── Modal state ──
  const [geoFenceState, setGeoFenceState] = useState<GeoFenceState | null>(null);
  const [updateLocationTarget, setUpdateLocationTarget] = useState<{ dealerId: string; dealerName: string; dealerLat: number; dealerLng: number } | null>(null);
  const [feedbackModalVisit, setFeedbackModalVisit] = useState<{ visitId: string; dealerName: string } | null>(null);
  const [blockerModal, setBlockerModal] = useState<{ reason: string; hasNoFeedback: boolean; blockingVisit: Visit | null } | null>(null);

  // ── Context ──
  const { visits, addVisit, updateVisit } = useActivity();
  const allDealers = useMemo(() => getAllDealers(), []);

  // ── Hydrate from DB on mount ──
  const [dbHydrated, setDbHydrated] = useState(false);
  useEffect(() => {
    if (dbHydrated) return;
    setDbHydrated(true);

    // 1. Check DB for blockers (ACTIVE / COMPLETED_NO_FEEDBACK — visits + calls)
    visitApi.checkBlocker(CURRENT_USER_ID).then((blocker) => {
      if (blocker.blocked && blocker.blockingVisit) {
        const bv = blocker.blockingVisit;
        // Merge DB visit into local state if not already there
        const exists = visits.find((v) => v.id === bv.id);
        if (!exists) {
          addVisit({
            id: bv.id,
            dealerId: bv.dealerId,
            dealerName: bv.dealerName,
            dealerCode: bv.dealerCode,
            dealerCity: bv.dealerCity,
            kamName: bv.kamName,
            status: bv.status === 'ACTIVE' ? 'in-progress' : 'completed',
            checkInTime: bv.startAt,
            checkOutTime: bv.endAt || undefined,
            createdAt: bv.createdAt,
            lat: bv.lat ?? undefined,
            lng: bv.lng ?? undefined,
          });
          console.log(`[VisitsTab] Hydrated blocking visit from DB: ${bv.id} (${bv.status})`);
        }
      } else if (blocker.blocked && blocker.blockerType === 'call' && blocker.blockingCall) {
        // A call has pending feedback — show blocker banner (non-blocking for visits,
        // but user should be aware)
        console.log(`[VisitsTab] Call feedback pending for ${blocker.blockingCall.dealerName} (${blocker.blockingCall.id})`);
      }
    }).catch((err) => {
      console.error('[VisitsTab] DB blocker check failed (using local state):', err);
    });

    // 2. Hydrate recent visit history from DB
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    visitApi.listVisits(CURRENT_USER_ID, thirtyDaysAgo).then((dbVisits) => {
      for (const dbv of dbVisits) {
        const exists = visits.find((v) => v.id === dbv.id);
        if (!exists && dbv.status === 'CLOSED') {
          const fb = dbv.feedback;
          addVisit({
            id: dbv.id,
            dealerId: dbv.dealerId,
            dealerName: dbv.dealerName,
            dealerCode: dbv.dealerCode,
            dealerCity: dbv.dealerCity,
            kamName: dbv.kamName,
            status: 'completed',
            checkInTime: dbv.startAt,
            checkOutTime: dbv.endAt || undefined,
            createdAt: dbv.createdAt,
            lat: dbv.lat ?? undefined,
            lng: dbv.lng ?? undefined,
            meetingPerson: fb?.meetingPersonRole,
            outcome: fb ? `Rating: ${fb.rating}/5 | Met: ${fb.meetingPersonRole}` : undefined,
            notes: fb?.note || undefined,
          });
        }
      }
      if (dbVisits.length > 0) {
        console.log(`[VisitsTab] Hydrated ${dbVisits.length} visits from DB`);
      }
    }).catch((err) => {
      console.error('[VisitsTab] DB visit hydration failed:', err);
    });
  }, []);

  // ── Geolocation ──
  const requestLocation = useCallback(() => {
    const useFallback = () => {
      // Expected in preview/iframe environments where permissions policy blocks geolocation
      setUserLocation({ ...FALLBACK_LOCATION, accuracy: 10 });
      setLocationEnabled(true);
      setLocationStatus('granted');
      setGpsWaiting(false);
    };

    // Skip geolocation entirely when blocked by permissions policy (iframe/preview)
    if (!navigator.geolocation || !window.isSecureContext) {
      useFallback();
      return;
    }

    // Check Permissions API first to avoid triggering the policy error
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setLocationStatus('denied');
          useFallback();
          return;
        }
        doGeoRequest();
      }).catch(() => {
        // Permissions API not available, try geolocation directly
        doGeoRequest();
      });
    } else {
      doGeoRequest();
    }

    function doGeoRequest() {
      setLocationRequested(true);
      setGpsWaiting(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setLocationEnabled(true);
          setLocationStatus('granted');
          setGpsWaiting(false);
        },
        () => {
          // Silently fall back — permissions policy block is expected in preview
          useFallback();
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, []);

  // Auto-request on mount
  useEffect(() => {
    if (!locationRequested) requestLocation();
  }, [locationRequested, requestLocation]);

  // ── Active visit detection ──
  const activeVisit = useMemo(
    () => visits.find((v) => v.status === 'in-progress'),
    [visits],
  );
  const activeVisitDealerIds = useMemo(
    () => new Set(visits.filter((v) => v.status === 'in-progress').map((v) => v.dealerId)),
    [visits],
  );

  // ── Visit lifecycle blocker ──
  const visitBlocker = useMemo(() => getVisitBlocker(visits), [visits]);

  // ── Completed visits (history) — time-filtered ──
  const completedVisits = useMemo(() => {
    const completed = visits
      .filter((v) => v.status === 'completed')
      .sort((a, b) => {
        const ta = a.checkInTime || a.createdAt || '';
        const tb = b.checkInTime || b.createdAt || '';
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
    return filterVisitsByTime(completed, timeFilter, customRange);
  }, [visits, timeFilter, customRange]);

  // ── Dealers with distance + metadata ──
  const enrichedDealers: DealerWithDistance[] = useMemo(() => {
    return allDealers.map((d) => {
      const distanceKm =
        userLocation && d.latitude && d.longitude
          ? haversineKm(userLocation.lat, userLocation.lng, d.latitude, d.longitude)
          : null;
      const distanceM = distanceKm != null ? distanceKm * 1000 : null;

      // Find last completed visit for this dealer
      const dealerVisits = visits
        .filter((v) => v.dealerId === d.id && v.status === 'completed')
        .sort((a, b) => {
          const ta = a.checkInTime || a.createdAt || '';
          const tb = b.checkInTime || b.createdAt || '';
          return new Date(tb).getTime() - new Date(ta).getTime();
        });
      const lastVisit = dealerVisits[0] || null;
      const feedbackPending = lastVisit ? !(lastVisit.feedbackSubmitted || lastVisit.outcome || lastVisit.notes) : false;

      const markerColor = getDealerMarkerColor({
        feedbackPending,
        lastVisitDaysAgo: d.lastVisitDaysAgo,
        distanceKm,
      });

      return { ...d, distanceKm, distanceM, feedbackPending, lastVisitObj: lastVisit, markerColor };
    });
  }, [allDealers, userLocation, visits]);

  // ── Suggested dealer ──
  const suggestedDealer: ScoredDealer | null = useMemo(() => {
    const scored = enrichedDealers
      .map((d) => scoreDealerForVisit(d, activeVisitDealerIds))
      .filter((d) => d.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        return b.lastVisitDaysAgo - a.lastVisitDaysAgo;
      });
    return scored[0] || null;
  }, [enrichedDealers, activeVisitDealerIds]);

  // ── Filtered + sorted dealer list ──
  const filteredDealers = useMemo(() => {
    let dealers = [...enrichedDealers].filter(
      (d) => d.status?.toLowerCase() === 'active',
    );

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      dealers = dealers.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q),
      );
    }

    // Quick filters
    if (listFilters.has('nearby')) {
      dealers = dealers.filter((d) => d.distanceKm != null && d.distanceKm <= 2);
    }
    if (listFilters.has('feedback-pending')) {
      dealers = dealers.filter((d) => d.feedbackPending);
    }
    if (listFilters.has('no-visit-30d')) {
      dealers = dealers.filter((d) => d.lastVisitDaysAgo >= 30);
    }

    // Sort
    dealers.sort((a, b) => {
      if (a.feedbackPending !== b.feedbackPending) return a.feedbackPending ? -1 : 1;
      if (a.distanceKm != null && b.distanceKm != null) {
        if (Math.abs(a.distanceKm - b.distanceKm) > 0.5) return a.distanceKm - b.distanceKm;
      }
      if ((a.lastVisitDaysAgo >= 30) !== (b.lastVisitDaysAgo >= 30)) {
        return a.lastVisitDaysAgo >= 30 ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return dealers;
  }, [enrichedDealers, searchQuery, listFilters]);

  // ── Toggle filter ──
  const handleToggleFilter = useCallback((key: ListFilterKey) => {
    setListFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ── Visit start with 200m geo-fence ──
  const attemptStartVisit = useCallback(
    (dealerId: string, dealerName: string) => {
      // 1. Check lifecycle blocker
      if (visitBlocker.blocked) {
        const bv = visitBlocker.blockingVisit;
        const hasNoFeedback = bv ? bv.status === 'completed' && !bv.outcome && !bv.notes : false;
        setBlockerModal({
          reason: visitBlocker.reason!,
          hasNoFeedback,
          blockingVisit: bv,
        });
        return;
      }

      // 2. Find dealer location
      const dealer = enrichedDealers.find((d) => d.id === dealerId);
      if (!dealer) return;

      // 3. Check distance (200m geo-fence)
      if (userLocation && dealer.latitude && dealer.longitude) {
        const distM = haversineM(userLocation.lat, userLocation.lng, dealer.latitude, dealer.longitude);
        if (distM > GEO_FENCE_RADIUS_M) {
          setGeoFenceState({
            visible: true,
            dealerId,
            dealerName,
            distanceM: distM,
            dealerLat: dealer.latitude,
            dealerLng: dealer.longitude,
          });
          return;
        }
      }

      // 4. All clear — start visit
      executeStartVisit(dealerId, dealerName);
    },
    [visitBlocker, enrichedDealers, userLocation],
  );

  const executeStartVisit = useCallback(
    (dealerId: string, dealerName: string) => {
      if (onNavigateToVisitCheckIn) {
        onNavigateToVisitCheckIn(dealerId, dealerName);
        return;
      }

      const dealer = allDealers.find((d) => d.id === dealerId);
      if (!dealer) return;

      const enriched = enrichedDealers.find((d) => d.id === dealerId);
      const distanceAtStart = enriched?.distanceM ?? null;

      // 1. Add to local ActivityContext for immediate UI update
      const newVisit = addVisit({
        dealerId: dealer.id,
        dealerName: dealer.name,
        dealerCode: dealer.code,
        dealerCity: dealer.city,
        kamName: 'Current User',
        status: 'in-progress',
        checkInTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });

      // 2. Persist to DB (fire-and-forget with error logging)
      // Pass the client-generated ID so server uses the same ID
      visitApi.startVisit({
        id: newVisit.id,
        dealerId: dealer.id,
        dealerName: dealer.name,
        dealerCode: dealer.code,
        dealerCity: dealer.city,
        userId: CURRENT_USER_ID,
        kamName: 'Current User',
        lat: userLocation?.lat ?? null,
        lng: userLocation?.lng ?? null,
        distanceAtStart,
        gpsAccuracyAtStart: userLocation?.accuracy ?? null,
        geoVerified: true,
      }).catch((err) => {
        console.error('[VisitsTab] Failed to persist visit start to DB:', err);
      });

      toast.success('Visit started', { description: `Checked in at ${dealer.name}` });
    },
    [allDealers, enrichedDealers, addVisit, userLocation, onNavigateToVisitCheckIn],
  );

  // ── End visit → open mandatory feedback ──
  const handleEndVisit = useCallback(() => {
    if (!activeVisit) return;

    // 1. Update local state
    updateVisit(activeVisit.id, {
      status: 'completed',
      checkOutTime: new Date().toISOString(),
    });

    // 2. Persist end to DB
    visitApi.endVisit(activeVisit.id).catch((err) => {
      console.error('[VisitsTab] Failed to persist visit end to DB:', err);
    });

    // Open mandatory feedback
    setFeedbackModalVisit({
      visitId: activeVisit.id,
      dealerName: activeVisit.dealerName,
    });
    toast.success('Visit ended', { description: `Checked out from ${activeVisit.dealerName}` });
  }, [activeVisit, updateVisit]);

  // ── Submit feedback ──
  const handleSubmitFeedback = useCallback(
    async (data: UnifiedFeedbackData) => {
      if (!feedbackModalVisit) return;

      // Capture visit details before clearing modal state
      const visitId = feedbackModalVisit.visitId;
      const dealerName = feedbackModalVisit.dealerName;

      // Build backward-compatible outcome summary from unified data
      const outcomeDetails: string[] = [`Rating: ${data.rating}/5`];
      if (data.meetingPersonRole) outcomeDetails.push(`Met: ${data.meetingPersonRole}${data.meetingPersonOtherText ? ` (${data.meetingPersonOtherText})` : ''}`);
      if (data.leadShared && data.leadStatus) outcomeDetails.push(`Leads: ${data.leadStatus}`);
      if (data.dcfDiscussed && data.dcfStatus) outcomeDetails.push(`DCF: ${data.dcfStatus}`);

      // 1. Update local state — set feedbackSubmitted flag so blocker clears immediately
      updateVisit(visitId, {
        meetingPerson: data.meetingPersonRole === 'Other' ? (data.meetingPersonOtherText || 'Other') : data.meetingPersonRole,
        outcome: outcomeDetails.join(' | '),
        notes: data.note || 'Feedback submitted',
        purpose: ['Visit Feedback'],
        feedbackSubmitted: true,
      });

      setFeedbackModalVisit(null);
      toast.success('Feedback submitted');

      // 2. Upload photo to Supabase Storage if present (base64 -> real URL)
      try {
        if (data.photoUrl && data.photoUrl.startsWith('data:')) {
          const mimeMatch = data.photoUrl.match(/^data:(image\/\w+);base64,/);
          const mimeType = mimeMatch?.[1] || 'image/jpeg';
          await visitApi.uploadVisitPhoto(
            visitId,
            data.photoUrl,
            data.photoType || 'Shop Front',
            mimeType,
          );
          console.log(`[VisitsTab] Photo uploaded for visit ${visitId}`);
        }

        // 3. Submit unified feedback to DB (without base64 — server has the photo path)
        await visitApi.submitVisitFeedback(visitId, {
          interactionType: data.interactionType,
          meetingPersonRole: data.meetingPersonRole,
          meetingPersonOtherText: data.meetingPersonOtherText,
          leadShared: data.leadShared,
          leadStatus: data.leadStatus,
          sellerLeadCount: data.sellerLeadCount,
          buyerLeadCount: data.buyerLeadCount,
          inspectionExpected: data.inspectionExpected,
          dcfDiscussed: data.dcfDiscussed,
          dcfStatus: data.dcfStatus,
          dcfCreditRange: data.dcfCreditRange,
          dcfDocsCollected: data.dcfDocsCollected,
          note: data.note,
          rating: data.rating,
        });
        console.log(`[VisitsTab] Unified feedback persisted for visit ${visitId}`);
      } catch (err: any) {
        console.error(`[VisitsTab] Failed to persist visit feedback to DB for ${visitId}:`, err);
        // Queue for retry
        if (data.photoUrl && data.photoUrl.startsWith('data:')) {
          enqueue('visit-photo', visitId, {
            base64Data: data.photoUrl,
            photoType: data.photoType || 'Shop Front',
            mimeType: 'image/jpeg',
          });
        }
        enqueue('visit-feedback', visitId, {
          interactionType: data.interactionType,
          meetingPersonRole: data.meetingPersonRole,
          meetingPersonOtherText: data.meetingPersonOtherText,
          leadShared: data.leadShared,
          leadStatus: data.leadStatus,
          sellerLeadCount: data.sellerLeadCount,
          buyerLeadCount: data.buyerLeadCount,
          inspectionExpected: data.inspectionExpected,
          dcfDiscussed: data.dcfDiscussed,
          dcfStatus: data.dcfStatus,
          dcfCreditRange: data.dcfCreditRange,
          dcfDocsCollected: data.dcfDocsCollected,
          note: data.note,
          rating: data.rating,
        });
        toast.info('Feedback queued — will retry when online');
      }
    },
    [feedbackModalVisit, updateVisit],
  );

  // ── Fill feedback for a specific visit (from history/dealer card) ──
  const handleFillFeedback = useCallback(
    (visitId: string) => {
      const visit = visits.find((v) => v.id === visitId);
      if (!visit) return;
      if (onNavigateToVisitFeedback) {
        onNavigateToVisitFeedback(visitId);
      } else {
        setFeedbackModalVisit({ visitId, dealerName: visit.dealerName });
      }
    },
    [visits, onNavigateToVisitFeedback],
  );

  const handleViewSummary = useCallback(
    (visitId: string) => {
      if (onNavigateToVisitFeedback) onNavigateToVisitFeedback(visitId);
      else toast.info('Visit summary view');
    },
    [onNavigateToVisitFeedback],
  );

  // ── Geo-fence modal actions ──
  const handleNavigateViaMaps = useCallback(() => {
    if (!geoFenceState) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${geoFenceState.dealerLat},${geoFenceState.dealerLng}`;
    window.open(url, '_blank');
    setGeoFenceState(null);
  }, [geoFenceState]);

  const handleOpenUpdateLocation = useCallback(() => {
    if (!geoFenceState) return;
    setUpdateLocationTarget({
      dealerId: geoFenceState.dealerId,
      dealerName: geoFenceState.dealerName,
      dealerLat: geoFenceState.dealerLat,
      dealerLng: geoFenceState.dealerLng,
    });
    setGeoFenceState(null);
  }, [geoFenceState]);

  const handleConfirmUpdateLocation = useCallback(
    (reason: string, reasonNote: string | null) => {
      if (!updateLocationTarget || !userLocation) return;

      // Persist audit trail to DB (fire-and-forget with error logging)
      visitApi.updateDealerLocation({
        dealerId: updateLocationTarget.dealerId,
        dealerName: updateLocationTarget.dealerName,
        oldLat: updateLocationTarget.dealerLat,
        oldLng: updateLocationTarget.dealerLng,
        newLat: userLocation.lat,
        newLng: userLocation.lng,
        userId: CURRENT_USER_ID,
        userName: 'Current User',
        reason: reason as visitApi.LocationUpdateReason,
        reasonNote,
        gpsAccuracy: userLocation.accuracy ?? null,
      }).catch((err) => {
        console.error('[VisitsTab] Failed to persist dealer location audit:', err);
      });

      toast.success('Dealer location updated', {
        description: `${updateLocationTarget.dealerName}'s location updated (${reason})`,
      });

      const targetDealerId = updateLocationTarget.dealerId;
      const targetDealerName = updateLocationTarget.dealerName;
      setUpdateLocationTarget(null);
      // Now re-attempt the visit start (the dealer is now "at" user's location)
      executeStartVisit(targetDealerId, targetDealerName);
    },
    [updateLocationTarget, userLocation, executeStartVisit],
  );

  // ── Custom date picker ──
  const handleApplyCustomRange = useCallback((range: { start: string; end: string }) => {
    setCustomRange(range);
    setTimeFilter(TimePeriod.CUSTOM);
    setShowDatePicker(false);
  }, []);

  // ── Blocker modal actions ──
  const handleBlockerFillFeedback = useCallback(() => {
    if (!blockerModal?.blockingVisit) return;
    setBlockerModal(null);
    handleFillFeedback(blockerModal.blockingVisit.id);
  }, [blockerModal, handleFillFeedback]);

  const handleBlockerEndVisit = useCallback(() => {
    setBlockerModal(null);
    handleEndVisit();
  }, [handleEndVisit]);

  // ── Pending feedback count ──
  const pendingFeedbackCount = useMemo(
    () => visits.filter((v) => v.status === 'completed' && !v.outcome && !v.notes).length,
    [visits],
  );

  // ═══════════════════════════════════
  // RENDER
  // ═══════════════════════════════════

  return (
    <div className="px-4 pt-3 pb-6 space-y-4 animate-fade-in">

      {/* ═══ GPS Accuracy Banner ═══ */}
      <GpsAccuracyBanner accuracy={userLocation?.accuracy ?? null} />

      {/* ═══ Pending Feedback Warning ═══ */}
      {pendingFeedbackCount > 0 && !activeVisit && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-[11px] text-amber-800 font-medium flex-1">
            {pendingFeedbackCount} visit{pendingFeedbackCount > 1 ? 's' : ''} need feedback.
            Complete feedback before starting a new visit.
          </p>
        </div>
      )}

      {/* ═══ SECTION 1: Start Visit Block ═══ */}
      <div>
        <StartVisitBlock
          locationEnabled={locationEnabled}
          locationStatus={locationStatus}
          hasActiveVisit={!!activeVisit}
          activeVisitDealer={activeVisit?.dealerName}
          gpsWaiting={gpsWaiting}
          onStartVisit={() => setShowDealerSheet(true)}
          onEnableLocation={requestLocation}
          onEndVisit={handleEndVisit}
        />
        {!activeVisit && locationEnabled && (
          <p className="text-[11px] text-slate-400 mt-1.5 px-1">
            Search dealer code or select nearby dealer
          </p>
        )}
      </div>

      {/* ═══ SECTION 2: Suggested Visit ═══ */}
      {suggestedDealer && !activeVisit ? (
        <SuggestedVisitCard dealer={suggestedDealer} onStartVisit={attemptStartVisit} />
      ) : !activeVisit ? (
        <div className="px-1">
          <h3 className="text-[13px] font-semibold text-slate-700 mb-2">Suggested Visit</h3>
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <LocateFixed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[12px] text-slate-400">No suggested visits right now</p>
          </div>
        </div>
      ) : null}

      {/* ═══ SECTION 3: All Dealers (search + filters + list/map toggle) ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-slate-700">
            All Dealers
            <span className="text-slate-400 font-normal ml-1.5">({filteredDealers.length})</span>
          </h3>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        {/* Search + List OR Map */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            <DealerSearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              filters={listFilters}
              onToggleFilter={handleToggleFilter}
            />

            {filteredDealers.length > 0 ? (
              <div className="space-y-2">
                {filteredDealers.map((dealer) => (
                  <DealerRow
                    key={dealer.id}
                    dealer={dealer}
                    onStartVisit={attemptStartVisit}
                    onFillFeedback={handleFillFeedback}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 text-center">
                {searchQuery || listFilters.size > 0 ? (
                  <>
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400">No dealers match your filters</p>
                    <button
                      onClick={() => { setSearchQuery(''); setListFilters(new Set()); }}
                      className="text-[11px] text-indigo-600 font-medium mt-2 hover:underline"
                    >
                      Clear filters
                    </button>
                  </>
                ) : (
                  <>
                    <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[12px] text-slate-400">No dealers assigned</p>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <DealerMapView
            dealers={filteredDealers}
            userLocation={userLocation}
            onStartVisit={attemptStartVisit}
            onFillFeedback={handleFillFeedback}
          />
        )}
      </div>

      {/* ═══ SECTION 4: Past Visits (with time filter inside) ═══ */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-[13px] font-semibold text-slate-700">Past Visits</h3>
          <span className="text-[11px] text-slate-400">
            {completedVisits.length} visit{completedVisits.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Time filter — scoped to Past Visits only */}
        <div className="mb-3">
          <TimeFilterBar
            value={timeFilter}
            onChange={setTimeFilter}
            onCustom={() => setShowDatePicker(true)}
          />
        </div>

        {completedVisits.length > 0 ? (
          <div className="space-y-2">
            {completedVisits.map((visit) => (
              <VisitHistoryCard
                key={visit.id}
                visit={visit}
                onViewSummary={() => handleViewSummary(visit.id)}
                onFillFeedback={() => handleFillFeedback(visit.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[12px] text-slate-400">
              No visits in this time period
            </p>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Dealer Selection Bottom Sheet */}
      <DealerSelectionSheet
        dealers={enrichedDealers.filter((d) => d.status?.toLowerCase() === 'active')}
        open={showDealerSheet}
        onClose={() => setShowDealerSheet(false)}
        onSelect={attemptStartVisit}
      />

      {geoFenceState && (
        <GeoFenceModal
          state={geoFenceState}
          onClose={() => setGeoFenceState(null)}
          onNavigateViaMaps={handleNavigateViaMaps}
          onUpdateLocation={handleOpenUpdateLocation}
        />
      )}

      {updateLocationTarget && (
        <UpdateLocationModal
          dealerName={updateLocationTarget.dealerName}
          userLocation={userLocation}
          onConfirm={handleConfirmUpdateLocation}
          onClose={() => setUpdateLocationTarget(null)}
        />
      )}

      {feedbackModalVisit && (
        <UnifiedFeedbackModal
          interactionType="VISIT"
          dealerName={feedbackModalVisit.dealerName}
          visitId={feedbackModalVisit.visitId}
          onSubmit={handleSubmitFeedback}
        />
      )}

      {showDatePicker && (
        <CustomDatePickerModal
          initialRange={customRange}
          onApply={handleApplyCustomRange}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {blockerModal && (
        <VisitBlockerModal
          reason={blockerModal.reason}
          hasNoFeedback={blockerModal.hasNoFeedback}
          onClose={() => setBlockerModal(null)}
          onFillFeedback={blockerModal.hasNoFeedback ? handleBlockerFillFeedback : undefined}
          onEndVisit={!blockerModal.hasNoFeedback && activeVisit ? handleBlockerEndVisit : undefined}
        />
      )}
    </div>
  );
}