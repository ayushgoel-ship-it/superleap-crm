/**
 * Standard Response Envelope
 * Phase: 6B | Source: docs/API_CONTRACTS.md §0.1
 *
 * All responses wrapped in: { success, data, meta, error }
 */

import { Request, Response } from 'express';
import { AuthContext } from './roleConfig';

interface Meta {
  timestamp: string;
  request_id: string;
  time_scope?: string;
  role?: string;
}

/**
 * Send a successful response in the standard envelope.
 */
export function sendSuccess(
  res: Response,
  data: any,
  extra?: {
    time_scope?: string;
    role?: string;
  }
): void {
  const meta: Meta = {
    timestamp: new Date().toISOString(),
    request_id: (res.req as any)?.requestId || `req-${Date.now()}`,
    ...(extra?.time_scope && { time_scope: extra.time_scope }),
    ...(extra?.role && { role: extra.role }),
  };

  res.json({
    success: true,
    data,
    meta,
    error: null,
  });
}

/**
 * Send an error response in the standard envelope.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string
): void {
  const meta: Meta = {
    timestamp: new Date().toISOString(),
    request_id: (res.req as any)?.requestId || `req-${Date.now()}`,
  };

  res.status(statusCode).json({
    success: false,
    data: null,
    meta,
    error: { code, message },
  });
}

/**
 * Pagination helper — computes pagination metadata.
 * Source: API_CONTRACTS.md §0.2
 */
export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
}

export function buildPagination(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    page,
    page_size: pageSize,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: page < totalPages,
  };
}

/**
 * Parse pagination params from query string.
 */
export function parsePagination(query: any): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.page_size, 10) || 20));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}
