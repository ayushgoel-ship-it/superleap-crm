/**
 * Premium Empty State System
 * 4 variants: empty, filtered, error, loading
 * Encouraging, action-oriented, never generic CRM
 */

import { type ComponentType } from 'react';
import {
  Inbox, Search, Users, FileText, MapPin, Phone, Bell,
  AlertTriangle, RefreshCw, Lightbulb, Clock, IndianRupee,
  ShieldCheck, ArrowRight,
} from 'lucide-react';
import { ListSkeleton } from './SkeletonLoader';

// ── Variant Types ──
type EmptyVariant = 'empty' | 'filtered' | 'error' | 'loading';

type EmptyType =
  | 'dealers' | 'leads' | 'visits' | 'calls'
  | 'notifications' | 'search' | 'activity'
  | 'dcf' | 'audit' | 'general';

// ── Tip item ──
interface Tip {
  text: string;
}

// ── Props ──
export interface EmptyStateProps {
  /** Visual variant */
  variant?: EmptyVariant;
  /** Context type – picks default icon, title, description, tips */
  type?: EmptyType;
  /** Override icon */
  icon?: ComponentType<{ className?: string }>;
  /** Override title */
  title?: string;
  /** Override description */
  description?: string;
  /** Primary CTA label */
  actionLabel?: string;
  /** Primary CTA handler */
  onAction?: () => void;
  /** Secondary CTA label (e.g. "Clear filters") */
  secondaryLabel?: string;
  /** Secondary CTA handler */
  onSecondary?: () => void;
  /** Override tips array */
  tips?: Tip[];
  /** Retry handler for error variant */
  onRetry?: () => void;
  /** Skeleton count for loading variant */
  skeletonCount?: number;
  /** Optional extra class */
  className?: string;
}

// ── Preset Configs ──
interface PresetConfig {
  icon: ComponentType<{ className?: string }>;
  accentBg: string;
  accentIcon: string;
  accentRing: string;
  empty: { title: string; description: string; tips: Tip[] };
  filtered: { title: string; description: string };
  error: { title: string; description: string };
}

const PRESETS: Record<EmptyType, PresetConfig> = {
  dealers: {
    icon: Users,
    accentBg: 'bg-indigo-50',
    accentIcon: 'text-indigo-500',
    accentRing: 'ring-indigo-100',
    empty: {
      title: 'Build your dealer network',
      description: 'Your assigned dealers will appear here. Start by adding your first dealer to track performance.',
      tips: [
        { text: 'Add a dealer to start tracking leads and visits' },
        { text: 'Tag top dealers to prioritize outreach' },
      ],
    },
    filtered: {
      title: 'No matching dealers',
      description: 'Your current filters didn\'t match any dealers. Try broadening your criteria.',
    },
    error: {
      title: 'Couldn\'t load dealers',
      description: 'We ran into a problem fetching your dealer list. This is usually temporary.',
    },
  },
  leads: {
    icon: FileText,
    accentBg: 'bg-violet-50',
    accentIcon: 'text-violet-500',
    accentRing: 'ring-violet-100',
    empty: {
      title: 'No leads yet',
      description: 'Once dealers start referring, your leads pipeline will show up here.',
      tips: [
        { text: 'Create a lead manually or wait for dealer referrals' },
        { text: 'Follow up on active leads to move them through stages' },
      ],
    },
    filtered: {
      title: 'No leads match your filters',
      description: 'Try adjusting the channel, stage, or time period to see more results.',
    },
    error: {
      title: 'Couldn\'t load leads',
      description: 'There was an issue loading your leads. Please try again in a moment.',
    },
  },
  visits: {
    icon: MapPin,
    accentBg: 'bg-emerald-50',
    accentIcon: 'text-emerald-500',
    accentRing: 'ring-emerald-100',
    empty: {
      title: 'No visits scheduled',
      description: 'Plan your next dealer visit to keep momentum going. Consistent visits drive conversions.',
      tips: [
        { text: 'Schedule a visit from a dealer\'s detail page' },
        { text: 'Check nearby dealers for quick drop-ins' },
      ],
    },
    filtered: {
      title: 'No visits match',
      description: 'Try adjusting your date range or filters to see past or upcoming visits.',
    },
    error: {
      title: 'Couldn\'t load visits',
      description: 'We had trouble loading your visit history. Please try again.',
    },
  },
  calls: {
    icon: Phone,
    accentBg: 'bg-sky-50',
    accentIcon: 'text-sky-500',
    accentRing: 'ring-sky-100',
    empty: {
      title: 'No calls recorded yet',
      description: 'Your call activity will appear here as you connect with dealers. Every call counts!',
      tips: [
        { text: 'Start a call from a dealer card or suggested calls' },
        { text: 'Log call outcomes to track follow-up actions' },
      ],
    },
    filtered: {
      title: 'No calls in this period',
      description: 'Switch to a different time range to see older call records.',
    },
    error: {
      title: 'Couldn\'t load calls',
      description: 'Call history is temporarily unavailable. Please try again.',
    },
  },
  notifications: {
    icon: Bell,
    accentBg: 'bg-amber-50',
    accentIcon: 'text-amber-500',
    accentRing: 'ring-amber-100',
    empty: {
      title: 'All caught up!',
      description: 'No new notifications right now. Keep up the great work — we\'ll alert you when something needs attention.',
      tips: [],
    },
    filtered: {
      title: 'No matching alerts',
      description: 'Try viewing a different tab to find what you\'re looking for.',
    },
    error: {
      title: 'Couldn\'t load notifications',
      description: 'We\'re having trouble loading your alerts. Please try again.',
    },
  },
  search: {
    icon: Search,
    accentBg: 'bg-slate-100',
    accentIcon: 'text-slate-500',
    accentRing: 'ring-slate-200',
    empty: {
      title: 'Search for anything',
      description: 'Type a dealer name, lead ID, car model, or customer name to find what you need.',
      tips: [],
    },
    filtered: {
      title: 'No results found',
      description: 'Try different keywords or check for typos. You can also broaden your filters.',
    },
    error: {
      title: 'Search failed',
      description: 'We couldn\'t complete your search right now. Please try again.',
    },
  },
  activity: {
    icon: Clock,
    accentBg: 'bg-orange-50',
    accentIcon: 'text-orange-500',
    accentRing: 'ring-orange-100',
    empty: {
      title: 'No activity yet',
      description: 'Calls, visits, and updates will appear here as your day progresses.',
      tips: [
        { text: 'Make a call or log a visit to get started' },
      ],
    },
    filtered: {
      title: 'No activity matches',
      description: 'Try switching between calls and visits, or widen the time range.',
    },
    error: {
      title: 'Couldn\'t load activity',
      description: 'Activity timeline is temporarily unavailable. Please try again.',
    },
  },
  dcf: {
    icon: IndianRupee,
    accentBg: 'bg-amber-50',
    accentIcon: 'text-amber-600',
    accentRing: 'ring-amber-100',
    empty: {
      title: 'No DCF loans yet',
      description: 'DCF loan details will appear here once dealers start submitting applications.',
      tips: [
        { text: 'Onboard a dealer to DCF from their detail page' },
      ],
    },
    filtered: {
      title: 'No DCF loans match',
      description: 'Try adjusting your filters or date range to see more results.',
    },
    error: {
      title: 'Couldn\'t load DCF data',
      description: 'DCF information is temporarily unavailable. Please try again.',
    },
  },
  audit: {
    icon: ShieldCheck,
    accentBg: 'bg-slate-100',
    accentIcon: 'text-slate-500',
    accentRing: 'ring-slate-200',
    empty: {
      title: 'No audit events',
      description: 'System audit events will appear here once there\'s activity to track.',
      tips: [],
    },
    filtered: {
      title: 'No matching events',
      description: 'Try adjusting your search or filters to find specific audit entries.',
    },
    error: {
      title: 'Couldn\'t load audit log',
      description: 'Audit records are temporarily unavailable. Please try again.',
    },
  },
  general: {
    icon: Inbox,
    accentBg: 'bg-slate-100',
    accentIcon: 'text-slate-500',
    accentRing: 'ring-slate-200',
    empty: {
      title: 'Nothing here yet',
      description: 'Content will appear here once there\'s data to show.',
      tips: [],
    },
    filtered: {
      title: 'No results',
      description: 'Try adjusting your search or filters.',
    },
    error: {
      title: 'Something went wrong',
      description: 'We ran into a problem loading this content. This is usually temporary.',
    },
  },
};

// ── Loading Variant ──
function LoadingState({ count = 3 }: { count?: number }) {
  return (
    <div className="p-4 animate-fade-in">
      <ListSkeleton count={count} />
    </div>
  );
}

// ── Main Component ──
export function EmptyState({
  variant = 'empty',
  type = 'general',
  icon: IconOverride,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  tips,
  onRetry,
  skeletonCount = 3,
  className = '',
}: EmptyStateProps) {
  // Loading variant — render skeletons
  if (variant === 'loading') {
    return <LoadingState count={skeletonCount} />;
  }

  const preset = PRESETS[type];
  const Icon = IconOverride || (variant === 'error' ? AlertTriangle : preset.icon);

  // Resolve copy based on variant
  const variantConfig = variant === 'error'
    ? preset.error
    : variant === 'filtered'
      ? preset.filtered
      : preset.empty;

  const resolvedTitle = title || variantConfig.title;
  const resolvedDescription = description || variantConfig.description;
  const resolvedTips = tips || (variant === 'empty' ? preset.empty.tips : []);

  // Accent colors — error uses rose, filtered uses slate, empty uses preset
  const accentBg = variant === 'error' ? 'bg-rose-50' : variant === 'filtered' ? 'bg-slate-100' : preset.accentBg;
  const accentIcon = variant === 'error' ? 'text-rose-500' : variant === 'filtered' ? 'text-slate-400' : preset.accentIcon;
  const accentRing = variant === 'error' ? 'ring-rose-100' : variant === 'filtered' ? 'ring-slate-200' : preset.accentRing;

  return (
    <div className={`flex flex-col items-center justify-center py-14 px-6 animate-fade-in ${className}`}>
      {/* Icon Badge — abstract rounded square with subtle ring */}
      <div className={`relative w-16 h-16 rounded-2xl ${accentBg} ring-4 ${accentRing} flex items-center justify-center mb-5`}>
        <Icon className={`w-7 h-7 ${accentIcon}`} />
        {/* Subtle decorative dot */}
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${accentBg} ring-2 ring-white`} />
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-slate-800 mb-1.5 text-center leading-snug">
        {resolvedTitle}
      </h3>

      {/* Description */}
      <p className="text-[13px] text-slate-500 text-center max-w-[280px] leading-relaxed mb-1">
        {resolvedDescription}
      </p>

      {/* Tips — "What to do next" */}
      {resolvedTips.length > 0 && (
        <div className="mt-4 w-full max-w-[300px]">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">What to do next</span>
          </div>
          <div className="space-y-1.5">
            {resolvedTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-slate-500 leading-relaxed">
                <ArrowRight className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col items-center gap-2.5 mt-5 w-full max-w-[280px]">
        {/* Primary CTA */}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="w-full px-5 py-3 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl
                       hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150
                       min-h-[44px] shadow-sm shadow-indigo-200"
          >
            {actionLabel}
          </button>
        )}

        {/* Error retry CTA */}
        {variant === 'error' && onRetry && !actionLabel && (
          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl
                       hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150
                       min-h-[44px] shadow-sm shadow-indigo-200"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}

        {/* Secondary CTA (e.g. "Clear filters") */}
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="w-full px-5 py-3 bg-white text-slate-600 text-[13px] font-medium rounded-xl
                       border border-slate-200 hover:bg-slate-50 active:scale-[0.98]
                       transition-all duration-150 min-h-[44px]"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Compact Inline Empty (for small sections inside cards) ──
export function InlineEmpty({
  icon: Icon = Inbox,
  message = 'No data',
  className = '',
}: {
  icon?: ComponentType<{ className?: string }>;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`card-premium p-6 flex flex-col items-center justify-center text-center animate-fade-in ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-[12px] text-slate-400 font-medium">{message}</p>
    </div>
  );
}