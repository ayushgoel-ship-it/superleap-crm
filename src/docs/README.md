# SuperLeap CRM - Documentation Index

**Last Updated:** April 13, 2026

---

## Structure

```
src/docs/
├── 00_README_HANDOFF.md               — Start here
├── 01_PRD.md                          — Product requirements
├── 02_TRD_ARCHITECTURE.md             — Technical architecture
├── 03_QA_RUNBOOK.md                   — QA & testing
├── 04_CHANGELOG_PROMPTS.md            — Change history
├── 05_CODE_AUDIT_STALE_ITEMS.md       — Audit tracker
├── 06_DEV_READY_BASELINE_SNAPSHOT.md  — Baseline snapshot
├── 07_UNUSED_CODE_IMPORT_GRAPH.md     — Import analysis
├── 08_ARCHIVE_ACTIONS_LOG.md          — Archive log
├── 09_DATA_BOUNDARY_MAP.md            — Data boundaries
├── 10_FLOW_INVARIANTS.md              — Flow invariants
├── 11_DEV_READY_VERIFICATION.md       — Verification checklist
├── 12_SUPABASE_COUPLING_INVENTORY.md  — Phase 1 D1 migration inventory
├── 13_BUSINESS_API_FLOW_MAP.md        — Phase 1 D2 workflow to capability map
├── 14_LEGACY_BACKEND_REFERENCE_CONTRACTS.md — Phase 1 D3 legacy backend contract sheet
├── 15_VIZ_SERVICE_BACKEND_PRINCIPLES.md — Phase 1 D4 backend architecture standards
├── 16_CONTROL_ROOM_FRONTEND_PRINCIPLES.md — Phase 1 D5 frontend architecture standards
├── API_CONTRACTS.md                   — API contracts
├── APP_FLOWS.md                       — Application workflows
├── DAG_DESIGN.md                      — DAG design
├── DATA_ARCHITECTURE.md               — Data architecture
├── DRD_DATA_RULEBOOK.md               — Data rulebook
├── METRICS_CONFIG_SYSTEM.md           — Metrics & config
├── DECISIONS/                         — Architecture decisions
└── VERIFICATION/                      — Verification records
```

---

## Essential Reading (New Developer Start)

1. **[00_README_HANDOFF.md](./00_README_HANDOFF.md)** — What the app is, how to run it, folder structure, key workflows
2. **[01_PRD.md](./01_PRD.md)** — Business context, user personas, core modules
3. **[02_TRD_ARCHITECTURE.md](./02_TRD_ARCHITECTURE.md)** — Data flow, engines, navigation, auth
4. **[03_QA_RUNBOOK.md](./03_QA_RUNBOOK.md)** — Smoke tests, critical flow tests, debug playbook

## Data Layer

5. **[09_DATA_BOUNDARY_MAP.md](./09_DATA_BOUNDARY_MAP.md)** — Data access patterns, selector boundaries
6. **[DRD_DATA_RULEBOOK.md](./DRD_DATA_RULEBOOK.md)** — Computation rules for every metric and status
7. **[DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)** — Data architecture overview
8. **[METRICS_CONFIG_SYSTEM.md](./METRICS_CONFIG_SYSTEM.md)** — Config-driven metrics, dashboard layouts

## Workflows & Flows

9. **[APP_FLOWS.md](./APP_FLOWS.md)** — Route map, role permissions, screen flows, state machines
10. **[10_FLOW_INVARIANTS.md](./10_FLOW_INVARIANTS.md)** — Flow invariants that must hold
11. **[API_CONTRACTS.md](./API_CONTRACTS.md)** — API contract definitions

## Architecture Decisions

12. **[DECISIONS/](./DECISIONS/)** — Architecture decision records
13. **[DAG_DESIGN.md](./DAG_DESIGN.md)** — DAG design

## Audit & History

14. **[04_CHANGELOG_PROMPTS.md](./04_CHANGELOG_PROMPTS.md)** — Change history
15. **[05_CODE_AUDIT_STALE_ITEMS.md](./05_CODE_AUDIT_STALE_ITEMS.md)** — Stale code audit tracker
16. **[06_DEV_READY_BASELINE_SNAPSHOT.md](./06_DEV_READY_BASELINE_SNAPSHOT.md)** — Pre-hardening baseline
17. **[07_UNUSED_CODE_IMPORT_GRAPH.md](./07_UNUSED_CODE_IMPORT_GRAPH.md)** — Import graph analysis
18. **[08_ARCHIVE_ACTIONS_LOG.md](./08_ARCHIVE_ACTIONS_LOG.md)** — Archive action log
19. **[11_DEV_READY_VERIFICATION.md](./11_DEV_READY_VERIFICATION.md)** — Dev-ready verification checklist
20. **[13_BUSINESS_API_FLOW_MAP.md](./13_BUSINESS_API_FLOW_MAP.md)** — Workflow-first mapping from mounted UI flows to target business APIs
21. **[14_LEGACY_BACKEND_REFERENCE_CONTRACTS.md](./14_LEGACY_BACKEND_REFERENCE_CONTRACTS.md)** — Legacy backend route behavior to preserve or redesign during migration
22. **[15_VIZ_SERVICE_BACKEND_PRINCIPLES.md](./15_VIZ_SERVICE_BACKEND_PRINCIPLES.md)** — `viz-service` patterns translated into CRM backend standards
23. **[16_CONTROL_ROOM_FRONTEND_PRINCIPLES.md](./16_CONTROL_ROOM_FRONTEND_PRINCIPLES.md)** — `control-room` shell and frontend organization patterns translated into CRM standards
24. **[19_C24_INTEGRATION_ARCHITECTURE.md](./19_C24_INTEGRATION_ARCHITECTURE.md)** — Cars24 API integration architecture: proxy layer, appointments table, lead extensions

## Verification

24. **[VERIFICATION/](./VERIFICATION/)** — Verification records
25. **[12_SUPABASE_COUPLING_INVENTORY.md](./12_SUPABASE_COUPLING_INVENTORY.md)** — Authoritative Supabase dependency inventory for migration planning

---

## Archived Documentation

Previous markdown files have been consolidated into the canonical docs above.

**Archived files location:** `_archive_md/`

Do NOT edit archived files. Always update canonical docs in this folder.

---

## Keeping Docs in Sync

When adding a new feature:
1. Update **01_PRD.md** — Add to Core Modules
2. Update **02_TRD_ARCHITECTURE.md** — Add data flow, routes
3. Update **03_QA_RUNBOOK.md** — Add test cases
4. Update **04_CHANGELOG_PROMPTS.md** — Document the change

When fixing a bug:
1. Update **03_QA_RUNBOOK.md** — Add to Debug Playbook
2. Update **04_CHANGELOG_PROMPTS.md** — Document the fix

---

## Quick Reference

| Topic | Document |
|-------|----------|
| How to run the app | 00_README_HANDOFF.md |
| Where to find X | 00_README_HANDOFF.md |
| Data flow | 02_TRD_ARCHITECTURE.md |
| Data access rules | 09_DATA_BOUNDARY_MAP.md |
| Metric formulas | DRD_DATA_RULEBOOK.md |
| Route map | APP_FLOWS.md |
| Testing | 03_QA_RUNBOOK.md |
| What changed | 04_CHANGELOG_PROMPTS.md |
