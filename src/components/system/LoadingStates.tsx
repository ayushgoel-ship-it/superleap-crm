/**
 * @deprecated Phase 2 — This entire file is deprecated.
 * Use the canonical components instead:
 *   - Loading skeletons: /components/premium/SkeletonLoader.tsx (PageSkeleton, ListSkeleton, CardSkeleton, etc.)
 *   - Empty states:      /components/premium/EmptyState.tsx (EmptyState, InlineEmpty)
 *   - Loading hook:       /components/premium/SkeletonLoader.tsx (useLoadingState)
 *
 * This file MUST NOT be imported anywhere. It is retained for reference only.
 *
 * LOADING, EMPTY & FAILURE STATES (Legacy)
 * 
 * Reusable system components — restyled for premium Sales Cockpit.
 * For new code, prefer importing directly from /components/premium/EmptyState and SkeletonLoader.
 * This file is kept for backward compatibility.
 */

import { ReactNode, ComponentType } from 'react';
import { Loader2, AlertCircle, Inbox, RefreshCw, Home } from 'lucide-react';
import { Skeleton, CardSkeleton } from '../premium/SkeletonLoader';

/**
 * Loading Skeleton - Premium card loader
 */
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 p-4 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Loading Spinner - Centered spinner
 */
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <p className="text-[13px] text-slate-500 font-medium">{message}</p>
    </div>
  );
}

/**
 * Full Page Loading - For initial page loads
 */
export function FullPageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-[13px] text-slate-500 font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * Empty State (Legacy wrapper)
 * For new code, use the premium EmptyState from /components/premium/EmptyState.tsx
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description,
  action,
  actionLabel = 'Get Started',
  onAction
}: {
  icon?: any;
  title?: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 ring-4 ring-slate-50 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      
      <h3 className="text-[15px] font-semibold text-slate-800 mb-1.5">{title}</h3>
      
      {description && (
        <p className="text-[13px] text-slate-500 mb-5 max-w-[280px] leading-relaxed">{description}</p>
      )}
      
      {action || (onAction && (
        <button
          onClick={onAction}
          className="px-5 py-3 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl
                     hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150
                     min-h-[44px] shadow-sm shadow-indigo-200"
        >
          {actionLabel}
        </button>
      ))}
    </div>
  );
}

/**
 * Error State - Premium styled
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn\u2019t load this data. Please try again.',
  errorCode,
  onRetry,
  onGoHome
}: {
  title?: string;
  description?: string;
  errorCode?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 ring-4 ring-rose-100 flex items-center justify-center mb-5">
        <AlertCircle className="w-7 h-7 text-rose-500" />
      </div>
      
      <h3 className="text-[15px] font-semibold text-slate-800 mb-1.5">{title}</h3>
      <p className="text-[13px] text-slate-500 mb-4 max-w-[280px] leading-relaxed">{description}</p>
      
      {errorCode && (
        <div className="bg-slate-100 rounded-xl px-3 py-1.5 mb-5">
          <p className="text-[11px] text-slate-400 font-mono">Ref: {errorCode}</p>
        </div>
      )}
      
      <div className="flex gap-2.5 w-full max-w-[280px]">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl
                       hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}
        
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-600 text-[13px] font-medium rounded-xl
                       border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Card Loading Skeleton
 */
export function CardLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * List Loading Skeleton
 */
export function ListLoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-premium p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-16 h-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table Loading Skeleton
 */
export function TableLoadingSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 animate-fade-in">
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton key={j} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Metric Card Loading Skeleton
 */
export function MetricCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-premium p-4">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}