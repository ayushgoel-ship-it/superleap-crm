# Archived Markdown Documentation

**Archive Date:** February 6, 2026  
**Reason:** Consolidated into canonical documentation in `/docs/`

---

## What's in This Folder

This folder contains **all original markdown files** that were merged into the 5 canonical documentation files:

1. `/docs/00_README_HANDOFF.md` - Quick handoff guide
2. `/docs/01_PRD.md` - Product requirements
3. `/docs/02_TRD_ARCHITECTURE.md` - Technical architecture
4. `/docs/03_QA_RUNBOOK.md` - Testing & debugging
5. `/docs/04_CHANGELOG_PROMPTS.md` - Prompt history & changes

---

## DO NOT UPDATE THESE FILES

⚠️ **These files are ARCHIVED and no longer maintained.**

If you need to update documentation:
- Update the canonical files in `/docs/`
- Do NOT edit files in this `_archive_md/` folder

---

## Why Archive vs Delete?

We keep archived files for:
1. **Reference:** Historical context for how the project evolved
2. **Recovery:** If something was missed during consolidation
3. **Audit:** Trace decisions made in earlier prompts

---

## How to Find Information

**Instead of these archived files, use:**

| Old File Pattern | New Canonical Location |
|------------------|------------------------|
| `*_COMPLETE.md` | `/docs/04_CHANGELOG_PROMPTS.md` |
| `*_QUICK_REFERENCE.md` | `/docs/01_PRD.md` or `/docs/02_TRD_ARCHITECTURE.md` |
| `*_TEST_*.md` | `/docs/03_QA_RUNBOOK.md` |
| `BUSINESS_LOGIC.md` | `/docs/02_TRD_ARCHITECTURE.md` → Engines section |
| `ARCHITECTURE_*.md` | `/docs/02_TRD_ARCHITECTURE.md` |
| `IMPLEMENTATION_*.md` | `/docs/04_CHANGELOG_PROMPTS.md` |
| `DEMO_GUIDE.md` | `/docs/03_QA_RUNBOOK.md` → Demo testing |
| `QUICK_START.md` | `/docs/00_README_HANDOFF.md` |
| `PROJECT_HANDOFF_CHATGPT.md` | `/docs/00_README_HANDOFF.md` |

---

## Restoration Instructions

If you absolutely need to restore an archived file:

1. Copy file from `_archive_md/` to project root
2. Update any references to point to restored file
3. Document reason for restoration in `/docs/04_CHANGELOG_PROMPTS.md`
4. Consider if info should be merged back into canonical docs instead

---

**For current documentation, always refer to `/docs/` canonical files.**
