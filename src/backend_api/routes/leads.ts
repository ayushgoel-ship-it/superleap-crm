/**
 * Leads Routes
 * Phase: 6B | Source: docs/API_CONTRACTS.md §1
 *
 * GET /v1/leads          — List leads (paginated, filtered)
 * GET /v1/leads/:lead_id — Lead detail
 *
 * Simple SELECT queries against the leads table.
 * Role-based filtering applied per API_CONTRACTS.md §0.4.
 */

import { Router, Request, Response } from 'express';
import db from '../db';
import { roleFilterForTable } from '../utils/roleConfig';
import { resolveTimeScope } from '../utils/timeScope';
import { sendSuccess, sendError, parsePagination, buildPagination } from '../utils/responseEnvelope';
import { daysOld } from '../utils/formatters';

const router = Router();

/**
 * GET /v1/leads
 * Query params per API_CONTRACTS.md §1.1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const timeScope = (req.query.time_scope as string) || 'mtd';
    const dateRange = resolveTimeScope(timeScope);

    // Build WHERE clauses
    const conditions: string[] = ['l.deleted_at IS NULL'];
    const params: any[] = [];
    let paramIdx = 1;

    // Role-based filter
    const roleFilter = roleFilterForTable(req.auth, 'leads', paramIdx);
    if (roleFilter.clause !== '1=1') {
      conditions.push(`l.${roleFilter.clause}`);
      params.push(...roleFilter.params);
      paramIdx += roleFilter.paramOffset;
    }

    // Time scope filter
    conditions.push(`l.created_at >= $${paramIdx}`);
    params.push(dateRange.start_date);
    paramIdx++;
    conditions.push(`l.created_at <= $${paramIdx}`);
    params.push(dateRange.end_date);
    paramIdx++;

    // Optional filters
    if (req.query.channel) {
      conditions.push(`l.channel = $${paramIdx}`);
      params.push(req.query.channel);
      paramIdx++;
    }
    if (req.query.status) {
      conditions.push(`l.status = $${paramIdx}`);
      params.push(req.query.status);
      paramIdx++;
    }
    if (req.query.stage) {
      conditions.push(`l.stage = $${paramIdx}`);
      params.push(req.query.stage);
      paramIdx++;
    }
    if (req.query.dealer_id) {
      conditions.push(`l.dealer_id = $${paramIdx}`);
      params.push(req.query.dealer_id);
      paramIdx++;
    }
    if (req.query.search) {
      conditions.push(`(l.customer_name ILIKE $${paramIdx} OR l.reg_no ILIKE $${paramIdx} OR d.name ILIKE $${paramIdx})`);
      params.push(`%${req.query.search}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    // Sort
    const validSortFields: Record<string, string> = {
      created_at: 'l.created_at',
      updated_at: 'l.updated_at',
      customer_name: 'l.customer_name',
      stage: 'l.stage',
    };
    const sortBy = validSortFields[req.query.sort_by as string] || 'l.created_at';
    const sortOrder = req.query.sort_order === 'asc' ? 'ASC' : 'DESC';

    // Count query
    const countResult = await db.queryScalar<number>(
      `SELECT COUNT(*) FROM leads l LEFT JOIN dealers d ON l.dealer_id = d.dealer_id WHERE ${whereClause}`,
      params
    );
    const totalItems = countResult ?? 0;

    // Data query
    const dataParams = [...params, pageSize, offset];
    const rows = await db.queryAll<any>(
      `SELECT l.*,
              d.name AS dealer_name, d.code AS dealer_code,
              u.name AS kam_name
       FROM leads l
       LEFT JOIN dealers d ON l.dealer_id = d.dealer_id
       LEFT JOIN users u ON l.kam_user_id = u.user_id
       WHERE ${whereClause}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams
    );

    // Format items per API_CONTRACTS.md §1.1
    const items = rows.map((row: any) => ({
      lead_id: row.lead_id,
      dealer_id: row.dealer_id,
      dealer_name: row.dealer_name,
      dealer_code: row.dealer_code,
      kam_id: row.kam_user_id,
      kam_name: row.kam_name,
      customer_name: row.customer_name,
      reg_no: row.reg_no,
      car: `${row.make} ${row.model}${row.year ? ' ' + row.year : ''}`,
      make: row.make,
      model: row.model,
      year: row.year,
      channel: row.channel,
      lead_type: row.lead_type,
      stage: row.stage,
      sub_stage: row.sub_stage,
      status: row.status,
      expected_revenue: parseFloat(row.expected_revenue) || 0,
      actual_revenue: parseFloat(row.actual_revenue) || 0,
      cep: row.cep ? parseFloat(row.cep) : null,
      city: row.city,
      region: row.region,
      days_old: daysOld(row.created_at),
      created_at: row.created_at,
      updated_at: row.updated_at,
      inspection_date: row.inspection_date,
      converted_at: row.converted_at,
    }));

    // Summary
    const summaryResult = await db.queryAll<any>(
      `SELECT
         COUNT(*) AS total_leads,
         COUNT(*) FILTER (WHERE l.status = 'Active') AS active,
         COUNT(*) FILTER (WHERE l.status = 'Won') AS won,
         COUNT(*) FILTER (WHERE l.status = 'Lost') AS lost,
         COUNT(*) FILTER (WHERE l.status = 'Expired') AS expired,
         COUNT(*) FILTER (WHERE l.channel = 'C2B') AS c2b,
         COUNT(*) FILTER (WHERE l.channel = 'C2D') AS c2d,
         COUNT(*) FILTER (WHERE l.channel = 'GS') AS gs
       FROM leads l
       LEFT JOIN dealers d ON l.dealer_id = d.dealer_id
       WHERE ${whereClause}`,
      params
    );
    const s = summaryResult[0] || {};

    sendSuccess(res, {
      items,
      pagination: buildPagination(page, pageSize, totalItems),
      summary: {
        total_leads: parseInt(s.total_leads) || 0,
        by_status: {
          Active: parseInt(s.active) || 0,
          Won: parseInt(s.won) || 0,
          Lost: parseInt(s.lost) || 0,
          Expired: parseInt(s.expired) || 0,
        },
        by_channel: {
          C2B: parseInt(s.c2b) || 0,
          C2D: parseInt(s.c2d) || 0,
          GS: parseInt(s.gs) || 0,
        },
      },
    }, { time_scope: timeScope, role: req.auth.role });
  } catch (err: any) {
    console.error('[Leads] List error:', err.message);
    sendError(res, 500, 'LEADS_ERROR', 'Failed to fetch leads');
  }
});

/**
 * GET /v1/leads/:lead_id
 * Response per API_CONTRACTS.md §1.2
 */
router.get('/:lead_id', async (req: Request, res: Response) => {
  try {
    const { lead_id } = req.params;

    const row = await db.queryOne<any>(
      `SELECT l.*,
              d.name AS dealer_name, d.code AS dealer_code,
              d.city AS dealer_city, d.segment AS dealer_segment,
              d.phone AS dealer_phone,
              u.name AS kam_name, u.phone AS kam_phone
       FROM leads l
       LEFT JOIN dealers d ON l.dealer_id = d.dealer_id
       LEFT JOIN users u ON l.kam_user_id = u.user_id
       WHERE l.lead_id = $1 AND l.deleted_at IS NULL`,
      [lead_id]
    );

    if (!row) {
      sendError(res, 404, 'NOT_FOUND', `Lead with id '${lead_id}' not found`);
      return;
    }

    // Dealer snapshot
    const dealerSnapshot = {
      id: row.dealer_id,
      name: row.dealer_name,
      code: row.dealer_code,
      city: row.dealer_city,
      segment: row.dealer_segment,
      phone: row.dealer_phone,
    };

    // Timeline — not yet implemented as a separate table for C2B/C2D/GS leads.
    // Return empty array; can be extended later.
    const timeline: any[] = [];

    sendSuccess(res, {
      lead_id: row.lead_id,
      dealer_id: row.dealer_id,
      dealer_name: row.dealer_name,
      dealer_code: row.dealer_code,
      kam_id: row.kam_user_id,
      kam_name: row.kam_name,
      kam_phone: row.kam_phone,
      tl_id: row.tl_user_id,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      reg_no: row.reg_no,
      make: row.make,
      model: row.model,
      year: row.year,
      variant: row.variant,
      channel: row.channel,
      lead_type: row.lead_type,
      stage: row.stage,
      sub_stage: row.sub_stage,
      status: row.status,
      expected_revenue: parseFloat(row.expected_revenue) || 0,
      actual_revenue: parseFloat(row.actual_revenue) || 0,
      cep: row.cep ? parseFloat(row.cep) : null,
      city: row.city,
      region: row.region,
      inspection_date: row.inspection_date,
      converted_at: row.converted_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      dealer_snapshot: dealerSnapshot,
      timeline,
    });
  } catch (err: any) {
    console.error('[Leads] Detail error:', err.message);
    sendError(res, 500, 'LEADS_ERROR', 'Failed to fetch lead detail');
  }
});

export default router;
