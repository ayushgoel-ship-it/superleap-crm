/**
 * ACTIVITY CARD — Unified premium card for Calls and Visits
 *
 * ┌─────────────────────────────────────────────────────┐
 * │  DESIGN NOTE                                        │
 * │                                                     │
 * │  Why a unified card system?                         │
 * │  Calls and Visits are both dealer interactions.     │
 * │  Showing them in one chronological feed helps KAMs  │
 * │  see the full picture of their day / week, instead  │
 * │  of context-switching between two separate lists.   │
 * │                                                     │
 * │  Feedback closure drives productivity:              │
 * │  Pending feedback cards get a subtle indigo left    │
 * │  border and the "Add Feedback" CTA is prominent.   │
 * │  This nudges KAMs toward completing the loop.       │
 * └─────────────────────────────────────────────────────┘
 */

import {
  Phone, PhoneOff, PhoneMissed, MapPin, Clock, Mic, MessageSquare,
  ChevronRight, CheckCircle2, AlertCircle, Navigation,
} from 'lucide-react';
import { StatusChip } from '../premium/Chip';
import type { CallAttempt, Visit } from '../../contexts/ActivityContext';

// ── Helpers ──

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

function formatDuration(secs: number | undefined): string {
  if (!secs) return '--';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function callStatusVariant(status: string, connected: boolean): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (connected) return 'success';
  if (status === 'no-answer') return 'danger';
  if (status === 'busy') return 'warning';
  if (status === 'pending-feedback') return 'info';
  return 'neutral';
}

function callStatusLabel(status: string, connected: boolean): string {
  if (connected) return 'Connected';
  if (status === 'no-answer') return 'Missed';
  if (status === 'busy') return 'Busy';
  if (status === 'pending-feedback') return 'Pending';
  return status;
}

function visitStatusVariant(status: string): 'success' | 'warning' | 'info' | 'neutral' {
  switch (status) {
    case 'completed': return 'success';
    case 'in-progress': return 'info';
    case 'incomplete': return 'warning';
    default: return 'neutral';
  }
}

function visitStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in-progress': return 'Checked In';
    case 'incomplete': return 'Incomplete';
    case 'not-started': return 'Planned';
    default: return status;
  }
}

// ── Call Card ──

interface CallCardProps {
  call: CallAttempt;
  onAddFeedback?: () => void;
  onViewDetails?: () => void;
}

export function CallActivityCard({ call, onAddFeedback, onViewDetails }: CallCardProps) {
  const isPendingFeedback = call.productiveStatus === 'pending' || call.status === 'pending-feedback';
  const hasRecording = call.duration && call.duration > 0;
  const CallIcon = call.connected ? Phone : call.status === 'busy' ? PhoneOff : PhoneMissed;

  return (
    <div className={`card-premium overflow-hidden active:scale-[0.995] transition-all duration-200
      ${isPendingFeedback ? 'border-l-[3px] border-l-indigo-400' : ''}
    `}>
      <div className="p-4">
        {/* Row 1: Icon + Dealer + Time */}
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
            ${call.connected ? 'bg-emerald-50' : 'bg-slate-100'}
          `}>
            <CallIcon className={`w-4 h-4 ${call.connected ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-slate-800 truncate">{call.dealerName}</h3>
              <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
            </div>
            <span className="text-[11px] text-slate-400">{call.dealerCode}</span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0 tabular-nums">
            {timeAgo(call.timestamp)}
          </span>
        </div>

        {/* Row 2: Chips */}
        <div className="flex items-center gap-2 mt-2.5 ml-12 flex-wrap">
          <StatusChip
            label={callStatusLabel(call.status, call.connected)}
            variant={callStatusVariant(call.status, call.connected)}
            dot
            size="sm"
          />
          {call.duration !== undefined && call.duration > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Clock className="w-3 h-3" />
              {formatDuration(call.duration)}
            </span>
          )}
          {hasRecording && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-100">
              <Mic className="w-2.5 h-2.5" />
              Rec
            </span>
          )}
        </div>

        {/* Row 3: Outcome */}
        {call.outcome && (
          <div className="mt-2 ml-12 text-[12px] text-slate-500 leading-relaxed line-clamp-2">
            {call.outcome}
          </div>
        )}
      </div>

      {/* Footer: Feedback CTA */}
      <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isPendingFeedback ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[11px] font-semibold text-indigo-600">Feedback pending</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-medium text-slate-400">
                {call.productiveStatus === 'productive' ? 'Productive' : 'Non-productive'}
              </span>
            </>
          )}
        </div>

        {isPendingFeedback && onAddFeedback ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAddFeedback(); }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg
                       hover:bg-indigo-700 active:scale-95 transition-all min-h-[32px]"
          >
            Add Feedback
          </button>
        ) : onViewDetails ? (
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium rounded-lg
                       hover:bg-slate-50 active:scale-95 transition-all min-h-[32px]"
          >
            View Details
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Visit Card ──

interface VisitCardProps {
  visit: Visit;
  onCheckIn?: () => void;
  onViewSummary?: () => void;
}

export function VisitActivityCard({ visit, onCheckIn, onViewSummary }: VisitCardProps) {
  const isPlanned = visit.status === 'not-started';
  const isInProgress = visit.status === 'in-progress';
  const isCompleted = visit.status === 'completed';

  const visitTime = visit.checkInTime || visit.scheduledTime || visit.createdAt;

  return (
    <div className={`card-premium overflow-hidden active:scale-[0.995] transition-all duration-200
      ${isInProgress ? 'border-l-[3px] border-l-emerald-400' : ''}
      ${isPlanned ? 'border-l-[3px] border-l-sky-300' : ''}
    `}>
      <div className="p-4">
        {/* Row 1: Icon + Dealer + Time */}
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
            ${isCompleted ? 'bg-emerald-50' : isInProgress ? 'bg-sky-50' : 'bg-slate-100'}
          `}>
            {isInProgress ? (
              <Navigation className={`w-4 h-4 text-sky-600`} />
            ) : (
              <MapPin className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-slate-800 truncate">{visit.dealerName}</h3>
              <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
            </div>
            <span className="text-[11px] text-slate-400">{visit.dealerCode}</span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0 tabular-nums">
            {visitTime ? timeAgo(visitTime) : '--'}
          </span>
        </div>

        {/* Row 2: Chips */}
        <div className="flex items-center gap-2 mt-2.5 ml-12 flex-wrap">
          <StatusChip
            label={visitStatusLabel(visit.status)}
            variant={visitStatusVariant(visit.status)}
            dot
            size="sm"
          />
          {visit.purpose && visit.purpose.length > 0 && (
            <span className="text-[11px] text-slate-500 font-medium truncate">
              {visit.purpose[0]}
            </span>
          )}
        </div>

        {/* Row 3: Outcome / meeting person */}
        {(visit.outcome || visit.meetingPerson) && (
          <div className="mt-2 ml-12 space-y-0.5">
            {visit.meetingPerson && (
              <div className="text-[11px] text-slate-400">
                Met: <span className="text-slate-500 font-medium">{visit.meetingPerson}</span>
              </div>
            )}
            {visit.outcome && (
              <div className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">
                {visit.outcome}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {visit.checkInTime && visit.checkOutTime ? (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(Math.floor((new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime()) / 1000))} visit
            </span>
          ) : isInProgress ? (
            <span className="text-[11px] text-sky-600 font-medium flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              In progress
            </span>
          ) : isPlanned ? (
            <span className="text-[11px] text-slate-400">Planned</span>
          ) : null}
        </div>

        {isPlanned && onCheckIn ? (
          <button
            onClick={(e) => { e.stopPropagation(); onCheckIn(); }}
            className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-lg
                       hover:bg-indigo-700 active:scale-95 transition-all min-h-[32px]"
          >
            Check In
          </button>
        ) : isCompleted && onViewSummary ? (
          <button
            onClick={(e) => { e.stopPropagation(); onViewSummary(); }}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium rounded-lg
                       hover:bg-slate-50 active:scale-95 transition-all min-h-[32px]"
          >
            View Summary
          </button>
        ) : null}
      </div>
    </div>
  );
}
