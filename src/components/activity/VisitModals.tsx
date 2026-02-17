/**
 * Visit Modals — GeoFence warning, Update Location, Feedback Form, Custom Date Picker
 */

import { useState, useEffect, useCallback } from 'react';
import {
  X, MapPin, Navigation, AlertTriangle, Star, CheckCircle2,
  Loader2, Crosshair,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { GeoFenceState, FeedbackFormData, UserLocation, UnifiedFeedbackData } from './visitHelpers';
import { UPDATE_LOCATION_ACCURACY_M } from './visitHelpers';
import { UnifiedFeedbackForm } from './UnifiedFeedbackForm';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

function ModalOverlay({
  children,
  onClose,
  closeable = true,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  closeable?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={closeable ? onClose : undefined}
      />
      <div className="relative w-full max-w-md mx-4 mb-0 sm:mb-0 bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. GEO-FENCE MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface GeoFenceModalProps {
  state: GeoFenceState;
  onClose: () => void;
  onNavigateViaMaps: () => void;
  onUpdateLocation: () => void;
}

export function GeoFenceModal({
  state,
  onClose,
  onNavigateViaMaps,
  onUpdateLocation,
}: GeoFenceModalProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div>
          <h3 className="text-[16px] font-bold text-slate-900">Too far from dealer</h3>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            You are <span className="font-semibold text-amber-700">{Math.round(state.distanceM)}m</span> away
            from <span className="font-semibold text-slate-700">{state.dealerName}</span>.
            You need to be within 200m to start a visit.
          </p>
        </div>

        {/* Distance visualization */}
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
            <span className="flex items-center gap-1"><Crosshair className="w-3 h-3" /> You</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Dealer</span>
          </div>
          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-amber-400 rounded-full"
              style={{ width: `${Math.min(100, (200 / state.distanceM) * 100)}%` }}
            />
            <div
              className="absolute top-0 h-full border-r-2 border-dashed border-slate-400"
              style={{ left: `${Math.min(100, (200 / state.distanceM) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>0m</span>
            <span className="text-amber-600 font-medium">200m limit</span>
            <span>{Math.round(state.distanceM)}m</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onNavigateViaMaps}
            className="w-full py-3 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl
                       hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Navigate via Maps
          </button>
          <button
            onClick={onUpdateLocation}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 text-[13px] font-medium
                       rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Update Dealer Location
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. UPDATE LOCATION MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface UpdateLocationModalProps {
  dealerName: string;
  userLocation: UserLocation | null;
  onConfirm: (reason: string, reasonNote: string | null) => void;
  onClose: () => void;
}

export function UpdateLocationModal({
  dealerName,
  userLocation,
  onConfirm,
  onClose,
}: UpdateLocationModalProps) {
  const [reason, setReason] = useState<string>('');
  const [reasonNote, setReasonNote] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

  const accuracy = userLocation?.accuracy ?? null;
  const isAccurate = accuracy != null && accuracy <= UPDATE_LOCATION_ACCURACY_M;
  // In preview environment (no real GPS), allow update since we use fallback coords
  const canUpdate = userLocation != null;

  const handleConfirm = () => {
    if (!reason) {
      setShowReasonError(true);
      toast.error('Please select a reason for updating the location');
      return;
    }
    if (reason === 'Other' && !reasonNote.trim()) {
      setShowReasonError(true);
      toast.error('Please provide a note for "Other" reason');
      return;
    }
    onConfirm(reason, reason === 'Other' ? reasonNote.trim() : null);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div>
          <h3 className="text-[16px] font-bold text-slate-900">Update Dealer Location</h3>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            Update <span className="font-semibold text-slate-700">{dealerName}</span>'s location
            to your current GPS position?
          </p>
        </div>

        {/* GPS status */}
        <div className={`rounded-xl p-3 flex items-center gap-3 ${
          canUpdate ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'
        }`}>
          {canUpdate ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-emerald-800">GPS signal ready</p>
                <p className="text-[11px] text-emerald-600">
                  Accuracy: {accuracy != null ? `${Math.round(accuracy)}m` : 'Simulated (preview)'}
                </p>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="w-5 h-5 text-amber-600 flex-shrink-0 animate-spin" />
              <div>
                <p className="text-[12px] font-semibold text-amber-800">Waiting for GPS signal</p>
                <p className="text-[11px] text-amber-600">
                  Need accuracy {'<'} {UPDATE_LOCATION_ACCURACY_M}m
                </p>
              </div>
            </>
          )}
        </div>

        {/* Reason dropdown (REQUIRED) */}
        <div>
          <label className="text-[12px] font-semibold text-slate-700 mb-1 block">
            Reason for update <span className="text-rose-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => { setReason(e.target.value); setShowReasonError(false); }}
            className={`w-full px-3 py-2.5 rounded-xl text-[13px] border transition-colors appearance-none bg-white
              ${showReasonError && !reason ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}
              focus:outline-none focus:ring-2 focus:ring-indigo-200`}
          >
            <option value="">Select a reason...</option>
            <option value="Dealer shifted">Dealer shifted</option>
            <option value="Wrong pinned earlier">Wrong pinned earlier</option>
            <option value="Map error">Map error</option>
            <option value="Other">Other (requires note)</option>
          </select>
        </div>

        {/* Note field for "Other" reason */}
        {reason === 'Other' && (
          <div>
            <label className="text-[12px] font-semibold text-slate-700 mb-1 block">
              Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Describe why the location needs updating..."
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-[13px] border transition-colors resize-none
                ${showReasonError && reason === 'Other' && !reasonNote.trim() ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}
                focus:outline-none focus:ring-2 focus:ring-indigo-200`}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 text-[13px] font-medium
                       rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canUpdate}
            className={`flex-1 py-3 text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98]
              ${canUpdate
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            Confirm Update
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. VISIT FEEDBACK MODAL (MANDATORY)
// ═══════════════════════════════════════════════════════════════════════════

interface VisitFeedbackModalProps {
  dealerName: string;
  visitId: string;
  onSubmit: (data: FeedbackFormData) => void;
}

export function VisitFeedbackModal({ dealerName, visitId, onSubmit }: VisitFeedbackModalProps) {
  const [form, setForm] = useState<FeedbackFormData>({
    meetingPerson: '',
    leadsDiscussed: 0,
    inspectionCount: 0,
    notes: '',
    nextAction: '',
    rating: 0,
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!form.meetingPerson.trim()) newErrors.meetingPerson = true;
    if (form.rating === 0) newErrors.rating = true;
    if (!form.notes.trim()) newErrors.notes = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(form);
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const setField = <K extends keyof FeedbackFormData>(key: K, value: FeedbackFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <ModalOverlay closeable={false}>
      <div className="p-5 space-y-4">
        {/* Header — no close button (mandatory) */}
        <div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900">Visit Feedback</h3>
          <p className="text-[13px] text-slate-500 mt-1">
            Complete feedback for <span className="font-semibold text-slate-700">{dealerName}</span>
          </p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            * You must submit feedback before starting a new visit
          </p>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          {/* Met person */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 mb-1 block">
              Met Person <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Suresh (Owner)"
              value={form.meetingPerson}
              onChange={(e) => setField('meetingPerson', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-[13px] border transition-colors
                ${errors.meetingPerson
                  ? 'border-rose-300 bg-rose-50 focus:ring-rose-200'
                  : 'border-slate-200 bg-white focus:ring-indigo-200'
                } focus:outline-none focus:ring-2`}
            />
          </div>

          {/* Leads discussed + Inspection count (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1 block">
                Leads Discussed
              </label>
              <input
                type="number"
                min={0}
                value={form.leadsDiscussed}
                onChange={(e) => setField('leadsDiscussed', Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] border border-slate-200 bg-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700 mb-1 block">
                Inspection Count
              </label>
              <input
                type="number"
                min={0}
                value={form.inspectionCount}
                onChange={(e) => setField('inspectionCount', Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] border border-slate-200 bg-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 mb-1 block">
              Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Key discussion points..."
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-[13px] border transition-colors resize-none
                ${errors.notes
                  ? 'border-rose-300 bg-rose-50 focus:ring-rose-200'
                  : 'border-slate-200 bg-white focus:ring-indigo-200'
                } focus:outline-none focus:ring-2`}
            />
          </div>

          {/* Next action */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 mb-1 block">Next Action</label>
            <input
              type="text"
              placeholder="e.g., Schedule inspection next week"
              value={form.nextAction}
              onChange={(e) => setField('nextAction', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] border border-slate-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="text-[12px] font-semibold text-slate-700 mb-1 block">
              Visit Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setField('rating', n)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90
                    ${n <= form.rating
                      ? 'bg-amber-100 border-2 border-amber-300'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }
                    ${errors.rating && form.rating === 0 ? 'border-rose-300' : ''}
                  `}
                >
                  <Star className={`w-5 h-5 ${n <= form.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-indigo-600 text-white text-[14px] font-semibold rounded-xl
                     hover:bg-indigo-700 active:scale-[0.98] transition-all mt-2"
        >
          Submit Feedback
        </button>
      </div>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. CUSTOM DATE PICKER MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface CustomDatePickerModalProps {
  initialRange?: { start: string; end: string };
  onApply: (range: { start: string; end: string }) => void;
  onClose: () => void;
}

export function CustomDatePickerModal({ initialRange, onApply, onClose }: CustomDatePickerModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [start, setStart] = useState(initialRange?.start || today);
  const [end, setEnd] = useState(initialRange?.end || today);

  const handleApply = () => {
    if (start > end) {
      toast.error('Start date must be before end date');
      return;
    }
    onApply({ start, end });
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-[16px] font-bold text-slate-900">Custom Date Range</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] font-semibold text-slate-700 mb-1 block">Start Date</label>
            <input
              type="date"
              value={start}
              max={today}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] border border-slate-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700 mb-1 block">End Date</label>
            <input
              type="date"
              value={end}
              max={today}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-[13px] border border-slate-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 text-[13px] font-medium
                       rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl
                       hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            Apply
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. VISIT BLOCKER MODAL (shows when lifecycle blocks new visit)
// ═══════════════════════════════════════════════════════════════════════════

interface VisitBlockerModalProps {
  reason: string;
  blockingVisitDealerName?: string;
  hasNoFeedback: boolean;
  onClose: () => void;
  onFillFeedback?: () => void;
  onEndVisit?: () => void;
}

export function VisitBlockerModal({
  reason,
  hasNoFeedback,
  onClose,
  onFillFeedback,
  onEndVisit,
}: VisitBlockerModalProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div>
          <h3 className="text-[16px] font-bold text-slate-900">Cannot Start Visit</h3>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">{reason}</p>
        </div>

        <div className="space-y-2">
          {hasNoFeedback && onFillFeedback && (
            <button
              onClick={onFillFeedback}
              className="w-full py-3 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl
                         hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              Fill Feedback Now
            </button>
          )}
          {!hasNoFeedback && onEndVisit && (
            <button
              onClick={onEndVisit}
              className="w-full py-3 bg-rose-600 text-white text-[13px] font-semibold rounded-xl
                         hover:bg-rose-700 active:scale-[0.98] transition-all"
            >
              End Active Visit
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-slate-200 text-slate-600 text-[13px] font-medium
                       rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. UNIFIED VISIT/CALL FEEDBACK MODAL (NEW — structured, compact)
// ═══════════════════════════════════════════════════════════════════════════

interface UnifiedFeedbackModalProps {
  interactionType: 'VISIT' | 'CALL';
  dealerName: string;
  visitId: string;
  onSubmit: (data: UnifiedFeedbackData) => void;
  /** If true, user can dismiss (calls). Visits are mandatory. */
  closeable?: boolean;
  onClose?: () => void;
}

export function UnifiedFeedbackModal({
  interactionType,
  dealerName,
  visitId,
  onSubmit,
  closeable = false,
  onClose,
}: UnifiedFeedbackModalProps) {
  return (
    <ModalOverlay closeable={closeable} onClose={onClose}>
      <div className="p-4 pb-6">
        <UnifiedFeedbackForm
          interactionType={interactionType}
          dealerName={dealerName}
          onSubmit={onSubmit}
          onCancel={closeable ? onClose : undefined}
          closeable={closeable}
        />
      </div>
    </ModalOverlay>
  );
}