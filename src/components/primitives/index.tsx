/**
 * Wave D2 — Design-system primitives (canonical)
 *
 * 10 primitives: Card, CardHeader, Chip, ProgressBar, ProgressRing,
 * MetricDisplay, SegmentControl, EmptyState, Skeleton, InfoBlock,
 * SectionHeader, FilterChip.
 *
 * Tone vocabulary (single source):
 *   'success' | 'warning' | 'danger' | 'info' | 'neutral'
 * Maps to --color-semantic-* tokens defined in styles/globals.css.
 *
 * These are intentionally dependency-light (only React + tailwind classes)
 * so they can be migrated into pages incrementally without touching shadcn.
 */
import * as React from 'react';

// ----- shared types -----
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneText: Record<Tone, string> = {
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
  info: 'text-indigo-700',
  neutral: 'text-slate-700',
};
const toneBg: Record<Tone, string> = {
  success: 'bg-emerald-50',
  warning: 'bg-amber-50',
  danger: 'bg-rose-50',
  info: 'bg-indigo-50',
  neutral: 'bg-slate-50',
};
const toneBorder: Record<Tone, string> = {
  success: 'border-emerald-200',
  warning: 'border-amber-200',
  danger: 'border-rose-200',
  info: 'border-indigo-200',
  neutral: 'border-slate-200',
};
const toneBar: Record<Tone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-indigo-500',
  neutral: 'bg-slate-400',
};

export function autoTone(value: number, target: number): Tone {
  if (!target || target <= 0) return 'neutral';
  const pct = (value / target) * 100;
  if (pct >= 90) return 'success';
  if (pct >= 60) return 'warning';
  return 'danger';
}

// ----- 1. Card -----
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'premium' | 'elevated';
  status?: Tone;
}
export function Card({
  variant = 'default',
  status,
  className = '',
  children,
  ...rest
}: CardProps) {
  const base = 'rounded-2xl bg-white border';
  const variantCls =
    variant === 'elevated'
      ? 'shadow-md border-slate-200'
      : variant === 'premium'
        ? 'shadow-sm border-slate-200'
        : 'shadow-none border-slate-200';
  const statusCls = status ? `border-l-[3px] ${toneBorder[status].replace('border-', 'border-l-')}` : '';
  return (
    <div className={`${base} ${variantCls} ${statusCls} ${className}`} {...rest}>
      {children}
    </div>
  );
}

// ----- 2. CardHeader -----
export interface CardHeaderProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
export function CardHeader({ icon, title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 px-4 pt-3 pb-2 ${className}`}>
      <div className="flex items-start gap-2 min-w-0">
        {icon ? <div className="shrink-0 mt-0.5">{icon}</div> : null}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">{title}</div>
          {subtitle ? <div className="text-[11px] text-slate-500 truncate">{subtitle}</div> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

// ----- 3. Chip -----
export interface ChipProps {
  label: React.ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}
export function Chip({ label, tone = 'neutral', size = 'sm', icon, className = '' }: ChipProps) {
  const sz = size === 'md' ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${toneBg[tone]} ${toneText[tone]} ${toneBorder[tone]} ${sz} ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

// ----- 4. ProgressBar -----
export interface ProgressBarProps {
  value: number;
  target: number;
  tone?: Tone | 'auto';
  showPercent?: boolean;
  label?: React.ReactNode;
  className?: string;
}
export function ProgressBar({
  value,
  target,
  tone = 'auto',
  showPercent,
  label,
  className = '',
}: ProgressBarProps) {
  const t = tone === 'auto' ? autoTone(value, target) : tone;
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className={className}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
          <span>{label}</span>
          {showPercent ? <span className="font-semibold">{pct}%</span> : null}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${toneBar[t]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ----- 5. ProgressRing -----
export interface ProgressRingProps {
  value: number;
  target: number;
  tone?: Tone | 'auto';
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
}
export function ProgressRing({
  value,
  target,
  tone = 'auto',
  size = 64,
  stroke = 6,
  label,
}: ProgressRingProps) {
  const t = tone === 'auto' ? autoTone(value, target) : tone;
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const stroke700: Record<Tone, string> = {
    success: '#059669',
    warning: '#d97706',
    danger: '#e11d48',
    info: '#4f46e5',
    neutral: '#94a3b8',
  };
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={stroke700[t]}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-slate-700">
        {label ?? `${Math.round(pct)}%`}
      </div>
    </div>
  );
}

// ----- 6. MetricDisplay -----
export interface MetricDisplayProps {
  label: React.ReactNode;
  value: React.ReactNode;
  target?: number | string;
  unit?: string;
  sub?: React.ReactNode;
  tone?: Tone;
  className?: string;
}
export function MetricDisplay({ label, value, target, unit, sub, tone, className = '' }: MetricDisplayProps) {
  return (
    <div className={`flex items-start justify-between gap-2 ${className}`}>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500 truncate">{label}</div>
        {sub ? <div className="text-[10px] text-slate-400 truncate">{sub}</div> : null}
      </div>
      <div className="text-right">
        <div className={`text-sm font-semibold ${tone ? toneText[tone] : 'text-slate-800'}`}>
          {value}
          {unit ? <span className="text-[10px] text-slate-400 ml-0.5">{unit}</span> : null}
        </div>
        {target != null ? <div className="text-[10px] text-slate-400">/ {target}{unit ?? ''}</div> : null}
      </div>
    </div>
  );
}

// ----- 7. SegmentControl -----
export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
}
export interface SegmentControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}
export function SegmentControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'sm',
  className = '',
}: SegmentControlProps<T>) {
  const sz = size === 'md' ? 'text-xs px-3 py-1.5' : 'text-[11px] px-2.5 py-1';
  return (
    <div className={`inline-flex rounded-full bg-slate-100 p-0.5 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-full font-medium transition-colors ${sz} ${
              active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ----- 8. EmptyState -----
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { label: React.ReactNode; onClick: () => void };
  className?: string;
}
export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}>
      {icon ? <div className="mb-2 text-slate-400">{icon}</div> : null}
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {description ? <div className="text-[12px] text-slate-500 mt-1 max-w-xs">{description}</div> : null}
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-3 inline-flex items-center rounded-full bg-indigo-600 text-white text-[12px] font-semibold px-3 py-1.5 hover:bg-indigo-700"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

// ----- 9. Skeleton -----
export interface SkeletonProps {
  variant?: 'card' | 'bar' | 'text' | 'circle';
  count?: number;
  className?: string;
}
export function Skeleton({ variant = 'bar', count = 1, className = '' }: SkeletonProps) {
  const shape =
    variant === 'card'
      ? 'h-20 rounded-2xl'
      : variant === 'circle'
        ? 'h-10 w-10 rounded-full'
        : variant === 'text'
          ? 'h-3 rounded'
          : 'h-2 rounded-full';
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${shape} bg-slate-100 animate-pulse`} />
      ))}
    </div>
  );
}

// ----- 10a. InfoBlock -----
export interface InfoBlockProps {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
export function InfoBlock({ tone = 'info', icon, children, className = '' }: InfoBlockProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[12px] leading-snug ${toneBg[tone]} ${toneText[tone]} ${toneBorder[tone]} ${className}`}
    >
      {icon ? <div className="shrink-0 mt-0.5">{icon}</div> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ----- 10b. SectionHeader -----
export interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
export function SectionHeader({ title, subtitle, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-end justify-between mb-2 ${className}`}>
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</div>
        {subtitle ? <div className="text-[12px] text-slate-600">{subtitle}</div> : null}
      </div>
      {action}
    </div>
  );
}

// ----- 10c. FilterChip -----
export interface FilterChipProps {
  label: React.ReactNode;
  active?: boolean;
  count?: number;
  onClick?: () => void;
  className?: string;
}
export function FilterChip({ label, active, count, onClick, className = '' }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      } ${className}`}
    >
      {label}
      {count != null ? (
        <span className={`ml-1 rounded-full px-1.5 text-[10px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      ) : null}
    </button>
  );
}
