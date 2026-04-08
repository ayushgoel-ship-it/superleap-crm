/**
 * useUrlState — tiny hook to sync a React state value with a URL query param.
 *
 * No router dependency; operates on window.location + history.replaceState so
 * filter changes don't pollute browser history, but the current URL is
 * shareable / restorable on back-nav.
 *
 * Usage:
 *   const [channel, setChannel] = useUrlState<ChannelKey>('ch', 'all');
 */

import { useEffect, useRef, useState } from 'react';

function readParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

function writeParam(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (value == null || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    window.history.replaceState(null, '', url.toString());
  } catch {
    /* no-op */
  }
}

export function useUrlState<T extends string>(
  key: string,
  initial: T,
  opts?: { serialize?: (v: T) => string; deserialize?: (raw: string) => T },
): [T, (v: T) => void] {
  const serialize = opts?.serialize ?? ((v: T) => String(v));
  const deserialize = opts?.deserialize ?? ((raw: string) => raw as T);

  const [value, setValue] = useState<T>(() => {
    const raw = readParam(key);
    return raw != null ? deserialize(raw) : initial;
  });

  const keyRef = useRef(key);
  useEffect(() => {
    const s = serialize(value);
    writeParam(keyRef.current, s === serialize(initial) ? null : s);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return [value, setValue];
}
