/**
 * FEEDBACK RETRY QUEUE — Lightweight offline-resilient queue for failed feedback submissions.
 *
 * Stores pending items in localStorage. Retries on:
 *   - Window online event
 *   - Document visibility change (app resume)
 *   - Manual flush call
 *
 * Each item: { id, type, interactionId, payload, retryCount, queuedAt }
 * Max 3 retries per item. After that, it stays as "failed" for manual resolution.
 */

import * as visitApi from '../api/visit.api';

// ── Types ──

export type QueueItemType = 'visit-photo' | 'visit-feedback' | 'call-register' | 'call-feedback';

export interface QueueItem {
  id: string;
  type: QueueItemType;
  interactionId: string;       // visitId or callId
  payload: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  queuedAt: string;
  lastAttemptAt: string | null;
  status: 'queued' | 'retrying' | 'failed';
}

const STORAGE_KEY = 'superleap:feedback-retry-queue';
const MAX_RETRIES = 3;

// ── Storage helpers ──

function loadQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(items: QueueItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[RetryQueue] Failed to save queue:', err);
  }
}

// ── Public API ──

/** Enqueue a failed submission for retry */
export function enqueue(type: QueueItemType, interactionId: string, payload: Record<string, any>): QueueItem {
  const item: QueueItem = {
    id: `rq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    interactionId,
    payload,
    retryCount: 0,
    maxRetries: MAX_RETRIES,
    queuedAt: new Date().toISOString(),
    lastAttemptAt: null,
    status: 'queued',
  };

  const queue = loadQueue();
  // Deduplicate: remove existing item for same interaction+type
  const filtered = queue.filter(q => !(q.interactionId === interactionId && q.type === type));
  filtered.push(item);
  saveQueue(filtered);

  console.log(`[RetryQueue] Enqueued ${type} for ${interactionId} (queue size: ${filtered.length})`);
  return item;
}

/** Remove a specific item (e.g., after manual resolution) */
export function dequeue(itemId: string): void {
  const queue = loadQueue();
  saveQueue(queue.filter(q => q.id !== itemId));
}

/** Remove all items for a specific interaction */
export function dequeueByInteraction(interactionId: string): void {
  const queue = loadQueue();
  saveQueue(queue.filter(q => q.interactionId !== interactionId));
}

/** Get all pending queue items */
export function getPending(): QueueItem[] {
  return loadQueue().filter(q => q.status !== 'failed');
}

/** Get count of pending items */
export function getPendingCount(): number {
  return getPending().length;
}

/** Get all items including failed */
export function getAll(): QueueItem[] {
  return loadQueue();
}

/** Clear all failed items */
export function clearFailed(): void {
  const queue = loadQueue();
  saveQueue(queue.filter(q => q.status !== 'failed'));
}

/** Clear entire queue */
export function clearAll(): void {
  saveQueue([]);
}

// ── Retry executor ──

async function executeItem(item: QueueItem): Promise<boolean> {
  try {
    switch (item.type) {
      case 'visit-photo':
        await visitApi.uploadVisitPhoto(
          item.interactionId,
          item.payload.base64Data,
          item.payload.photoType,
          item.payload.mimeType,
        );
        return true;

      case 'visit-feedback':
        await visitApi.submitVisitFeedback(item.interactionId, item.payload);
        return true;

      case 'call-register':
        await visitApi.registerCall(item.payload as any);
        return true;

      case 'call-feedback':
        await visitApi.submitCallFeedback(item.interactionId, item.payload);
        return true;

      default:
        console.warn(`[RetryQueue] Unknown item type: ${item.type}`);
        return false;
    }
  } catch (err: any) {
    console.error(`[RetryQueue] Retry failed for ${item.type}/${item.interactionId}: ${err.message}`);
    return false;
  }
}

/** Flush the queue — retry all pending items */
export async function flush(): Promise<{ succeeded: number; failed: number; remaining: number }> {
  const queue = loadQueue();
  const pending = queue.filter(q => q.status !== 'failed');

  if (pending.length === 0) {
    return { succeeded: 0, failed: 0, remaining: 0 };
  }

  console.log(`[RetryQueue] Flushing ${pending.length} pending items...`);
  let succeeded = 0;
  let failed = 0;

  for (const item of pending) {
    item.status = 'retrying';
    item.lastAttemptAt = new Date().toISOString();
    item.retryCount++;

    const ok = await executeItem(item);

    if (ok) {
      succeeded++;
      // Remove from queue
      const idx = queue.findIndex(q => q.id === item.id);
      if (idx >= 0) queue.splice(idx, 1);
    } else {
      failed++;
      if (item.retryCount >= item.maxRetries) {
        item.status = 'failed';
        console.warn(`[RetryQueue] Item ${item.id} exceeded max retries — marked as failed`);
      } else {
        item.status = 'queued';
      }
    }
  }

  saveQueue(queue);
  const remaining = queue.filter(q => q.status !== 'failed').length;
  console.log(`[RetryQueue] Flush complete: ${succeeded} succeeded, ${failed} failed, ${remaining} remaining`);
  return { succeeded, failed, remaining };
}

// ── Auto-retry listeners ──

let listenersAttached = false;

export function startAutoRetry(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  // Retry when coming back online
  window.addEventListener('online', () => {
    console.log('[RetryQueue] Online — flushing queue');
    flush();
  });

  // Retry when app resumes (tab becomes visible)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const pending = getPendingCount();
      if (pending > 0) {
        console.log(`[RetryQueue] App resumed — flushing ${pending} pending items`);
        flush();
      }
    }
  });

  // Initial flush if any items exist
  const pending = getPendingCount();
  if (pending > 0) {
    console.log(`[RetryQueue] Init — found ${pending} pending items, flushing...`);
    setTimeout(() => flush(), 2000); // Delay to let app settle
  }
}
