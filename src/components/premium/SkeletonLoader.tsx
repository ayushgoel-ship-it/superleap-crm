/**
 * Premium Skeleton Loader System
 * Provides shimmer loading states for cards, lists, metrics, and page sections
 */

import { useState, useCallback } from 'react';

// ── Base Skeleton ──
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-shimmer rounded-lg ${className}`} />
  );
}

// ── Card Skeleton (dealer/lead card) ──
export function CardSkeleton() {
  return (
    <div className="card-premium p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

// ── Dealer Card Skeleton (more detailed) ──
export function DealerCardSkeleton() {
  return (
    <div className="card-premium p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="w-4 h-4 rounded" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-2.5 w-8 mx-auto" />
            <Skeleton className="h-4 w-6 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-11 rounded-xl" />
        <Skeleton className="flex-1 h-11 rounded-xl" />
      </div>
    </div>
  );
}

// ── Metric Card Skeleton ──
export function MetricSkeleton() {
  return (
    <div className="card-premium p-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

// ── Lead Card Skeleton ──
export function LeadCardSkeleton() {
  return (
    <div className="card-premium p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-10 rounded-md" />
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-18 rounded-full" />
      </div>
    </div>
  );
}

// ── Activity Item Skeleton ──
export function ActivitySkeleton() {
  return (
    <div className="card-premium p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="w-12 h-4" />
      </div>
    </div>
  );
}

// ── Filter Bar Skeleton ──
export function FilterBarSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-16 rounded-xl flex-shrink-0" />
      ))}
    </div>
  );
}

// ── Search Bar Skeleton ──
export function SearchBarSkeleton() {
  return (
    <Skeleton className="h-10 w-full rounded-xl" />
  );
}

// ── Stats Row Skeleton ──
export function StatsRowSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <MetricSkeleton key={i} />
      ))}
    </div>
  );
}

// ── List Skeleton (multiple cards) ──
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Full Page Skeleton (header + filters + list) ──
export function PageSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>
      <StatsRowSkeleton count={2} />
      <SearchBarSkeleton />
      <FilterBarSkeleton />
      <ListSkeleton count={3} />
    </div>
  );
}

// ── Loading State Hook ──
export type LoadingPhase = 'idle' | 'loading' | 'loaded' | 'error';

interface UseLoadingStateReturn {
  phase: LoadingPhase;
  isLoading: boolean;
  isError: boolean;
  isLoaded: boolean;
  startLoading: () => void;
  setLoaded: () => void;
  setError: () => void;
  reset: () => void;
}

/**
 * Hook for consistent loading state management.
 * Use this across all pages that will eventually integrate with APIs.
 *
 * Example:
 * ```
 * const loading = useLoadingState();
 * if (loading.isLoading) return <PageSkeleton />;
 * if (loading.isError) return <EmptyState variant="error" onRetry={loading.reset} />;
 * ```
 */
export function useLoadingState(initial: LoadingPhase = 'loaded'): UseLoadingStateReturn {
  const [phase, setPhase] = useState<LoadingPhase>(initial);

  return {
    phase,
    isLoading: phase === 'loading',
    isError: phase === 'error',
    isLoaded: phase === 'loaded',
    startLoading: useCallback(() => setPhase('loading'), []),
    setLoaded: useCallback(() => setPhase('loaded'), []),
    setError: useCallback(() => setPhase('error'), []),
    reset: useCallback(() => setPhase('idle'), []),
  };
}
