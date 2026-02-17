# Decision: Phase 6B API Design — Thin Execution Layer

**Date:** February 10, 2026
**Phase:** 6B (Backend API Server)
**Status:** Accepted

---

## 1. Core Architecture: Why a Thin Execution Layer

### What "thin" means

The API server in `/backend_api/` has exactly ONE job: **execute configuration
stored in the database and return results**. It does NOT:

- Contain metric formulas (those are in `metric_definitions.sql_template`)
- Decide which tiles appear on dashboards (that's in `dashboard_layouts.tiles`)
- Know what "Stock-In" means (it just runs the SQL and returns the number)
- Hard-code any labels, thresholds, or business rules

### Why this matters

| Traditional approach | SuperLeap approach |
|---------------------|-------------------|
| Formula lives in code: `si = leads.filter(...)` | Formula lives in DB: `metric_definitions.sql_template` |
| Rename metric = code change + deploy | Rename metric = one SQL UPDATE |
| Add dashboard tile = code change + deploy | Add tile = one SQL UPDATE |
| Change threshold = code change + deploy | Change threshold = one SQL UPDATE |
| Frontend contains formulas | Frontend is a pure renderer (P5) |

### The execution flow

```
Request → Auth → Load layout from DB → For each tile:
                                          Load metric def from DB →
                                          Execute sql_template →
                                          Compute RAG from DB thresholds →
                                          Assemble tile response →
                                        Sort by position →
                                        Return JSON
```

Every step reads from the database. The code is just the plumbing that connects
the request to the config tables.

---

## 2. Why Logic is NOT Embedded in Code

### Principle P5: Frontend is a Pure Renderer

The frontend receives:
```json
{ "display_name": "Stock-Ins (SI)", "value": 18, "rag": "amber" }
```

It does NOT compute `18` or decide `amber`. It just renders what it receives.

### Principle P8: Configuration Over Code

If you need to:
- **Rename a metric:** `UPDATE metric_definitions SET display_name = '...'`
- **Change a formula:** `UPDATE metric_definitions SET sql_template = '...'`
- **Add a tile:** `UPDATE dashboard_layouts SET tiles = tiles || '[...]'`
- **Disable a metric:** `UPDATE metric_definitions SET enabled = false`

No code change. No deployment. No pull request. Just a database update.

### What lives where

| Concern | Location | File/Table |
|---------|----------|------------|
| Metric formulas | Database | `metric_definitions.sql_template` |
| Metric labels | Database | `metric_definitions.display_name` |
| RAG thresholds | Database | `metric_definitions.rag_thresholds` |
| Tile layout | Database | `dashboard_layouts.tiles` |
| SQL execution | Code | `metricsEngine.ts` |
| Response assembly | Code | `dashboardService.ts` |
| Request routing | Code | `routes/*.ts` |
| Auth / role scoping | Code | `middleware/auth.ts`, `utils/roleConfig.ts` |
| Time scope resolution | Code | `utils/timeScope.ts` |

---

## 3. Technology Choice: TypeScript + Express

| Criterion | Decision | Reason |
|-----------|----------|--------|
| Language | TypeScript | Same as frontend (React) — one team, one language |
| Framework | Express | Minimal, battle-tested, huge ecosystem |
| DB driver | `pg` (node-postgres) | Standard Postgres driver with parameterized queries |
| No ORM | Intentional | SQL templates from DB are already full SQL; ORM would add overhead |

### Why NOT an ORM

The metric engine executes raw SQL from `metric_definitions.sql_template`.
An ORM would require translating between ORM models and raw SQL, which adds
complexity for zero benefit. The data routes use simple parameterized SELECTs
that don't need abstraction.

---

## 4. Safety: SQL Injection Prevention

The metrics engine uses a two-layer safety model:

### Layer 1: Trusted Templates

`sql_template` values are authored by admins and stored in the database.
They are NOT user-supplied. They are treated as trusted code (like a stored
procedure).

### Layer 2: Parameterized Binding

All runtime values (`:user_id`, `:start_date`, etc.) are bound via positional
`$N` parameters — never string-concatenated.

```typescript
// metricsEngine.ts — bindTemplate()
// Input:  "SELECT COUNT(*) FROM leads WHERE kam_user_id = :user_id"
// Output: { sql: "...WHERE kam_user_id = $1", values: ['kam-ncr-01'] }
```

### What an attacker cannot do

- Cannot inject SQL via query parameters (all values are bound)
- Cannot modify sql_template (requires DB write access, which is admin-only)
- Cannot access other users' data (role-based filtering is applied server-side)

---

## 5. How audit_log Can Be Extended

The Phase 6A `audit_log` table is append-only. To integrate with Phase 6B:

### Option A: Application-Level Logging (Recommended for V1)

After any mutation endpoint (POST/PATCH/PUT/DELETE), insert an audit row:

```typescript
await db.query(
  `INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id,
                           old_values, new_values, change_summary, request_id)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
  [auth.user_id, auth.role, 'UPDATE', 'leads', leadId,
   JSON.stringify(oldValues), JSON.stringify(newValues),
   `stage: ${oldStage} → ${newStage}`, req.requestId]
);
```

### Option B: Postgres Trigger (Future)

A trigger on each table auto-inserts into `audit_log` on UPDATE/DELETE:

```sql
CREATE OR REPLACE FUNCTION audit_trigger_fn() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id,
                          old_values, new_values)
  VALUES (current_setting('app.user_id', true), current_setting('app.user_role', true),
          TG_OP, TG_TABLE_NAME, OLD.lead_id,
          to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Recommended path

- V1 (Phase 6B): Application-level logging for mutation endpoints
- V2: Postgres triggers for full coverage without code changes
- Neither approach requires frontend changes

---

## 6. Caching Strategy

Per METRICS_CONFIG_SYSTEM.md §5.1:

| Data | Cache TTL | Implementation |
|------|-----------|---------------|
| `metric_definitions` | 5 minutes | In-memory Map in `metricsEngine.ts` |
| `dashboard_layouts` | 5 minutes | In-memory Map in `dashboardService.ts` |
| Metric values | Not cached in V1 | Each request executes fresh SQL |
| Trend data | Not cached in V1 | Computed on demand |

V2 optimization: Redis cache for metric values with 60s TTL.

---

## 7. What Phase 6B Does NOT Do

- No deployment configuration (that's Phase 7+)
- No write endpoints beyond health check (reads only in V1)
- No WebSocket/real-time push (future consideration)
- No rate limiting (add via API gateway later)
- No metric value caching (V2 optimization)

---

*End of PHASE_6B_API_DESIGN.md*
