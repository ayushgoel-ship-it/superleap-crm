/**
 * Error reporter abstraction.
 *
 * A thin, zero-dependency facade over an external error tracker
 * (Sentry, DataDog, Bugsnag, ...). We keep the integration lazy and
 * optional so the bundle doesn't pay for an SDK until ops wires one up.
 *
 * How to wire Sentry (or equivalent) later:
 *   1. `npm i @sentry/react` (or your SDK of choice)
 *   2. In `src/main.tsx`, before `ReactDOM.createRoot(...)`:
 *        import * as Sentry from '@sentry/react';
 *        Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, ... });
 *        setErrorReporter({
 *          captureException: (err, ctx) =>
 *            Sentry.captureException(err, { extra: ctx }),
 *        });
 *   3. Everything that already calls `reportError(...)` will now
 *      reach Sentry without further changes.
 *
 * Until a real reporter is registered, `reportError` is a no-op in
 * prod and a `console.error` in dev/staging — the global
 * ErrorBoundary already logs via the app logger, so nothing is lost.
 */
import { ENV, logger } from '../../config/env';

export interface ErrorReporter {
  captureException(error: Error, context?: Record<string, unknown>): void;
}

let activeReporter: ErrorReporter | null = null;

export function setErrorReporter(reporter: ErrorReporter): void {
  activeReporter = reporter;
  logger.info('errorReporter: external sink registered');
}

export function reportError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (activeReporter) {
    try {
      activeReporter.captureException(error, context);
      return;
    } catch (sinkErr) {
      // Never let the reporter crash the caller.
      logger.warn('errorReporter sink threw', sinkErr);
    }
  }

  if (!ENV.IS_PROD) {
    logger.error('[reportError:fallback]', error, context);
  }
}
