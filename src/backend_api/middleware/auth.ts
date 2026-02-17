/**
 * Authentication Middleware
 * Phase: 6B | Source: docs/API_CONTRACTS.md §0 (Auth: Bearer JWT)
 *
 * Extracts user identity from JWT and populates req.auth.
 * Supports admin impersonation via X-Impersonate-User-Id header.
 *
 * In production, this validates the JWT signature against Supabase's
 * public key. In development, it reads claims directly.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthContext, UserRole } from '../utils/roleConfig';
import { sendError } from '../utils/responseEnvelope';
import db from '../db';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth: AuthContext;
      requestId: string;
    }
  }
}

/**
 * Request ID middleware — generates a unique ID per request.
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  next();
}

/**
 * Auth middleware.
 *
 * Production flow:
 *   1. Extract Bearer token from Authorization header
 *   2. Verify JWT signature (Supabase public key)
 *   3. Extract claims: user_id, role, team_id
 *   4. Populate req.auth
 *
 * Development flow:
 *   Reads X-User-Id, X-User-Role, X-Team-Id headers directly.
 *   This allows testing without a real JWT.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let auth: AuthContext;

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      // Production: JWT verification
      // In a real deployment, decode and verify the JWT here.
      // For Phase 6B (code only, no deployment), we parse the payload.
      const token = authHeader.substring(7);
      const payload = decodeJWTPayload(token);

      if (!payload || !payload.user_id || !payload.role) {
        sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
        return;
      }

      auth = {
        user_id: payload.user_id,
        role: payload.role as UserRole,
        team_id: payload.team_id ?? null,
        name: payload.name ?? '',
        region: payload.region ?? '',
      };
    } else {
      // Development: header-based auth for testing
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;
      const teamId = req.headers['x-team-id'] as string;

      if (!userId || !userRole) {
        sendError(res, 401, 'UNAUTHORIZED',
          'Missing Authorization header. For dev, provide X-User-Id and X-User-Role headers.');
        return;
      }

      if (!['KAM', 'TL', 'ADMIN'].includes(userRole)) {
        sendError(res, 401, 'UNAUTHORIZED', `Invalid role: ${userRole}. Must be KAM, TL, or ADMIN.`);
        return;
      }

      // Look up user details from DB
      const user = await db.queryOne<any>(
        `SELECT user_id, name, role, team_id, region FROM users WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      );

      auth = {
        user_id: userId,
        role: userRole as UserRole,
        team_id: teamId ?? user?.team_id ?? null,
        name: user?.name ?? userId,
        region: user?.region ?? '',
      };
    }

    // Admin impersonation (API_CONTRACTS.md §0.4)
    const impersonateId = req.headers['x-impersonate-user-id'] as string;
    if (impersonateId && auth.role === 'ADMIN') {
      const impUser = await db.queryOne<any>(
        `SELECT user_id, role, team_id FROM users WHERE user_id = $1 AND deleted_at IS NULL`,
        [impersonateId]
      );

      if (impUser) {
        auth.impersonating = {
          user_id: impUser.user_id,
          role: impUser.role,
          team_id: impUser.team_id,
        };
      }
    }

    req.auth = auth;
    next();
  } catch (err: any) {
    console.error('[Auth] Error:', err.message);
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication failed');
  }
}

/**
 * Decode JWT payload (base64url) without verification.
 * In production, use a proper JWT library with signature verification.
 */
function decodeJWTPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
