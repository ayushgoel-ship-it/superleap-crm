/**
 * Calls Routes
 * Phase: 6B | Source: docs/API_CONTRACTS.md §3
 *
 * GET /v1/calls           — List call events (paginated, filtered)
 * GET /v1/calls/:call_id  — Call detail
 */

import { Router, Request, Response } from 'express';
import db from '../db';
import { roleFilterForTable } from '../utils/roleConfig';
import { resolveTimeScope } from '../utils/timeScope';
import { sendSuccess, sendError, parsePagination, buildPagination } from '../utils/responseEnvelope';
import { formatDuration, formatTimeIST } from '../utils/formatters';

const router = Router();

/**
 * GET /v1/calls
 * Query params per API_CONTRACTS.md §3.1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const timeScope = (req.query.time_scope as string) || 'last-7d';
    const dateRange = resolveTimeScope(timeScope);

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    // Role-based filter
    const roleFilter = roleFilterForTable(req.auth, 'call_events', paramIdx);
    if (roleFilter.clause !== '1=1') {
      conditions.push(`c.${roleFilter.clause}`);
      params.push(...roleFilter.params);
      paramIdx += roleFilter.paramOffset;
    }

    // Time scope
    conditions.push(`c.call_date >= $${paramIdx}`);
    params.push(dateRange.start_date);
    paramIdx++;
    conditions.push(`c.call_date <= $${paramIdx}`);
    params.push(dateRange.end_date);
    paramIdx++;

    // Optional filters
    if (req.query.dealer_id) {
      conditions.push(`c.dealer_id = $${paramIdx}`);
      params.push(req.query.dealer_id);
      paramIdx++;
    }
    if (req.query.kam_id) {
      conditions.push(`c.kam_user_id = $${paramIdx}`);
      params.push(req.query.kam_id);
      paramIdx++;
    }
    if (req.query.feedback_status) {
      conditions.push(`c.feedback_status = $${paramIdx}`);
      params.push(req.query.feedback_status);
      paramIdx++;
    }
    if (req.query.is_productive !== undefined) {
      conditions.push(`c.is_productive = $${paramIdx}`);
      params.push(req.query.is_productive === 'true');
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    // Count
    const totalItems = (await db.queryScalar<number>(
      `SELECT COUNT(*) FROM call_events c WHERE ${whereClause}`, params
    )) ?? 0;

    // Data
    const dataParams = [...params, pageSize, offset];
    const rows = await db.queryAll<any>(
      `SELECT c.*,
              d.name AS dealer_name, d.code AS dealer_code,
              u.name AS kam_name
       FROM call_events c
       LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
       LEFT JOIN users u ON c.kam_user_id = u.user_id
       WHERE ${whereClause}
       ORDER BY c.call_date DESC, c.call_start_time DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams
    );

    // Format items per API_CONTRACTS.md §3.1
    const items = rows.map((row: any) => ({
      call_id: row.call_id,
      dealer_id: row.dealer_id,
      dealer_name: row.dealer_name,
      dealer_code: row.dealer_code,
      kam_id: row.kam_user_id,
      kam_name: row.kam_name,
      tl_id: row.tl_user_id,
      phone: row.phone,
      call_date: row.call_date,
      call_time: formatTimeIST(row.call_start_time),
      call_start_time: row.call_start_time,
      call_end_time: row.call_end_time,
      duration: formatDuration(row.duration_sec),
      duration_sec: row.duration_sec,
      call_status: row.call_status,
      outcome: row.outcome,
      is_productive: row.is_productive,
      productivity_source: row.productivity_source,
      recording_status: row.recording_status,
      recording_url: row.recording_url,
      sentiment_score: row.sentiment_score ? parseFloat(row.sentiment_score) : null,
      sentiment_label: row.sentiment_label,
      auto_tags: row.auto_tags || [],
      feedback_status: row.feedback_status,
      feedback_submitted_at: row.feedback_submitted_at,
      feedback: row.feedback_data || null,
      tl_review: row.tl_review || null,
      kam_comments: row.kam_comments,
      follow_up_tasks: row.follow_up_tasks || [],
    }));

    // Analytics
    const analytics = await db.queryOne<any>(
      `SELECT
         COUNT(*) AS total_calls,
         COUNT(*) FILTER (WHERE is_productive) AS productive_calls,
         ROUND(AVG(duration_sec)) AS avg_duration_sec,
         COUNT(*) FILTER (WHERE outcome = 'Connected') AS connected,
         COUNT(*) FILTER (WHERE outcome = 'No Answer') AS no_answer,
         COUNT(*) FILTER (WHERE outcome = 'Busy') AS busy,
         COUNT(*) FILTER (WHERE outcome = 'Left VM') AS left_vm,
         COUNT(*) FILTER (WHERE sentiment_label = 'Positive') AS positive,
         COUNT(*) FILTER (WHERE sentiment_label = 'Neutral') AS neutral,
         COUNT(*) FILTER (WHERE sentiment_label = 'Negative') AS negative
       FROM call_events c
       WHERE ${whereClause}`,
      params
    );

    const totalCalls = parseInt(analytics?.total_calls) || 0;
    const productiveCalls = parseInt(analytics?.productive_calls) || 0;

    sendSuccess(res, {
      items,
      pagination: buildPagination(page, pageSize, totalItems),
      analytics: {
        total_calls: totalCalls,
        productive_calls: productiveCalls,
        productivity_rate: totalCalls > 0 ? Math.round((productiveCalls / totalCalls) * 1000) / 10 : 0,
        avg_duration: formatDuration(parseInt(analytics?.avg_duration_sec) || 0),
        by_outcome: {
          Connected: parseInt(analytics?.connected) || 0,
          'No Answer': parseInt(analytics?.no_answer) || 0,
          Busy: parseInt(analytics?.busy) || 0,
          'Left VM': parseInt(analytics?.left_vm) || 0,
        },
        by_sentiment: {
          Positive: parseInt(analytics?.positive) || 0,
          Neutral: parseInt(analytics?.neutral) || 0,
          Negative: parseInt(analytics?.negative) || 0,
        },
      },
    }, { time_scope: timeScope, role: req.auth.role });
  } catch (err: any) {
    console.error('[Calls] List error:', err.message);
    sendError(res, 500, 'CALLS_ERROR', 'Failed to fetch calls');
  }
});

/**
 * GET /v1/calls/:call_id
 * Response per API_CONTRACTS.md §3.2
 */
router.get('/:call_id', async (req: Request, res: Response) => {
  try {
    const { call_id } = req.params;

    const row = await db.queryOne<any>(
      `SELECT c.*,
              d.name AS dealer_name, d.code AS dealer_code,
              d.city AS dealer_city, d.segment AS dealer_segment,
              d.phone AS dealer_phone,
              u.name AS kam_name
       FROM call_events c
       LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
       LEFT JOIN users u ON c.kam_user_id = u.user_id
       WHERE c.call_id = $1`,
      [call_id]
    );

    if (!row) {
      sendError(res, 404, 'NOT_FOUND', `Call with id '${call_id}' not found`);
      return;
    }

    // Historical context
    const history = await db.queryOne<any>(
      `SELECT
         COUNT(*) AS previous_calls,
         COUNT(*) FILTER (WHERE is_productive) AS previous_productive
       FROM call_events
       WHERE dealer_id = $1 AND call_id != $2`,
      [row.dealer_id, call_id]
    );

    const lastCallBefore = await db.queryOne<any>(
      `SELECT call_date FROM call_events
       WHERE dealer_id = $1 AND call_id != $2
       ORDER BY call_date DESC LIMIT 1`,
      [row.dealer_id, call_id]
    );

    sendSuccess(res, {
      call_id: row.call_id,
      dealer_id: row.dealer_id,
      dealer_name: row.dealer_name,
      dealer_code: row.dealer_code,
      kam_id: row.kam_user_id,
      kam_name: row.kam_name,
      tl_id: row.tl_user_id,
      phone: row.phone,
      call_date: row.call_date,
      call_time: formatTimeIST(row.call_start_time),
      call_start_time: row.call_start_time,
      call_end_time: row.call_end_time,
      duration: formatDuration(row.duration_sec),
      duration_sec: row.duration_sec,
      call_status: row.call_status,
      outcome: row.outcome,
      is_productive: row.is_productive,
      productivity_source: row.productivity_source,
      recording_status: row.recording_status,
      recording_url: row.recording_url,
      transcript: row.transcript,
      sentiment_score: row.sentiment_score ? parseFloat(row.sentiment_score) : null,
      sentiment_label: row.sentiment_label,
      auto_tags: row.auto_tags || [],
      feedback_status: row.feedback_status,
      feedback_submitted_at: row.feedback_submitted_at,
      feedback: row.feedback_data || null,
      tl_review: row.tl_review || null,
      kam_comments: row.kam_comments,
      follow_up_tasks: row.follow_up_tasks || [],
      dealer_snapshot: {
        id: row.dealer_id,
        name: row.dealer_name,
        code: row.dealer_code,
        city: row.dealer_city,
        segment: row.dealer_segment,
        phone: row.dealer_phone,
      },
      historical_context: {
        previous_calls: parseInt(history?.previous_calls) || 0,
        previous_productive_calls: parseInt(history?.previous_productive) || 0,
        days_since_last_call: lastCallBefore?.call_date
          ? Math.floor((Date.now() - new Date(lastCallBefore.call_date).getTime()) / 86400000)
          : null,
      },
      productivity_evidence: {
        type: row.productivity_source,
        reason: row.is_productive
          ? `Productive — source: ${row.productivity_source}`
          : 'Not marked as productive',
        confidence: row.sentiment_score ? parseFloat(row.sentiment_score) : null,
        tags: row.auto_tags || [],
      },
    });
  } catch (err: any) {
    console.error('[Calls] Detail error:', err.message);
    sendError(res, 500, 'CALLS_ERROR', 'Failed to fetch call detail');
  }
});

export default router;
