/**
 * PERFORMANCE GUARDRAILS
 * 
 * Utilities to prevent performance issues:
 * - Detect excessive re-renders
 * - Warn about expensive operations in dev
 * - Provide memoization helpers
 */

import { useEffect, useRef, DependencyList } from 'react';
import { ENV, logger } from '../config/env';

/**
 * Track component render count (dev only)
 */
export function useRenderCount(componentName: string, warnThreshold = 10) {
  const renderCount = useRef(0);
  const lastWarnTime = useRef(0);
  
  useEffect(() => {
    if (!ENV.ENABLE_DEV_WARNINGS) return;
    
    renderCount.current += 1;
    
    // Warn if too many renders in short time
    const now = Date.now();
    if (renderCount.current > warnThreshold && now - lastWarnTime.current > 1000) {
      logger.warn(`⚠️ ${componentName} has rendered ${renderCount.current} times`, {
        componentName,
        renderCount: renderCount.current
      });
      lastWarnTime.current = now;
    }
  });
  
  return renderCount.current;
}

/**
 * Detect why component re-rendered (dev only)
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();
  
  useEffect(() => {
    if (!ENV.ENABLE_DEV_WARNINGS) return;
    
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length > 0) {
        logger.debug(`[Why-Did-Update] ${name}:`, changedProps);
      }
    }
    
    previousProps.current = props;
  });
}

/**
 * Measure hook performance (dev only)
 */
export function useMeasurePerformance(hookName: string) {
  const startTime = useRef(0);
  
  useEffect(() => {
    if (!ENV.ENABLE_PERFORMANCE_MONITORING && !ENV.IS_DEV) return;
    
    startTime.current = performance.now();
    
    return () => {
      const duration = performance.now() - startTime.current;
      
      if (duration > 16.67) { // More than one frame (60fps)
        logger.warn(`⚠️ ${hookName} took ${duration.toFixed(2)}ms (slow)`, {
          hookName,
          duration
        });
      }
    };
  });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, waitMs);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/**
 * Memoization helper with size limit
 */
export function memoizeWithLimit<T extends (...args: any[]) => any>(
  func: T,
  maxCacheSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    
    // Limit cache size
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Warn if dependency array is too large
 */
export function validateDependencies(
  hookName: string,
  deps: DependencyList | undefined,
  maxSize = 10
) {
  if (!ENV.ENABLE_DEV_WARNINGS) return;
  
  if (deps && deps.length > maxSize) {
    logger.warn(`⚠️ ${hookName} has ${deps.length} dependencies (max recommended: ${maxSize})`, {
      hookName,
      depsCount: deps.length
    });
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.error('JSON parse failed, using fallback', { json, error });
    return fallback;
  }
}

/**
 * Safe localStorage operations
 */
export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const prefixedKey = `${ENV.STORAGE_PREFIX}${key}`;
      const item = localStorage.getItem(prefixedKey);
      
      if (item === null) return fallback;
      
      return JSON.parse(item);
    } catch (error) {
      logger.error('localStorage.get failed', { key, error });
      return fallback;
    }
  },
  
  set<T>(key: string, value: T): boolean {
    try {
      const prefixedKey = `${ENV.STORAGE_PREFIX}${key}`;
      localStorage.setItem(prefixedKey, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('localStorage.set failed', { key, error });
      
      // Check for quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.error('localStorage quota exceeded - clearing old data');
        // Could implement LRU cleanup here
      }
      
      return false;
    }
  },
  
  remove(key: string): boolean {
    try {
      const prefixedKey = `${ENV.STORAGE_PREFIX}${key}`;
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      logger.error('localStorage.remove failed', { key, error });
      return false;
    }
  },
  
  clear(): boolean {
    try {
      // Only clear items with our prefix
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(ENV.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      logger.error('localStorage.clear failed', error);
      return false;
    }
  }
};

/**
 * Batch state updates to prevent multiple re-renders
 */
export function batchUpdates<T>(updates: Array<() => void>): void {
  // In React 18+, updates are automatically batched
  // This is a placeholder for explicit batching if needed
  updates.forEach(update => update());
}

/**
 * Lazy load heavy computation
 */
export function lazyCompute<T>(
  computeFn: () => T,
  deps: DependencyList
): T | null {
  const resultRef = useRef<T | null>(null);
  const depsRef = useRef<DependencyList>(deps);
  
  // Check if deps changed
  const depsChanged = !depsRef.current.every((dep, i) => dep === deps[i]);
  
  if (depsChanged || resultRef.current === null) {
    resultRef.current = computeFn();
    depsRef.current = deps;
  }
  
  return resultRef.current;
}

/**
 * Virtual scroll helper (basic implementation)
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const scrollTop = useRef(0);
  
  const visibleStart = Math.floor(scrollTop.current / itemHeight);
  const visibleEnd = Math.min(
    items.length,
    Math.ceil((scrollTop.current + containerHeight) / itemHeight)
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop: (top: number) => {
      scrollTop.current = top;
    }
  };
}

/**
 * Performance marks (production monitoring)
 */
export const perfMarks = {
  start(label: string) {
    if (ENV.ENABLE_PERFORMANCE_MONITORING && typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  },
  
  end(label: string) {
    if (ENV.ENABLE_PERFORMANCE_MONITORING && typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      
      try {
        performance.measure(label, `${label}-start`, `${label}-end`);
        
        const measure = performance.getEntriesByName(label)[0];
        if (measure && measure.duration > 1000) {
          logger.warn(`Performance: ${label} took ${measure.duration.toFixed(2)}ms`);
        }
      } catch (error) {
        // Measurement not available
      }
    }
  }
};
