# SuperLeap CRM - Documentation Index

**Last Updated:** February 6, 2026  
**Status:** Canonical documentation complete

---

## 📚 Quick Navigation

### Essential Documents (Read These First)

1. **[00_README_HANDOFF.md](./00_README_HANDOFF.md)** - Start here! Quick handoff guide
   - What this app is
   - How to run locally
   - Folder structure
   - Where to find things
   - "Do not break" workflows

2. **[01_PRD.md](./01_PRD.md)** - Product Requirements
   - Business context & goals
   - User personas (KAM, TL, Admin)
   - Core modules (Dealers, Leads, Calls, Visits, DCF, etc.)
   - Must-have behaviors
   - Filters & admin dashboards

3. **[02_TRD_ARCHITECTURE.md](./02_TRD_ARCHITECTURE.md)** - Technical Architecture
   - Data flow (Engine → Selector → DTO → UI)
   - Central mock database rules
   - Navigation system (routes, role config)
   - Auth & impersonation
   - Engines (metrics, incentives, productivity)
   - Business rules

4. **[03_QA_RUNBOOK.md](./03_QA_RUNBOOK.md)** - Testing & Debugging
   - Smoke test checklist (5 min)
   - Critical flows test cases
   - Role-specific testing (KAM, TL, Admin)
   - Debug playbook (common issues)
   - Known issues

5. **[04_CHANGELOG_PROMPTS.md](./04_CHANGELOG_PROMPTS.md)** - Prompt History
   - Major milestones
   - Prompt-by-prompt summary
   - Known regressions & fixes
   - Future work

### Additional Documents

6. **[05_CODE_AUDIT_STALE_ITEMS.md](./05_CODE_AUDIT_STALE_ITEMS.md)** - Code Audit
   - Unused components (12)
   - Duplicate components (8)
   - Orphan routes (3)
   - Archive plan

---

## 🗂️ Archived Documentation

All previous markdown files (50+) have been consolidated into the 5 canonical docs above.

**Archived files location:** `_archive_md/`

**Do NOT edit archived files.** Always update canonical docs in this folder.

See [_archive_md/README.md](./_archive_md/README.md) for details.

---

## 🎯 Documentation Principles

1. **Single Source of Truth:** Each topic has ONE canonical location
2. **No Duplication:** Avoid copy-pasting content across docs
3. **Cross-Reference:** Link to other docs, don't repeat
4. **Keep Updated:** Update docs when code changes
5. **Version Control:** Use git to track doc changes

---

## 📋 Documentation Coverage

| Topic | Document | Status |
|-------|----------|--------|
| Quick Start | 00_README_HANDOFF.md | ✅ Complete |
| Business Requirements | 01_PRD.md | ✅ Complete |
| Architecture | 02_TRD_ARCHITECTURE.md | ✅ Complete |
| Testing | 03_QA_RUNBOOK.md | ✅ Complete |
| Change History | 04_CHANGELOG_PROMPTS.md | ✅ Complete |
| Code Audit | 05_CODE_AUDIT_STALE_ITEMS.md | ✅ Complete |
| API Documentation | - | ❌ TODO (when backend connects) |
| Deployment Guide | - | ❌ TODO (when deploying) |

---

## 🔄 Keeping Docs in Sync

### When Adding a New Feature

1. **Update PRD** (`01_PRD.md`) - Add to Core Modules section
2. **Update TRD** (`02_TRD_ARCHITECTURE.md`) - Add data flow, routes if needed
3. **Update QA Runbook** (`03_QA_RUNBOOK.md`) - Add test cases
4. **Update Changelog** (`04_CHANGELOG_PROMPTS.md`) - Document the change

### When Fixing a Bug

1. **Update QA Runbook** (`03_QA_RUNBOOK.md`) - Add to Debug Playbook
2. **Update Changelog** (`04_CHANGELOG_PROMPTS.md`) - Document the fix

### When Archiving Code

1. **Update Code Audit** (`05_CODE_AUDIT_STALE_ITEMS.md`) - Mark as archived
2. **Update Changelog** (`04_CHANGELOG_PROMPTS.md`) - Note what was removed

---

## 🚀 For New Developers

**First Time Setup:**

1. Read [00_README_HANDOFF.md](./00_README_HANDOFF.md) (5 min)
2. Skim [01_PRD.md](./01_PRD.md) → Understand business context (10 min)
3. Skim [02_TRD_ARCHITECTURE.md](./02_TRD_ARCHITECTURE.md) → Understand data flow (10 min)
4. Run smoke tests from [03_QA_RUNBOOK.md](./03_QA_RUNBOOK.md) (10 min)

**Total onboarding: ~35 minutes**

**Deep Dive (Optional):**

5. Read full PRD (30 min)
6. Read full TRD (45 min)
7. Read full QA Runbook (30 min)
8. Review Changelog (20 min)

**Total deep dive: ~2 hours**

---

## 📞 Need Help?

**For Questions About:**

| Topic | See Document | Section |
|-------|-------------|---------|
| How to run the app | 00_README_HANDOFF.md | How to Run Locally |
| Where to find X | 00_README_HANDOFF.md | Folder Map |
| Business requirements | 01_PRD.md | Core Modules |
| Data flow | 02_TRD_ARCHITECTURE.md | Data Flow |
| Engines | 02_TRD_ARCHITECTURE.md | Engines |
| Navigation | 02_TRD_ARCHITECTURE.md | Navigation System |
| Testing | 03_QA_RUNBOOK.md | Critical Flows |
| Debugging | 03_QA_RUNBOOK.md | Debug Playbook |
| What changed | 04_CHANGELOG_PROMPTS.md | Prompt-by-Prompt |
| Stale code | 05_CODE_AUDIT_STALE_ITEMS.md | Archive Plan |

---

## ✅ Documentation Health Check

Run this checklist monthly:

- [ ] All 5 canonical docs exist and are readable
- [ ] No duplicate content across docs
- [ ] All links work (no 404s)
- [ ] Code examples match current codebase
- [ ] Test cases in QA Runbook still pass
- [ ] Changelog reflects recent work
- [ ] Code audit is up-to-date

---

**This documentation is the single source of truth for SuperLeap CRM.**

**Last consolidated:** February 6, 2026  
**Next review:** March 6, 2026
