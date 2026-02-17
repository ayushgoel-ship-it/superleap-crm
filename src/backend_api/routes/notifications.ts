/**
 * Notifications Routes
 * Phase: 6B | Source: docs/API_CONTRACTS.md §6
 *
 * GET /v1/notifications — List user notifications
 */

import { Router, Request, Response } from 'express';
import db from '../db';
import { sendSuccess, sendError, parsePagination, buildPagination } from '../utils/responseEnvelope';

const router = Router();

/**
 * GET /v1/notifications
 * Response per API_CONTRACTS.md §6.1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const userId = req.auth.user_id;

    // Count total
    const totalItems = (await db.queryScalar<number>(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1`,
      [userId]
    )) ?? 0;

    // Unread count
    const unreadCount = (await db.queryScalar<number>(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    )) ?? 0;

    // Data
    const rows = await db.queryAll<any>(
      `SELECT notification_id, type, priority, title, body, data, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageSize, offset]
    );

    const items = rows.map((row: any) => ({
      notification_id: row.notification_id,
      type: row.type,
      priority: row.priority,
      title: row.title,
      body: row.body,
      data: row.data || {},
      read: row.read_at != null,
      created_at: row.created_at,
    }));

    sendSuccess(res, {
      items,
      pagination: buildPagination(page, pageSize, totalItems),
      unread_count: unreadCount,
    });
  } catch (err: any) {
    console.error('[Notifications] Error:', err.message);
    sendError(res, 500, 'NOTIFICATIONS_ERROR', 'Failed to fetch notifications');
  }
});

export default router;
