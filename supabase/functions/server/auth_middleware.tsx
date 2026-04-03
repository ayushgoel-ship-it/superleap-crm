/**
 * AUTH MIDDLEWARE — JWT Validation + Role Enforcement
 *
 * Provides:
 *   authenticateRequest(c) -> AuthResult  — validates Bearer token
 *   requireAuth()          -> middleware   — Hono middleware for auth
 *   requireRole(roles)     -> middleware   — Hono middleware for role gating
 *
 * Token validation modes:
 *   1. Real Supabase JWT -> extracts user_id + role from profile
 *   2. Anon key (prototype) -> falls back to X-User-Id / X-User-Role headers
 *   3. No token -> 401
 *
 * Logging:
 *   Every authenticated request logs: request_id, user_id, role, route, method
 */

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import type { Context, Next } from "npm:hono";

// ── Types ──

export type ValidRole = "KAM" | "TL" | "ADMIN";

export interface AuthResult {
  userId: string;
  role: ValidRole;
  name: string;
  authMode: "jwt" | "anon-key";
}

// ── Constants ──

const VALID_ROLES: ValidRole[] = ["KAM", "TL", "ADMIN"];

function isValidRole(r: string): r is ValidRole {
  return VALID_ROLES.includes(r as ValidRole);
}

// ── Supabase Service Key Detection ──

/**
 * Decode a JWT payload (without verification) to check if it's a
 * Supabase project API key (anon or service_role).
 *
 * This is more robust than exact string comparison because the env var
 * and the token sent by the frontend may differ slightly (whitespace,
 * gateway re-encoding, etc.).
 */
function isSupabaseProjectKey(token: string): { match: boolean; role: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { match: false, role: "" };

    // base64url → base64 → decode
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));

    if (
      payload.iss === "supabase" &&
      typeof payload.ref === "string" &&
      (payload.role === "anon" || payload.role === "service_role")
    ) {
      return { match: true, role: payload.role };
    }
    return { match: false, role: "" };
  } catch {
    return { match: false, role: "" };
  }
}

// ── Request ID Generator ──

let reqCounter = 0;
function generateRequestId(): string {
  reqCounter += 1;
  return `req-${Date.now()}-${reqCounter}`;
}

// ── Core Auth Function ──

export async function authenticateRequest(c: Context): Promise<AuthResult | Response> {
  const requestId = generateRequestId();
  const method = c.req.method;
  const path = c.req.path;

  // 1. Extract Bearer token
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log(`[AUTH] ${requestId} | REJECTED | ${method} ${path} | Missing or malformed Authorization header`);
    return c.json(
      { success: false, code: "UNAUTHORIZED", error: "Authorization header with Bearer token is required" },
      401,
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    console.log(`[AUTH] ${requestId} | REJECTED | ${method} ${path} | Empty Bearer token`);
    return c.json(
      { success: false, code: "UNAUTHORIZED", error: "Bearer token is empty" },
      401,
    );
  }

  // 2. Try real JWT validation via Supabase Auth
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  try {
    // Attempt JWT validation only if the token is NOT a Supabase project key
    // (anon key or service role key — checked by exact match and JWT decode)
    const exactMatchServiceKey = (token === anonKey || token === serviceRoleKey);
    const decodedServiceKey = !exactMatchServiceKey ? isSupabaseProjectKey(token) : { match: false, role: "" };
    const isServiceKey = exactMatchServiceKey || decodedServiceKey.match;

    if (!isServiceKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await supabase.auth.getUser(token);

      if (!error && data?.user?.id) {
        const userId = data.user.id;
        const meta = data.user.user_metadata || {};
        const roleRaw = (meta.role || "KAM").toUpperCase();
        const role: ValidRole = isValidRole(roleRaw) ? roleRaw : "KAM";
        const name = meta.name || data.user.email || "User";

        console.log(`[AUTH] ${requestId} | OK (jwt) | ${method} ${path} | user=${userId} role=${role}`);
        return { userId, role, name, authMode: "jwt" };
      }
      // If JWT validation fails, fall through to rejection below
      console.log(`[AUTH] ${requestId} | REJECTED | ${method} ${path} | Invalid token (not JWT, not anon key)`);
      return c.json(
        { success: false, code: "UNAUTHORIZED", error: "Invalid or expired authentication token" },
        401,
      );
    }

    // 3. Service key mode (prototype): token is a Supabase anon/service_role key
    // Extract identity from headers (prototype mode)
    const userId = c.req.header("X-User-Id") || "anon-user";
    const roleRaw = (c.req.header("X-User-Role") || "KAM").toUpperCase();
    const role: ValidRole = isValidRole(roleRaw) ? roleRaw : "KAM";
    const name = c.req.header("X-User-Name") || "Anonymous User";
    const authLabel = exactMatchServiceKey ? "anon-key" : `project-key-decode(${decodedServiceKey.role})`;

    console.log(`[AUTH] ${requestId} | OK (${authLabel}) | ${method} ${path} | user=${userId} role=${role}`);
    return { userId, role, name, authMode: "anon-key" };
  } catch (err: any) {
    console.log(`[AUTH] ${requestId} | ERROR | ${method} ${path} | Auth validation error: ${err.message}`);
    return c.json(
      { success: false, code: "UNAUTHORIZED", error: `Authentication error: ${err.message}` },
      401,
    );
  }
}

// ── Role Check Helper ──

export function checkRole(auth: AuthResult, allowedRoles: ValidRole[]): boolean {
  return allowedRoles.includes(auth.role);
}

export function forbiddenResponse(c: Context, auth: AuthResult, allowedRoles: ValidRole[]): Response {
  console.log(
    `[AUTH] FORBIDDEN | ${c.req.method} ${c.req.path} | user=${auth.userId} role=${auth.role} | required=${allowedRoles.join(",")}`
  );
  return c.json(
    {
      success: false,
      code: "FORBIDDEN",
      error: `Role '${auth.role}' is not permitted for this endpoint. Required: ${allowedRoles.join(" or ")}`,
    },
    403,
  ) as unknown as Response;
}

// ── Hono Middleware: Require Auth ──

/**
 * Middleware that validates auth and stores AuthResult in context.
 * Usage: visitRoutes.use("*", requireAuth());
 * Then: const auth = c.get("auth") as AuthResult;
 */
export function requireAuth() {
  return async (c: Context, next: Next) => {
    const result = await authenticateRequest(c);

    // If result is a Response (error), return it immediately
    if (result instanceof Response) {
      return result;
    }

    // Store auth result in context for downstream handlers
    c.set("auth", result);
    await next();
  };
}

// ── Hono Middleware: Require Role ──

/**
 * Middleware that checks role after auth.
 * Must be used AFTER requireAuth().
 * Usage: visitRoutes.use("/admin/*", requireRole(["ADMIN"]));
 */
export function requireRole(allowedRoles: ValidRole[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth") as AuthResult | undefined;
    if (!auth) {
      // requireAuth() was not applied
      return c.json(
        { success: false, code: "UNAUTHORIZED", error: "Authentication required" },
        401,
      );
    }
    if (!checkRole(auth, allowedRoles)) {
      return forbiddenResponse(c, auth, allowedRoles);
    }
    await next();
  };
}