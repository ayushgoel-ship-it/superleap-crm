/**
 * Premium Chip & Badge System
 * Consistent chips for status, segment, urgency, channel
 */

import { type ReactNode } from 'react';

// ── Status Chip ──
type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface StatusChipProps {
  label: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: ReactNode;
}

const STATUS_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  info: 'bg-sky-50 text-sky-700 border-sky-100',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
};

const DOT_COLORS: Record<StatusVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
  purple: 'bg-violet-500',
};

export function StatusChip({ label, variant = 'neutral', size = 'sm', dot = false, icon }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium
        ${STATUS_STYLES[variant]}
        ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[variant]}`} />}
      {icon}
      {label}
    </span>
  );
}

// ── Channel Badge ──
type ChannelType = 'NGS' | 'GS' | 'DCF' | string;

const CHANNEL_STYLES: Record<string, string> = {
  NGS: 'bg-blue-50 text-blue-700 border-blue-100',
  GS: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  DCF: 'bg-amber-50 text-amber-700 border-amber-100',
  // Legacy fallbacks for any remaining raw channel references
  C2B: 'bg-blue-50 text-blue-700 border-blue-100',
  C2D: 'bg-blue-50 text-blue-700 border-blue-100',
};

export function ChannelChip({ channel }: { channel: ChannelType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border
      ${CHANNEL_STYLES[channel] || 'bg-slate-50 text-slate-600 border-slate-200'}
    `}>
      {channel}
    </span>
  );
}

// ── Segment Badge ──
export function SegmentBadge({ segment }: { segment: 'A' | 'B' | 'C' | string }) {
  const styles = {
    A: 'bg-indigo-600 text-white',
    B: 'bg-indigo-100 text-indigo-700',
    C: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold
      ${styles[segment as keyof typeof styles] || 'bg-slate-100 text-slate-600'}
    `}>
      {segment}
    </span>
  );
}

// ── Filter Chip (toggleable) ──
interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

export function FilterChip({ label, active, onClick, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium
        transition-all duration-150 min-h-[36px] whitespace-nowrap
        ${active
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold
          ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
        `}>
          {count}
        </span>
      )}
    </button>
  );
}
