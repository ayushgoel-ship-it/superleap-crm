/**
 * ACTIVITY CARD — Compact unified card for Calls and Visits.
 *
 * Designed to be dense: dealer code + name on one line, status chip + duration
 * inline on the next, pending feedback strongly highlighted with an inline CTA
 * (no need to click "View Details" to add feedback).
 */

import {
  Phone, PhoneOff, PhoneMissed, MapPin, Clock, Mic,
  CheckCircle2, AlertCircle, Navigation,
} from 'lucide-react';
import { StatusChip } from '../premium/Chip';
import type { CallAttempt, Visit } from '../../contexts/ActivityContext';

// ── Helpers ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDuration(secs: number | undefined): string {
  if (!secs) return '--';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function dealerLabel(code: string | undefined, name: string | undefined, id: string | undefined): string {
  const cleanName = name && name.trim() && name.trim() !== 'Dealer' ? name.trim() : '';
  const cleanCode = code && String(code).trim() ? String(code).trim() : '';
  if (cleanCode && cleanName) return `${cleanCode} · ${cleanName}`;
  if (cleanName) return cleanName;
  if (cleanCode) return `Dealer ${cleanCode}`;
  return `Dealer ${(id || '').slice(0, 8)}`;
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

export function isCallPendingFeedback(call: CallAttempt): boolean {
  return call.productiveStatus === 'pending' || call.status === 'pending-feedback';
}

export function isVisitPendingFeedback(visit: Visit): boolean {
  return visit.status === 'completed' && !visit.feedbackSubmitted && !visit.outcome;
}

// ── Call Card ──

interface CallCardProps {
  call: CallAttempt;
  onAddFeedback?: () => void;
  onViewDetails?: () => void;
}

export function CallActivityCard({ call, onAddFeedback, onViewDetails }: CallCardProps) {
  const pending = isCallPendingFeedback(call);
  const hasRecording = !!call.duration && call.duration > 0;
  const CallIcon = call.connected ? Phone : call.status === 'busy' ? PhoneOff : PhoneMissed;
  const label = dealerLabel(call.dealerCode, call.dealerName, call.dealerId);

  return (
    <div
      onClick={onViewDetails}
      className={`card-premium overflow-hidden active:scale-[0.995] transition-all duration-200 cursor-pointer
        ${pending ? 'border-l-[3px] border-l-amber-400 bg-amber-50/20' : ''}
      `}
    >
      <div className="p-3">
        {/* Row 1: icon + dealer label + time */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
            ${call.connected ? 'bg-emerald-50' : 'bg-slate-100'}
          `}>
            <CallIcon className={`w-3.5 h-3.5 ${call.connected ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <h3 className="text-[13px] font-semibold text-slate-800 truncate flex-1 min-w-0">{label}</h3>
          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0 tabular-nums">
            {timeAgo(call.timestamp)}
          </span>
        </div>

        {/* Row 2: status chip + duration + rec + outcome */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
          {!pending && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {call.productiveStatus === 'productive' ? 'Productive' : 'Non-productive'}
            </span>
          )}
          {pending && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
              <AlertCircle className="w-3 h-3" />
              Feedback pending
            </span>
          )}

          {pending && onAddFeedback && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddFeedback(); }}
              className="ml-auto px-2.5 py-1 bg-amber-500 text-white text-[11px] font-semibold rounded-md
                         hover:bg-amber-600 active:scale-95 transition-all"
            >
              Add Feedback
            </button>
          )}
        </div>

        {call.outcome && (
          <div className="mt-1.5 text-[12px] text-slate-500 leading-snug line-clamp-1">
            {call.outcome}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Visit Card ──

interface VisitCardProps {
  visit: Visit;
  onAddFeedback?: () => void;
  onCheckIn?: () => void;
  onViewSummary?: () => void;
}

export function VisitActivityCard({ visit, onAddFeedback, onCheckIn, onViewSummary }: VisitCardProps) {
  const isPlanned = visit.status === 'not-started';
  const isInProgress = visit.status === 'in-progress';
  const isCompleted = visit.status === 'completed';
  const pending = isVisitPendingFeedback(visit);
  const visitTime = visit.checkInTime || visit.scheduledTime || visit.createdAt;
  const label = dealerLabel(visit.dealerCode, visit.dealerName, visit.dealerId);

  return (
    <div
      onClick={onViewSummary}
      className={`card-premium overflow-hidden active:scale-[0.995] transition-all duration-200 cursor-pointer
        ${pending ? 'border-l-[3px] border-l-amber-400 bg-amber-50/20' : ''}
        ${!pending && isInProgress ? 'border-l-[3px] border-l-emerald-400' : ''}
        ${!pending && isPlanned ? 'border-l-[3px] border-l-sky-300' : ''}
      `}
    >
      <div className="p-3">
        {/* Row 1: icon + dealer + time */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
            ${isCompleted ? 'bg-emerald-50' : isInProgress ? 'bg-sky-50' : 'bg-slate-100'}
          `}>
            {isInProgress ? (
              <Navigation className="w-3.5 h-3.5 text-sky-600" />
            ) : (
              <MapPin className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`} />
            )}
          </div>
          <h3 className="text-[13px] font-semibold text-slate-800 truncate flex-1 min-w-0">{label}</h3>
          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0 tabular-nums">
            {visitTime ? timeAgo(visitTime) : '--'}
          </span>
        </div>

        {/* Row 2: chips + duration + CTA */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <StatusChip
            label={visitStatusLabel(visit.status)}
            variant={visitStatusVariant(visit.status)}
            dot
            size="sm"
          />
          {visit.checkInTime && visit.checkOutTime && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Clock className="w-3 h-3" />
              {formatDuration(Math.floor((new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime()) / 1000))}
            </span>
          )}
          {visit.purpose && visit.purpose.length > 0 && (
            <span className="text-[11px] text-slate-500 truncate">{visit.purpose[0]}</span>
          )}
          {pending && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
              <AlertCircle className="w-3 h-3" />
              Feedback pending
            </span>
          )}

          {pending && onAddFeedback ? (
            <button
              onClick={(e) => { e.stopPropagation(); onAddFeedback(); }}
              className="ml-auto px-2.5 py-1 bg-amber-500 text-white text-[11px] font-semibold rounded-md
                         hover:bg-amber-600 active:scale-95 transition-all"
            >
              Add Feedback
            </button>
          ) : isPlanned && onCheckIn ? (
            <button
              onClick={(e) => { e.stopPropagation(); onCheckIn(); }}
              className="ml-auto px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-semibold rounded-md
                         hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Check In
            </button>
          ) : null}
        </div>

        {(visit.outcome || visit.meetingPerson) && (
          <div className="mt-1.5 text-[12px] text-slate-500 leading-snug line-clamp-1">
            {visit.meetingPerson && <span className="text-slate-400">Met: </span>}
            {visit.meetingPerson}
            {visit.meetingPerson && visit.outcome && ' · '}
            {visit.outcome}
          </div>
        )}
      </div>
    </div>
  );
}
