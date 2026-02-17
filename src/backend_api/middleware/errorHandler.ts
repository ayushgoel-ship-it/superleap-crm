/**
 * Global Error Handler
 * Phase: 6B | Source: docs/API_CONTRACTS.md §0.1 (error response format)
 *
 * Catches unhandled errors and returns them in the standard envelope.
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const statusCode = (err as any).statusCode ?? 500;
  const code = (err as any).code ?? 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.requestId ?? `req-${Date.now()}`,
    },
    error: {
      code,
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.requestId ?? `req-${Date.now()}`,
    },
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
    },
  });
}
