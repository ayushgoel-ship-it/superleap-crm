/**
 * SuperLeap CRM — API Server Entry Point
 * Phase: 6B | Source: docs/API_CONTRACTS.md
 *
 * A thin execution layer that:
 *   1. Authenticates requests via JWT
 *   2. Routes to the appropriate handler
 *   3. Handlers read config from DB (metric_definitions, dashboard_layouts)
 *   4. Returns responses in the standard envelope
 *
 * NO business logic lives in this server.
 * All metric formulas live in metric_definitions.sql_template.
 * All dashboard layouts live in dashboard_layouts.tiles.
 *
 * Base URL: /v1/...
 * Auth: Bearer JWT (or X-User-Id/X-User-Role headers for dev)
 */

import express from 'express';
import cors from 'cors';

// Middleware
import { authMiddleware, requestIdMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import dashboardRoutes from './routes/dashboard';
import leadsRoutes from './routes/leads';
import dealersRoutes from './routes/dealers';
import callsRoutes from './routes/calls';
import visitsRoutes from './routes/visits';
import notificationsRoutes from './routes/notifications';

// DB
import { shutdown as dbShutdown } from './db';

// ---------------------------------------------------------------------------
// App Setup
// ---------------------------------------------------------------------------

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Core middleware
app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'superleap-api',
    phase: '6B',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// API Routes (all require auth)
// ---------------------------------------------------------------------------

app.use('/v1/dashboard', authMiddleware, dashboardRoutes);
app.use('/v1/leads', authMiddleware, leadsRoutes);
app.use('/v1/dealers', authMiddleware, dealersRoutes);
app.use('/v1/calls', authMiddleware, callsRoutes);
app.use('/v1/visits', authMiddleware, visitsRoutes);
app.use('/v1/notifications', authMiddleware, notificationsRoutes);

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Server Start
// ---------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  SuperLeap CRM API Server                   ║
║  Phase: 6B — Config-Driven, Thin Layer      ║
║  Port: ${PORT}                                  ║
║  Endpoints:                                  ║
║    GET /v1/dashboard/home                    ║
║    GET /v1/leads                             ║
║    GET /v1/leads/:id                         ║
║    GET /v1/dealers                            ║
║    GET /v1/dealers/:id                       ║
║    GET /v1/calls                             ║
║    GET /v1/calls/:id                         ║
║    GET /v1/visits                            ║
║    GET /v1/visits/:id                        ║
║    GET /v1/notifications                     ║
╚══════════════════════════════════════════════╝
  `);
});

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------

async function gracefulShutdown(signal: string) {
  console.log(`\n[Server] ${signal} received. Shutting down...`);
  server.close(async () => {
    await dbShutdown();
    console.log('[Server] Shutdown complete.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
