/**
 * Dashboard Routes
 * Phase: 6B | Source: docs/API_CONTRACTS.md §5
 *
 * GET /v1/dashboard/home — Backend-driven home dashboard
 *
 * This route is the centerpiece of the config-driven architecture.
 * It calls dashboardService.buildDashboard() which:
 *   1. Reads dashboard_layouts from DB
 *   2. For each tile, reads metric_definitions from DB
 *   3. Executes sql_template from DB
 *   4. Returns assembled tiles
 *
 * NO business logic in this file. It's a thin routing layer.
 */

import { Router, Request, Response } from 'express';
import { buildDashboard } from '../dashboardService';
import { resolveTimeScope } from '../utils/timeScope';
import { sendSuccess, sendError } from '../utils/responseEnvelope';

const router = Router();

/**
 * GET /v1/dashboard/home
 *
 * Query params:
 *   - time_scope: d-1 | last-7d | mtd (default) | last-30d | last-6m | lifetime
 *
 * Response: API_CONTRACTS.md §5.1
 */
router.get('/home', async (req: Request, res: Response) => {
  try {
    const timeScope = (req.query.time_scope as string) || 'mtd';
    const dateRange = resolveTimeScope(timeScope);

    const dashboard = await buildDashboard(req.auth, dateRange, timeScope);

    sendSuccess(res, dashboard, {
      time_scope: timeScope,
      role: req.auth.role,
    });
  } catch (err: any) {
    console.error('[Dashboard] Error:', err.message);
    sendError(res, 500, 'DASHBOARD_ERROR', 'Failed to build dashboard');
  }
});

export default router;
