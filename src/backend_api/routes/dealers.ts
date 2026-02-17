/**
 * Dealers Routes
 * Phase: 6B | Source: docs/API_CONTRACTS.md §2
 *
 * GET /v1/dealers             — List dealers (paginated, filtered)
 * GET /v1/dealers/:dealer_id  — Dealer detail (360 view)
 */

import { Router, Request, Response } from 'express';
import db from '../db';
import { roleFilterForTable, getEffectiveContext } from '../utils/roleConfig';
import { resolveTimeScope } from '../utils/timeScope';
import { sendSuccess, sendError, parsePagination, buildPagination } from '../utils/responseEnvelope';
import { daysSinceLabel, daysOld } from '../utils/formatters';

const router = Router();

/**
 * GET /v1/dealers
 * Query params per API_CONTRACTS.md §2.1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const timeScope = (req.query.time_scope as string) || 'mtd';
    const dateRange = resolveTimeScope(timeScope);

    const conditions: string[] = ['d.deleted_at IS NULL'];
    const params: any[] = [];
    let paramIdx = 1;

    // Role-based filter
    const roleFilter = roleFilterForTable(req.auth, 'dealers', paramIdx);
    if (roleFilter.clause !== '1=1') {
      conditions.push(`d.${roleFilter.clause}`);
      params.push(...roleFilter.params);
      paramIdx += roleFilter.paramOffset;
    }

    // Optional filters
    if (req.query.segment) {
      conditions.push(`d.segment = $${paramIdx}`);
      params.push(req.query.segment);
      paramIdx++;
    }
    if (req.query.status) {
      conditions.push(`d.status = $${paramIdx}`);
      params.push(req.query.status);
      paramIdx++;
    }
    if (req.query.tag) {
      conditions.push(`$${paramIdx} = ANY(d.tags)`);
      params.push(req.query.tag);
      paramIdx++;
    }
    if (req.query.search) {
      conditions.push(`(d.name ILIKE $${paramIdx} OR d.code ILIKE $${paramIdx} OR d.city ILIKE $${paramIdx})`);
      params.push(`%${req.query.search}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    // Count
    const totalItems = (await db.queryScalar<number>(
      `SELECT COUNT(*) FROM dealers d WHERE ${whereClause}`, params
    )) ?? 0;

    // Data query with inline metrics
    const dateParams = [dateRange.start_date, dateRange.end_date];
    const dataParams = [...params, ...dateParams, pageSize, offset];
    const dateStartIdx = paramIdx;
    const dateEndIdx = paramIdx + 1;

    const rows = await db.queryAll<any>(
      `SELECT d.*,
              u.name AS kam_name,
              -- Inline metric subqueries for list view
              (SELECT COUNT(*) FROM leads l
               WHERE l.dealer_id = d.dealer_id AND l.deleted_at IS NULL
                 AND l.created_at >= $${dateStartIdx} AND l.created_at <= $${dateEndIdx}
              ) AS leads_count,
              (SELECT COUNT(*) FROM leads l
               WHERE l.dealer_id = d.dealer_id AND l.deleted_at IS NULL
                 AND l.stage IN ('Inspection Scheduled', 'Inspection Done', 'Stock-in')
                 AND l.inspection_date >= $${dateStartIdx} AND l.inspection_date <= $${dateEndIdx}
              ) AS inspections_count,
              (SELECT COUNT(*) FROM leads l
               WHERE l.dealer_id = d.dealer_id AND l.deleted_at IS NULL
                 AND l.stage = 'Stock-in' AND l.status = 'Won'
                 AND l.converted_at >= $${dateStartIdx} AND l.converted_at <= $${dateEndIdx}
              ) AS stock_ins_count,
              (SELECT COUNT(*) FROM dcf_leads dl
               WHERE dl.dealer_id = d.dealer_id AND dl.deleted_at IS NULL
                 AND dl.created_at >= $${dateStartIdx} AND dl.created_at <= $${dateEndIdx}
              ) AS dcf_leads_count,
              (SELECT MAX(v.visit_date)::text FROM visit_events v
               WHERE v.dealer_id = d.dealer_id
              ) AS last_visit_date,
              (SELECT MAX(c.call_date)::text FROM call_events c
               WHERE c.dealer_id = d.dealer_id
              ) AS last_call_date
       FROM dealers d
       LEFT JOIN users u ON d.kam_user_id = u.user_id
       WHERE ${whereClause}
       ORDER BY d.name ASC
       LIMIT $${dateEndIdx + 1} OFFSET $${dateEndIdx + 2}`,
      dataParams
    );

    const items = rows.map((row: any) => {
      const stockIns = parseInt(row.stock_ins_count) || 0;
      const inspections = parseInt(row.inspections_count) || 0;
      const i2si = inspections > 0 ? Math.round((stockIns / inspections) * 1000) / 10 : 0;

      return {
        dealer_id: row.dealer_id,
        name: row.name,
        code: row.code,
        city: row.city,
        region: row.region,
        segment: row.segment,
        tags: row.tags || [],
        status: row.status,
        kam_id: row.kam_user_id,
        kam_name: row.kam_name,
        metrics: {
          leads: parseInt(row.leads_count) || 0,
          inspections,
          stock_ins: stockIns,
          i2si,
          dcf_leads: parseInt(row.dcf_leads_count) || 0,
        },
        last_visit: daysSinceLabel(row.last_visit_date),
        last_visit_days_ago: row.last_visit_date ? daysOld(row.last_visit_date) : null,
        last_call_days_ago: row.last_call_date ? daysOld(row.last_call_date) : null,
      };
    });

    // Summary
    const summary = await db.queryOne<any>(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE segment = 'A') AS seg_a,
         COUNT(*) FILTER (WHERE segment = 'B') AS seg_b,
         COUNT(*) FILTER (WHERE segment = 'C') AS seg_c,
         COUNT(*) FILTER (WHERE status = 'active') AS active,
         COUNT(*) FILTER (WHERE status = 'dormant') AS dormant,
         COUNT(*) FILTER (WHERE status = 'inactive') AS inactive
       FROM dealers d
       WHERE ${whereClause}`,
      params
    );

    sendSuccess(res, {
      items,
      pagination: buildPagination(page, pageSize, totalItems),
      summary: {
        total_dealers: parseInt(summary?.total) || 0,
        by_segment: {
          A: parseInt(summary?.seg_a) || 0,
          B: parseInt(summary?.seg_b) || 0,
          C: parseInt(summary?.seg_c) || 0,
        },
        by_status: {
          active: parseInt(summary?.active) || 0,
          dormant: parseInt(summary?.dormant) || 0,
          inactive: parseInt(summary?.inactive) || 0,
        },
      },
    }, { time_scope: timeScope, role: req.auth.role });
  } catch (err: any) {
    console.error('[Dealers] List error:', err.message);
    sendError(res, 500, 'DEALERS_ERROR', 'Failed to fetch dealers');
  }
});

/**
 * GET /v1/dealers/:dealer_id
 * Full 360 view per API_CONTRACTS.md §2.2
 */
router.get('/:dealer_id', async (req: Request, res: Response) => {
  try {
    const { dealer_id } = req.params;
    const timeScope = (req.query.time_scope as string) || 'mtd';
    const dateRange = resolveTimeScope(timeScope);

    // Base dealer
    const dealer = await db.queryOne<any>(
      `SELECT d.*, u.name AS kam_name, ut.name AS tl_name
       FROM dealers d
       LEFT JOIN users u ON d.kam_user_id = u.user_id
       LEFT JOIN users ut ON d.tl_user_id = ut.user_id
       WHERE d.dealer_id = $1 AND d.deleted_at IS NULL`,
      [dealer_id]
    );

    if (!dealer) {
      sendError(res, 404, 'NOT_FOUND', `Dealer with id '${dealer_id}' not found`);
      return;
    }

    // Metrics
    const [leadMetrics, callMetrics, visitMetrics, dcfMetrics] = await Promise.all([
      db.queryOne<any>(
        `SELECT
           COUNT(*) AS leads,
           COUNT(*) FILTER (WHERE stage IN ('Inspection Scheduled','Inspection Done','Stock-in')) AS inspections,
           COUNT(*) FILTER (WHERE stage = 'Stock-in' AND status = 'Won') AS stock_ins
         FROM leads
         WHERE dealer_id = $1 AND deleted_at IS NULL
           AND created_at >= $2 AND created_at <= $3`,
        [dealer_id, dateRange.start_date, dateRange.end_date]
      ),
      db.queryOne<any>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE is_productive) AS productive
         FROM call_events
         WHERE dealer_id = $1 AND call_date >= $2 AND call_date <= $3`,
        [dealer_id, dateRange.start_date, dateRange.end_date]
      ),
      db.queryOne<any>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE is_productive) AS productive
         FROM visit_events
         WHERE dealer_id = $1 AND visit_date >= $2 AND visit_date <= $3`,
        [dealer_id, dateRange.start_date, dateRange.end_date]
      ),
      db.queryOne<any>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE overall_status = 'DISBURSED') AS disbursed,
           COALESCE(SUM(CASE WHEN overall_status = 'DISBURSED' THEN loan_amount END), 0) AS gmv
         FROM dcf_leads
         WHERE dealer_id = $1 AND deleted_at IS NULL
           AND created_at >= $2 AND created_at <= $3`,
        [dealer_id, dateRange.start_date, dateRange.end_date]
      ),
    ]);

    const leads = parseInt(leadMetrics?.leads) || 0;
    const inspections = parseInt(leadMetrics?.inspections) || 0;
    const stockIns = parseInt(leadMetrics?.stock_ins) || 0;
    const i2si = inspections > 0 ? Math.round((stockIns / inspections) * 1000) / 10 : 0;

    const totalCalls = parseInt(callMetrics?.total) || 0;
    const productiveCalls = parseInt(callMetrics?.productive) || 0;
    const totalVisits = parseInt(visitMetrics?.total) || 0;
    const productiveVisits = parseInt(visitMetrics?.productive) || 0;

    const dcfTotal = parseInt(dcfMetrics?.total) || 0;
    const dcfDisbursed = parseInt(dcfMetrics?.disbursed) || 0;
    const dcfGmv = parseFloat(dcfMetrics?.gmv) || 0;

    // Top leads
    const topLeads = await db.queryAll<any>(
      `SELECT lead_id, customer_name, make || ' ' || model || COALESCE(' ' || year::text, '') AS car,
              stage, status, created_at
       FROM leads
       WHERE dealer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT 5`,
      [dealer_id]
    );

    // Last interaction timestamps
    const lastCall = await db.queryOne<any>(
      `SELECT MAX(call_date)::text AS last_call FROM call_events WHERE dealer_id = $1`,
      [dealer_id]
    );
    const lastVisit = await db.queryOne<any>(
      `SELECT MAX(visit_date)::text AS last_visit FROM visit_events WHERE dealer_id = $1`,
      [dealer_id]
    );

    sendSuccess(res, {
      dealer_id: dealer.dealer_id,
      name: dealer.name,
      code: dealer.code,
      city: dealer.city,
      region: dealer.region,
      segment: dealer.segment,
      tags: dealer.tags || [],
      status: dealer.status,
      kam_id: dealer.kam_user_id,
      kam_name: dealer.kam_name,
      tl_id: dealer.tl_user_id,
      phone: dealer.phone,
      email: dealer.email,
      address: dealer.address,
      latitude: dealer.latitude ? parseFloat(dealer.latitude) : null,
      longitude: dealer.longitude ? parseFloat(dealer.longitude) : null,
      metrics: {
        leads,
        inspections,
        stock_ins: stockIns,
        i2si,
        dcf_leads: dcfTotal,
        dcf_onboarded: dealer.dcf_onboarded,
        dcf_disbursed: dcfDisbursed,
        dcf_gmv: dcfGmv,
      },
      productivity: {
        productive_calls: productiveCalls,
        non_productive_calls: totalCalls - productiveCalls,
        total_calls: totalCalls,
        productive_calls_percent: totalCalls > 0 ? Math.round((productiveCalls / totalCalls) * 1000) / 10 : 0,
        productive_visits: productiveVisits,
        non_productive_visits: totalVisits - productiveVisits,
        total_visits: totalVisits,
        productive_visits_percent: totalVisits > 0 ? Math.round((productiveVisits / totalVisits) * 1000) / 10 : 0,
      },
      recent_calls: {
        total: totalCalls,
        productive: productiveCalls,
        productivity_rate: totalCalls > 0 ? Math.round((productiveCalls / totalCalls) * 1000) / 10 : 0,
      },
      recent_visits: {
        total: totalVisits,
        productive: productiveVisits,
        productivity_rate: totalVisits > 0 ? Math.round((productiveVisits / totalVisits) * 1000) / 10 : 0,
      },
      top_leads: topLeads.map((l: any) => ({
        id: l.lead_id,
        customer_name: l.customer_name,
        car: l.car,
        stage: l.stage,
        status: l.status,
        created_at: l.created_at,
      })),
      dcf_status: {
        is_onboarded: dealer.dcf_onboarded,
        total_leads: dcfTotal,
        active_leads: dcfTotal - dcfDisbursed,
        disbursed: dcfDisbursed,
        gmv: dcfGmv,
      },
      last_visit_at: lastVisit?.last_visit,
      last_call_at: lastCall?.last_call,
      days_since_last_visit: lastVisit?.last_visit ? daysOld(lastVisit.last_visit) : null,
      days_since_last_call: lastCall?.last_call ? daysOld(lastCall.last_call) : null,
    }, { time_scope: timeScope, role: req.auth.role });
  } catch (err: any) {
    console.error('[Dealers] Detail error:', err.message);
    sendError(res, 500, 'DEALERS_ERROR', 'Failed to fetch dealer detail');
  }
});

export default router;
