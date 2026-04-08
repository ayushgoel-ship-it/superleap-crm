/**
 * UNIFIED FEEDBACK FORM — Structured feedback for Visit + Call interactions.
 *
 * Compact, field-ops friendly, data-validatable.
 * Same 6-section structure for both Visit and Call.
 *
 * Sections:
 *   1. Proof (VISIT only) — photo capture with type
 *   2. Meeting Person — structured dropdown (not free text)
 *   3. Lead Sharing — toggle + conditional validated fields
 *   4. DCF Discussion — toggle + conditional validated fields
 *   5. Short Note — optional, max 200 chars
 *   6. Rating — 1–5 stars (mandatory)
 */

import { useState, useRef, useCallback } from 'react';
import {
  Camera, Upload, User, Handshake, CreditCard,
  StickyNote, Star, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, ImageIcon, X, Tag,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

import type {
  InteractionType,
  MeetingPersonRole,
  LeadSharingStatus,
  DCFInterestStatus,
  DCFCreditRange,
  DCFDocType,
  ProofPhotoType,
  DealerPersona,
  UnifiedFeedbackData,
} from './visitHelpers';

import {
  MEETING_PERSON_ROLES,
  LEAD_SHARING_STATUSES,
  DCF_INTEREST_STATUSES,
  DCF_CREDIT_RANGES,
  DCF_DOC_TYPES,
  DEALER_PERSONAS,
} from './visitHelpers';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface UnifiedFeedbackFormProps {
  interactionType: InteractionType;
  dealerName: string;
  /** Called with validated feedback data */
  onSubmit: (data: UnifiedFeedbackData) => void;
  /** For non-mandatory contexts (calls may allow dismiss) */
  onCancel?: () => void;
  /** Whether the form can be dismissed */
  closeable?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] font-medium text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

function Section({
  number,
  icon: Icon,
  title,
  subtitle,
  color,
  required,
  complete,
  error,
  expanded,
  onToggle,
  children,
}: {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  color: string;
  required?: boolean;
  complete?: boolean;
  error?: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const bgMap: Record<string, string> = {
    indigo: 'bg-indigo-50',
    emerald: 'bg-emerald-50',
    sky: 'bg-sky-50',
    violet: 'bg-violet-50',
    amber: 'bg-amber-50',
    rose: 'bg-rose-50',
  };
  const textMap: Record<string, string> = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    sky: 'text-sky-600',
    violet: 'text-violet-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
  };

  return (
    <div
      data-feedback-section={number}
      className={`bg-white rounded-2xl border transition-all ${
      error ? 'border-rose-200 shadow-[0_0_0_1px_rgba(244,63,94,0.1)]' : 'border-slate-100 shadow-sm'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors rounded-2xl"
      >
        <div className={`w-7 h-7 rounded-lg ${bgMap[color] || 'bg-slate-100'} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${textMap[color] || 'text-slate-600'}`} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-slate-800">{title}</span>
            {required && <span className="text-rose-500 text-[10px]">*</span>}
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-400 block">{subtitle}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {complete && !error && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
          {error && (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-3 mt-0">
          {children}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function UnifiedFeedbackForm({
  interactionType,
  dealerName,
  onSubmit,
  onCancel,
  closeable = false,
}: UnifiedFeedbackFormProps) {
  const isVisit = interactionType === 'VISIT';

  // ── Section expansion ──
  const [expandedSection, setExpandedSection] = useState<number>(isVisit ? 1 : 2);
  const toggleSection = (n: number) => setExpandedSection(expandedSection === n ? 0 : n);

  // ── Section 1: Proof ──
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<ProofPhotoType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Section 2: Meeting Person ──
  const [meetingRole, setMeetingRole] = useState<MeetingPersonRole | ''>('');
  const [meetingOther, setMeetingOther] = useState('');

  // ── Section 3: Lead Sharing ──
  const [leadShared, setLeadShared] = useState(false);
  const [leadStatus, setLeadStatus] = useState<LeadSharingStatus | null>(null);
  const [sellerLeads, setSellerLeads] = useState(0);
  const [inspectionExpected, setInspectionExpected] = useState<boolean | null>(null);

  // ── Section 4: DCF ──
  const [dcfDiscussed, setDcfDiscussed] = useState(false);
  const [dcfStatus, setDcfStatus] = useState<DCFInterestStatus | null>(null);
  const [dcfCreditRange, setDcfCreditRange] = useState<DCFCreditRange | null>(null);
  const [dcfDocs, setDcfDocs] = useState<Set<DCFDocType>>(new Set());

  // ── Section 5: Note ──
  const [note, setNote] = useState('');

  // ── Section 6: Rating ──
  const [rating, setRating] = useState(0);

  // ── Section 7: Dealer Persona ──
  const [dealerPersona, setDealerPersona] = useState<DealerPersona | ''>('');

  const shopClosed = meetingRole === 'Shop closed';

  // ── Validation state ──
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  // ── Photo handling ──
  const handlePhotoCapture = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearPhoto = useCallback(() => {
    setPhotoPreview(null);
    setPhotoType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── DCF doc toggle ──
  const toggleDoc = useCallback((doc: DCFDocType) => {
    setDcfDocs((prev) => {
      const next = new Set(prev);
      if (doc === 'None') {
        // 'None' clears others
        return next.has('None') ? new Set() : new Set(['None'] as DCFDocType[]);
      }
      next.delete('None');
      if (next.has(doc)) next.delete(doc);
      else next.add(doc);
      return next;
    });
  }, []);

  // ── Validation ──
  const validate = useCallback((): boolean => {
    const errs: Record<string, boolean> = {};

    // Visit: photo mandatory
    if (isVisit && !photoPreview) errs.photo = true;
    if (isVisit && photoPreview && !photoType) errs.photoType = true;

    // Meeting person mandatory
    if (!meetingRole) errs.meetingRole = true;
    if (meetingRole === 'Other' && !meetingOther.trim()) errs.meetingOther = true;

    // Lead/DCF validation only when shop is open
    if (!shopClosed) {
      if (leadShared && !leadStatus) errs.leadStatus = true;
      if (dcfDiscussed && !dcfStatus) errs.dcfStatus = true;
    }

    // Rating mandatory
    if (rating === 0) errs.rating = true;

    // Dealer persona mandatory
    if (!dealerPersona) errs.dealerPersona = true;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [isVisit, photoPreview, photoType, meetingRole, meetingOther, leadShared, leadStatus, dcfDiscussed, dcfStatus, rating, dealerPersona, shopClosed]);

  // ── Submit ──
  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    if (!validate()) {
      toast.error('Please fill all required fields');
      // Auto-expand first error section + scroll to it
      let firstErrorSection = 0;
      if (errors.photo || errors.photoType) firstErrorSection = 1;
      else if (errors.meetingRole || errors.meetingOther) firstErrorSection = 2;
      else if (errors.leadStatus) firstErrorSection = 3;
      else if (errors.dcfStatus) firstErrorSection = 4;
      else if (errors.rating) firstErrorSection = 6;
      else if (errors.dealerPersona) firstErrorSection = 7;
      if (firstErrorSection > 0) {
        setExpandedSection(firstErrorSection);
        // Defer scroll until the section expand animation has started
        setTimeout(() => {
          const el = document.querySelector(`[data-feedback-section="${firstErrorSection}"]`);
          if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
            (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 80);
      }
      return;
    }

    const data: UnifiedFeedbackData = {
      interactionType,
      photoUrl: photoPreview,
      photoType: photoType,
      photoTimestamp: photoPreview ? new Date().toISOString() : null,
      geoVerified: isVisit,
      meetingPersonRole: meetingRole as MeetingPersonRole,
      meetingPersonOtherText: meetingRole === 'Other' ? meetingOther.trim() : null,
      leadShared: shopClosed ? false : leadShared,
      leadStatus: shopClosed ? null : (leadShared ? leadStatus : null),
      sellerLeadCount: !shopClosed && leadShared && leadStatus === 'Yes – Confirmed' ? sellerLeads : 0,
      buyerLeadCount: 0,
      inspectionExpected: !shopClosed && leadShared && leadStatus === 'Yes – Confirmed' ? inspectionExpected : null,
      dcfDiscussed: shopClosed ? false : dcfDiscussed,
      dcfStatus: shopClosed ? null : (dcfDiscussed ? dcfStatus : null),
      dcfCreditRange: !shopClosed && dcfDiscussed && (dcfStatus === 'Interested' || dcfStatus === 'Follow-up Required' || dcfStatus === 'Very Interested') ? dcfCreditRange : null,
      dcfDocsCollected: !shopClosed && dcfDiscussed && (dcfStatus === 'Interested' || dcfStatus === 'Follow-up Required' || dcfStatus === 'Very Interested') ? Array.from(dcfDocs) : [],
      note: note.trim(),
      rating,
      dealerPersona: dealerPersona || null,
    };

    onSubmit(data);
  }, [
    validate, errors, interactionType, photoPreview, photoType, isVisit,
    meetingRole, meetingOther, leadShared, leadStatus, sellerLeads,
    inspectionExpected, dcfDiscussed, dcfStatus, dcfCreditRange, dcfDocs, note, rating,
    dealerPersona, shopClosed, onSubmit,
  ]);

  // ── Section completion checks ──
  const section1Complete = !isVisit || (!!photoPreview && !!photoType);
  const section2Complete = !!meetingRole && (meetingRole !== 'Other' || !!meetingOther.trim());
  const section3Complete = !leadShared || !!leadStatus;
  const section4Complete = !dcfDiscussed || !!dcfStatus;
  const section6Complete = rating > 0;

  const showDcfDetails = dcfDiscussed && (dcfStatus === 'Very Interested' || dcfStatus === 'Interested' || dcfStatus === 'Follow-up Required');
  const showLeadDetails = leadShared && leadStatus === 'Yes – Confirmed';

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">
            {isVisit ? 'Visit' : 'Call'} Feedback
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {dealerName}
            {isVisit && (
              <span className="text-amber-600 font-medium ml-1.5">
                * Submit before next visit
              </span>
            )}
          </p>
        </div>
        {closeable && onCancel && (
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4.5 h-4.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* ═══ SECTION 1: Proof (VISIT only) ═══ */}
      {isVisit && (
        <Section
          number={1}
          icon={Camera}
          title="Capture Proof"
          subtitle="Photo with Owner or Shop Front"
          color="indigo"
          required
          complete={section1Complete}
          error={submitted && (!!errors.photo || !!errors.photoType)}
          expanded={expandedSection === 1}
          onToggle={() => toggleSection(1)}
        >
          <div className="space-y-3 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {!photoPreview ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePhotoCapture}
                  className="flex-1 py-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[12px] font-semibold text-indigo-700
                             hover:bg-indigo-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={handlePhotoCapture}
                  className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-600
                             hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Proof"
                  className="w-full h-32 object-cover rounded-xl border border-slate-200"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}

            {/* Photo Type Selection */}
            {photoPreview && (
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Photo Type <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  {(['With Owner', 'Shop Front'] as ProofPhotoType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPhotoType(type)}
                      className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border transition-all active:scale-[0.97]
                        ${photoType === type
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }
                        ${submitted && errors.photoType && !photoType ? 'border-rose-300' : ''}
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submitted && errors.photo && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Photo is required for visits
              </p>
            )}
          </div>
        </Section>
      )}

      {/* ═══ SECTION 2: Meeting Person ═══ */}
      <Section
        number={2}
        icon={User}
        title="Met / Spoke To"
        subtitle={meetingRole ? (meetingRole === 'Other' ? meetingOther || 'Other' : meetingRole) : undefined}
        color="emerald"
        required
        complete={section2Complete}
        error={submitted && (!!errors.meetingRole || !!errors.meetingOther)}
        expanded={expandedSection === 2}
        onToggle={() => toggleSection(2)}
      >
        <div className="space-y-3 pt-2">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
            Person Role <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {MEETING_PERSON_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => { setMeetingRole(role); if (errors.meetingRole) setErrors(prev => ({ ...prev, meetingRole: false })); }}
                className={`py-2.5 px-3 rounded-xl text-[12px] font-medium border transition-all active:scale-[0.97]
                  ${meetingRole === role
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }
                  ${submitted && errors.meetingRole && !meetingRole ? 'border-rose-300' : ''}
                `}
              >
                {role}
              </button>
            ))}
          </div>

          {meetingRole === 'Other' && (
            <input
              type="text"
              placeholder="Specify role..."
              value={meetingOther}
              onChange={(e) => { setMeetingOther(e.target.value); if (errors.meetingOther) setErrors(prev => ({ ...prev, meetingOther: false })); }}
              className={`w-full px-3 py-2.5 rounded-xl text-[13px] border transition-colors
                ${submitted && errors.meetingOther ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}
                focus:outline-none focus:ring-2 focus:ring-indigo-200`}
            />
          )}
        </div>
      </Section>

      {/* ═══ SECTION 3: Lead Sharing (hidden when Shop closed) ═══ */}
      {!shopClosed && <Section
        number={3}
        icon={Handshake}
        title="Lead Sharing"
        subtitle={leadShared ? (leadStatus || 'In progress...') : 'Not shared'}
        color="sky"
        complete={section3Complete}
        error={submitted && !!errors.leadStatus}
        expanded={expandedSection === 3}
        onToggle={() => toggleSection(3)}
      >
        <div className="space-y-3 pt-2">
          <Toggle
            label="Lead Shared During Interaction"
            value={leadShared}
            onChange={setLeadShared}
          />

          {leadShared && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Lead Sharing Status <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-1.5">
                  {LEAD_SHARING_STATUSES.map((status) => (
                    <label
                      key={status}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 border rounded-xl cursor-pointer transition-all
                        ${leadStatus === status
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }
                        ${submitted && errors.leadStatus && !leadStatus ? 'border-rose-200' : ''}
                      `}
                    >
                      <input
                        type="radio"
                        name="leadStatus"
                        checked={leadStatus === status}
                        onChange={() => { setLeadStatus(status); if (errors.leadStatus) setErrors(prev => ({ ...prev, leadStatus: false })); }}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <span className="text-[12px] text-slate-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lead details only if Confirmed */}
              {showLeadDetails && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Seller Leads</label>
                    <input
                      type="number"
                      min={0}
                      value={sellerLeads}
                      onChange={(e) => setSellerLeads(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-lg text-[13px] border border-slate-200 bg-white
                                 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">Inspection Expected?</label>
                    <div className="flex gap-2">
                      {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(({ val, label }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setInspectionExpected(val)}
                          className={`flex-1 py-2 rounded-lg text-[12px] font-medium border transition-all
                            ${inspectionExpected === val
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200'
                            }
                          `}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Section>}

      {/* ═══ SECTION 4: DCF Discussion (hidden when Shop closed) ═══ */}
      {!shopClosed && <Section
        number={4}
        icon={CreditCard}
        title="DCF Discussion"
        subtitle={dcfDiscussed ? (dcfStatus || 'In progress...') : 'Not discussed'}
        color="violet"
        complete={section4Complete}
        error={submitted && !!errors.dcfStatus}
        expanded={expandedSection === 4}
        onToggle={() => toggleSection(4)}
      >
        <div className="space-y-3 pt-2">
          <Toggle
            label="DCF Discussed"
            value={dcfDiscussed}
            onChange={setDcfDiscussed}
          />

          {dcfDiscussed && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  DCF Status <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-1.5">
                  {DCF_INTEREST_STATUSES.map((status) => (
                    <label
                      key={status}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 border rounded-xl cursor-pointer transition-all
                        ${dcfStatus === status
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }
                        ${submitted && errors.dcfStatus && !dcfStatus ? 'border-rose-200' : ''}
                      `}
                    >
                      <input
                        type="radio"
                        name="dcfStatus"
                        checked={dcfStatus === status}
                        onChange={() => { setDcfStatus(status); if (errors.dcfStatus) setErrors(prev => ({ ...prev, dcfStatus: false })); }}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <span className="text-[12px] text-slate-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* DCF details only if Interested / Follow-up / Very Interested */}
              {showDcfDetails && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-3">
                  {/* Credit Range */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                      Estimated Credit Need
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {DCF_CREDIT_RANGES.map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setDcfCreditRange(range)}
                          className={`py-2 rounded-lg text-[11px] font-medium border transition-all
                            ${dcfCreditRange === range
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-white text-slate-600 border-slate-200'
                            }
                          `}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Docs Collected */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                      Docs Collected
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DCF_DOC_TYPES.map((doc) => (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => toggleDoc(doc)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all
                            ${dcfDocs.has(doc)
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-white text-slate-600 border-slate-200'
                            }
                          `}
                        >
                          {doc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Section>}

      {/* ═══ SECTION 5: Short Note ═══ */}
      <Section
        number={5}
        icon={StickyNote}
        title="Key Note"
        subtitle={note.trim() ? `${note.trim().length}/200` : 'Optional'}
        color="amber"
        complete={false}
        expanded={expandedSection === 5}
        onToggle={() => toggleSection(5)}
      >
        <div className="pt-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Short note (max 200 chars)..."
            maxLength={200}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] border border-slate-200 bg-white
                       placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200
                       transition-colors resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-[10px] ${note.length >= 180 ? 'text-amber-600' : 'text-slate-400'}`}>
              {note.length}/200
            </span>
          </div>
        </div>
      </Section>

      {/* ═══ SECTION 6: Rating ═══ */}
      <Section
        number={6}
        icon={Star}
        title="Interaction Rating"
        subtitle={rating > 0 ? `${rating}/5` : undefined}
        color="rose"
        required
        complete={section6Complete}
        error={submitted && !!errors.rating}
        expanded={expandedSection === 6}
        onToggle={() => toggleSection(6)}
      >
        <div className="pt-2">
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setRating(n); if (errors.rating) setErrors(prev => ({ ...prev, rating: false })); }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90
                  ${n <= rating
                    ? 'bg-amber-100 border-2 border-amber-300'
                    : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }
                  ${submitted && errors.rating && rating === 0 ? 'border-rose-300' : ''}
                `}
              >
                <Star className={`w-5 h-5 ${n <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          {submitted && errors.rating && (
            <p className="text-[11px] text-rose-500 text-center mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" /> Rating is required
            </p>
          )}
        </div>
      </Section>

      {/* ═══ SECTION 7: Dealer Persona ═══ */}
      <Section
        number={7}
        icon={Tag}
        title="Dealer Persona"
        subtitle={dealerPersona || undefined}
        color="sky"
        required
        complete={!!dealerPersona}
        error={submitted && !!errors.dealerPersona}
        expanded={expandedSection === 7}
        onToggle={() => toggleSection(7)}
      >
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-1.5">
            {DEALER_PERSONAS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setDealerPersona(p); if (errors.dealerPersona) setErrors(prev => ({ ...prev, dealerPersona: false })); }}
                className={`py-2.5 px-3 rounded-xl text-[12px] font-medium border transition-all active:scale-[0.97]
                  ${dealerPersona === p
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }
                  ${submitted && errors.dealerPersona && !dealerPersona ? 'border-rose-300' : ''}
                `}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ Submit ═══ */}
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full py-3.5 bg-indigo-600 text-white text-[14px] font-semibold rounded-2xl
                   hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-200"
      >
        Submit Feedback
      </button>

      {/* Validation summary */}
      {submitted && Object.keys(errors).length > 0 && (
        <p className="text-[11px] text-rose-500 text-center flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {Object.keys(errors).length} required field{Object.keys(errors).length > 1 ? 's' : ''} missing
        </p>
      )}
    </div>
  );
}