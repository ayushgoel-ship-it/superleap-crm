/**
 * Visits Routes
 * Phase: 6B | Source: docs/API_CONTRACTS.md §4
 *
 * GET /v1/visits            — List visit events (paginated, filtered)
 * GET /v1/visits/:visit_id  — Visit detail
 */

import { Router, Request, Response } from 'express';
import db from '../db';
import { roleFilterForTable } from '../utils/roleConfig';
import { resolveTimeScope } from '../utils/timeScope';
import { sendSuccess, sendError, parsePagination, buildPagination } from '../utils/responseEnvelope';
import { formatDuration, formatTimeIST } from '../utils/formatters';

const router = Router();

// Default geofence threshold in meters
const GEOFENCE_THRESHOLD_M = 100;

/**
 * GET /v1/visits
 * Query params per API_CONTRACTS.md §4.1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const timeScope = (req.query.time_scope as string) || 'last-7d';
    const dateRange = resolveTimeScope(timeScope);

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    // Role filter
    const roleFilter = roleFilterForTable(req.auth, 'visit_events', paramIdx);
    if (roleFilter.clause !== '1=1') {
      conditions.push(`v.${roleFilter.clause}`);
      params.push(...roleFilter.params);
      paramIdx += roleFilter.paramOffset;
    }

    // Time scope
    conditions.push(`v.visit_date >= $${paramIdx}`);
    params.push(dateRange.start_date);
    paramIdx++;
    conditions.push(`v.visit_date <= $${paramIdx}`);
    params.push(dateRange.end_date);
    paramIdx++;

    // Optional filters
    if (req.query.dealer_id) {
      conditions.push(`v.dealer_id = $${paramIdx}`);
      params.push(req.query.dealer_id);
      paramIdx++;
    }
    if (req.query.kam_id) {
      conditions.push(`v.kam_user_id = $${paramIdx}`);
      params.push(req.query.kam_id);
      paramIdx++;
    }
    if (req.query.feedback_status) {
      conditions.push(`v.feedback_status = $${paramIdx}`);
      params.push(req.query.feedback_status);
      paramIdx++;
    }
    if (req.query.is_productive !== undefined) {
      conditions.push(`v.is_productive = $${paramIdx}`);
      params.push(req.query.is_productive === 'true');
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    // Count
    const totalItems = (await db.queryScalar<number>(
      `SELECT COUNT(*) FROM visit_events v WHERE ${whereClause}`, params
    )) ?? 0;

    // Data
    const dataParams = [...params, pageSize, offset];
    const rows = await db.queryAll<any>(
      `SELECT v.*,
              d.name AS dealer_name, d.code AS dealer_code,
              u.name AS kam_name
       FROM visit_events v
       LEFT JOIN dealers d ON v.dealer_id = d.dealer_id
       LEFT JOIN users u ON v.kam_user_id = u.user_id
       WHERE ${whereClause}
       ORDER BY v.visit_date DESC, v.check_in_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams
    );

    // Format per API_CONTRACTS.md §4.1
    const items = rows.map((row: any) => ({
      visit_id: row.visit_id,
      dealer_id: row.dealer_id,
      dealer_name: row.dealer_name,
      dealer_code: row.dealer_code,
      kam_id: row.kam_user_id,
      kam_name: row.kam_name,
      tl_id: row.tl_user_id,
      visit_date: row.visit_date,
      visit_time: formatTimeIST(row.check_in_at),
      visit_type: row.visit_type,
      status: row.status,
      duration: row.completed_at ? formatDuration(row.duration_sec) : (row.status === 'CHECKED_IN' ? 'In Progress' : '0m 0s'),
      duration_sec: row.duration_sec,
      check_in: row.check_in_at ? {
        latitude: row.check_in_lat ? parseFloat(row.check_in_lat) : null,
        longitude: row.check_in_lng ? parseFloat(row.check_in_lng) : null,
        at: row.check_in_at,
      } : null,
      check_out: row.completed_at ? {
        latitude: row.check_out_lat ? parseFloat(row.check_out_lat) : null,
        longitude: row.check_out_lng ? parseFloat(row.check_out_lng) : null,
        at: row.completed_at,
      } : null,
      geofence: {
        distance_from_dealer: row.distance_from_dealer,
        is_within_geofence: row.is_within_geofence,
        threshold: GEOFENCE_THRESHOLD_M,
      },
      is_productive: row.is_productive,
      productivity_source: row.productivity_source,
      outcomes: row.outcomes || [],
      feedback_status: row.feedback_status,
      feedback_submitted_at: row.feedback_submitted_at,
      feedback: row.feedback_data || null,
      kam_comments: row.kam_comments,
      follow_up_tasks: row.follow_up_tasks || [],
    }));

    // Analytics
    const analytics = await db.queryOne<any>(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE is_productive) AS productive,
         ROUND(AVG(duration_sec)) AS avg_duration_sec,
         COUNT(*) FILTER (WHERE visit_type = 'Planned') AS planned,
         COUNT(*) FILTER (WHERE visit_type = 'Unplanned') AS unplanned,
         COUNT(*) FILTER (WHERE is_within_geofence = true) AS within_fence,
         COUNT(*) FILTER (WHERE is_within_geofence = false) AS outside_fence
       FROM visit_events v
       WHERE ${whereClause}`,
      params
    );

    const totalVisits = parseInt(analytics?.total) || 0;
    const productiveVisits = parseInt(analytics?.productive) || 0;
    const withinFence = parseInt(analytics?.within_fence) || 0;
    const outsideFence = parseInt(analytics?.outside_fence) || 0;
    const fenceTotal = withinFence + outsideFence;

    sendSuccess(res, {
      items,
      pagination: buildPagination(page, pageSize, totalItems),
      analytics: {
        total_visits: totalVisits,
        productive_visits: productiveVisits,
        productivity_rate: totalVisits > 0 ? Math.round((productiveVisits / totalVisits) * 1000) / 10 : 0,
        avg_duration: formatDuration(parseInt(analytics?.avg_duration_sec) || 0),
        by_type: {
          Planned: parseInt(analytics?.planned) || 0,
          Unplanned: parseInt(analytics?.unplanned) || 0,
        },
        geofence_compliance: {
          within: withinFence,
          outside: outsideFence,
          compliance_rate: fenceTotal > 0 ? Math.round((withinFence / fenceTotal) * 1000) / 10 : 0,
        },
      },
    }, { time_scope: timeScope, role: req.auth.role });
  } catch (err: any) {
    console.error('[Visits] List error:', err.message);
    sendError(res, 500, 'VISITS_ERROR', 'Failed to fetch visits');
  }
});

/**
 * GET /v1/visits/:visit_id
 * Response per API_CONTRACTS.md §4.2
 */
router.get('/:visit_id', async (req: Request, res: Response) => {
  try {
    const { visit_id } = req.params;

    const row = await db.queryOne<any>(
      `SELECT v.*,
              d.name AS dealer_name, d.code AS dealer_code,
              d.city AS dealer_city, d.segment AS dealer_segment,
              d.address AS dealer_address,
              d.latitude AS dealer_lat, d.longitude AS dealer_lng,
              u.name AS kam_name
       FROM visit_events v
       LEFT JOIN dealers d ON v.dealer_id = d.dealer_id
       LEFT JOIN users u ON v.kam_user_id = u.user_id
       WHERE v.visit_id = $1`,
      [visit_id]
    );

    if (!row) {
      sendError(res, 404, 'NOT_FOUND', `Visit with id '${visit_id}' not found`);
      return;
    }

    // Historical context
    const history = await db.queryOne<any>(
      `SELECT
         COUNT(*) AS previous_visits,
         COUNT(*) FILTER (WHERE is_productive) AS previous_productive
       FROM visit_events
       WHERE dealer_id = $1 AND visit_id != $2`,
      [row.dealer_id, visit_id]
    );

    const lastVisitBefore = await db.queryOne<any>(
      `SELECT visit_date FROM visit_events
       WHERE dealer_id = $1 AND visit_id != $2
       ORDER BY visit_date DESC LIMIT 1`,
      [row.dealer_id, visit_id]
    );

    sendSuccess(res, {
      visit_id: row.visit_id,
      dealer_id: row.dealer_id,
      dealer_name: row.dealer_name,
      dealer_code: row.dealer_code,
      kam_id: row.kam_user_id,
      kam_name: row.kam_name,
      tl_id: row.tl_user_id,
      visit_date: row.visit_date,
      visit_time: formatTimeIST(row.check_in_at),
      visit_type: row.visit_type,
      status: row.status,
      duration: row.completed_at ? formatDuration(row.duration_sec) : (row.status === 'CHECKED_IN' ? 'In Progress' : '0m 0s'),
      duration_sec: row.duration_sec,
      check_in: row.check_in_at ? {
        latitude: row.check_in_lat ? parseFloat(row.check_in_lat) : null,
        longitude: row.check_in_lng ? parseFloat(row.check_in_lng) : null,
        at: row.check_in_at,
      } : null,
      check_out: row.completed_at ? {
        latitude: row.check_out_lat ? parseFloat(row.check_out_lat) : null,
        longitude: row.check_out_lng ? parseFloat(row.check_out_lng) : null,
        at: row.completed_at,
      } : null,
      geofence: {
        distance_from_dealer: row.distance_from_dealer,
        is_within_geofence: row.is_within_geofence,
        threshold: GEOFENCE_THRESHOLD_M,
      },
      is_productive: row.is_productive,
      productivity_source: row.productivity_source,
      outcomes: row.outcomes || [],
      feedback_status: row.feedback_status,
      feedback_submitted_at: row.feedback_submitted_at,
      feedback: row.feedback_data || null,
      kam_comments: row.kam_comments,
      follow_up_tasks: row.follow_up_tasks || [],
      dealer_snapshot: {
        id: row.dealer_id,
        name: row.dealer_name,
        code: row.dealer_code,
        city: row.dealer_city,
        segment: row.dealer_segment,
        address: row.dealer_address,
        latitude: row.dealer_lat ? parseFloat(row.dealer_lat) : null,
        longitude: row.dealer_lng ? parseFloat(row.dealer_lng) : null,
      },
      historical_context: {
        previous_visits: parseInt(history?.previous_visits) || 0,
        previous_productive_visits: parseInt(history?.previous_productive) || 0,
        days_since_last_visit: lastVisitBefore?.visit_date
          ? Math.floor((Date.now() - new Date(lastVisitBefore.visit_date).getTime()) / 86400000)
          : null,
      },
      productivity_evidence: {
        type: row.productivity_source,
        reason: row.is_productive
          ? row.is_within_geofence
            ? 'Within geofence, sufficient duration'
            : `Productive — source: ${row.productivity_source}`
          : 'Not marked as productive',
        auto_approved: row.productivity_source === 'Geofence' && row.is_within_geofence,
      },
    });
  } catch (err: any) {
    console.error('[Visits] Detail error:', err.message);
    sendError(res, 500, 'VISITS_ERROR', 'Failed to fetch visit detail');
  }
});

export default router;
