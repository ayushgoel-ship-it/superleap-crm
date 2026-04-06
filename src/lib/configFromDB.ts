/**
 * CONFIG FROM DB — Reads backend config tables from runtimeDB cache
 *
 * Provides typed accessors for:
 *   - targets (SI, call, visit per role/month)
 *   - incentive_slabs (rate_per_si by achievement %)
 *   - incentive_rules (DCF payouts, score gates)
 *
 * All functions return safe fallbacks when backend data is unavailable,
 * so consumers never need null-checks.
 */

import { getRuntimeDBSync } from '../data/runtimeDB';
import type { TargetRow, IncentiveSlabRow, IncentiveRuleRow } from '../data/supabaseRaw';
import type { KAM } from '../data/types';

// ── Hardcoded fallbacks (used when backend config tables are empty) ──

const FALLBACK_SI_TARGET_KAM = 20;

// ── Helpers: org hierarchy for TL target derivation ──

/** Get all KAMs across the org from the runtime DB org hierarchy. */
function getAllKAMsFromOrg(): KAM[] {
  const db = getRuntimeDBSync();
  return db.org.tls.flatMap(tl => tl.kams);
}

/** Get the number of KAMs in the org (used for TL fallback targets). Exported for metricsEngine. */
export function getConfigKAMCount(): number {
  const count = getAllKAMsFromOrg().length;
  return count > 0 ? count : 1; // never zero-divide
}
const FALLBACK_I2SI_TARGET = 65;
const FALLBACK_DCF_GMV_TARGET_LAKHS = 50; // in lakhs

const FALLBACK_SLABS: Array<{ slabName: string; minPct: number; maxPct: number | null; ratePerSI: number }> = [
  { slabName: 'Below 100%', minPct: 0, maxPct: 100, ratePerSI: 0 },
  { slabName: '100-109%', minPct: 100, maxPct: 110, ratePerSI: 1000 },
  { slabName: '110%+', minPct: 110, maxPct: null, ratePerSI: 1500 },
];

const FALLBACK_SCORE_GATES = [
  { threshold: 0, multiplier: 0, label: 'Below 50' },
  { threshold: 50, multiplier: 0.5, label: '50-69' },
  { threshold: 70, multiplier: 1.0, label: '70+' },
];

const FALLBACK_DCF_RULES = {
  gmvTotalPct: 0.01,        // 1% of total GMV
  gmvFirstPct: 0.005,       // 0.5% of first disbursement
  onboardingPayout: 300,     // ₹300 per dealer onboarded
};

// ── Current month key ──

function currentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// ── Public API ──

/**
 * Get SI target for a role.
 *
 * KAM: reads the KAM row from `targets` table for the current month; falls back to FALLBACK_SI_TARGET_KAM.
 *
 * TL:  DERIVED — sum of each KAM's individual SI target.
 *      For each KAM we look up their row in `targets`; if missing we use the KAM fallback.
 *      This guarantees TL target = sum(KAM targets), e.g. 3 KAMs * 20 = 60, NOT a hardcoded 100.
 */
export function getConfigSITarget(role: 'KAM' | 'TL'): number {
  const db = getRuntimeDBSync();
  const month = currentMonthKey();

  if (role === 'KAM') {
    const row = db.targets.find(t => t.role === 'KAM' && t.month === month);
    if (row && row.si_target > 0) return row.si_target;
    return FALLBACK_SI_TARGET_KAM;
  }

  // TL: sum individual KAM targets
  const allKAMs = getAllKAMsFromOrg();
  if (allKAMs.length === 0) {
    // No org data loaded yet — conservative fallback
    return FALLBACK_SI_TARGET_KAM;
  }

  let total = 0;
  for (const kam of allKAMs) {
    // Try to find a per-user target row for this KAM
    const kamRow = db.targets.find(t => t.user_id === kam.id && t.month === month);
    if (kamRow && kamRow.si_target > 0) {
      total += kamRow.si_target;
    } else {
      // Fall back to role-level KAM target
      const roleRow = db.targets.find(t => t.role === 'KAM' && t.month === month);
      total += (roleRow && roleRow.si_target > 0) ? roleRow.si_target : FALLBACK_SI_TARGET_KAM;
    }
  }
  return total;
}

/** Get all targets for a specific user in current month */
export function getConfigTargetsForUser(userId: string): {
  siTarget: number;
  callTarget: number;
  visitTarget: number;
  inputScoreGate: number;
  qualityScoreGate: number;
} {
  const db = getRuntimeDBSync();
  const month = currentMonthKey();
  const row = db.targets.find(t => t.user_id === userId && t.month === month);
  if (row) {
    return {
      siTarget: row.si_target || FALLBACK_SI_TARGET_KAM,
      callTarget: row.call_target || 5,
      visitTarget: row.visit_target || 3,
      inputScoreGate: row.input_score_gate || 70,
      qualityScoreGate: row.quality_score_gate || 50,
    };
  }
  return {
    siTarget: FALLBACK_SI_TARGET_KAM,
    callTarget: 5,
    visitTarget: 3,
    inputScoreGate: 70,
    qualityScoreGate: 50,
  };
}

/** Get I2SI target — reads from targets table (i2si_target column), falls back to 65 */
export function getConfigI2SITarget(role: 'KAM' | 'TL' = 'KAM'): number {
  const db = getRuntimeDBSync();
  const month = currentMonthKey();
  const row = db.targets.find(t => t.role === role && t.month === month);
  if (row && row.i2si_target != null && row.i2si_target > 0) return row.i2si_target;
  return FALLBACK_I2SI_TARGET;
}

/** Get DCF GMV target in lakhs */
export function getConfigDCFGMVTarget(): number {
  const db = getRuntimeDBSync();
  const rule = db.incentiveRules.find(r => r.metric_key === 'dcf_gmv_target');
  if (rule && rule.threshold != null && rule.threshold > 0) return rule.threshold;
  return FALLBACK_DCF_GMV_TARGET_LAKHS;
}

/** Get incentive slabs for a role. Returns sorted by minPct ascending. */
export function getConfigIncentiveSlabs(role: 'KAM' | 'TL'): Array<{
  slabName: string;
  minPct: number;
  maxPct: number | null;
  ratePerSI: number;
}> {
  const db = getRuntimeDBSync();
  const rows = db.incentiveSlabs.filter(s => s.role === role);
  if (rows.length > 0) {
    return rows
      .sort((a, b) => a.min_percent - b.min_percent)
      .map(r => ({
        slabName: r.slab_name || `${r.min_percent}-${r.max_percent ?? '∞'}%`,
        minPct: r.min_percent,
        maxPct: r.max_percent,
        ratePerSI: r.rate_per_si,
      }));
  }
  return FALLBACK_SLABS;
}

/** Get score gate thresholds. Returns sorted ascending by threshold. */
export function getConfigScoreGates(): Array<{
  threshold: number;
  multiplier: number;
  label: string;
}> {
  const db = getRuntimeDBSync();
  const rules = db.incentiveRules.filter(r => r.metric_key === 'score_gate');
  if (rules.length > 0) {
    return rules
      .sort((a, b) => (a.threshold ?? 0) - (b.threshold ?? 0))
      .map(r => ({
        threshold: r.threshold ?? 0,
        multiplier: (r.payout ?? 0) / 100, // stored as pct 0/50/100 → 0/0.5/1.0
        label: `${r.threshold ?? 0}+`,
      }));
  }
  return FALLBACK_SCORE_GATES;
}

/** Get DCF payout rules */
export function getConfigDCFPayoutRules(): {
  gmvTotalPct: number;
  gmvFirstPct: number;
  onboardingPayout: number;
} {
  const db = getRuntimeDBSync();
  const gmvRule = db.incentiveRules.find(r => r.metric_key === 'dcf_gmv_total_pct');
  const firstRule = db.incentiveRules.find(r => r.metric_key === 'dcf_gmv_first_pct');
  const onbRule = db.incentiveRules.find(r => r.metric_key === 'dcf_onboarding_payout');

  return {
    gmvTotalPct: gmvRule?.payout != null ? gmvRule.payout / 100 : FALLBACK_DCF_RULES.gmvTotalPct,
    gmvFirstPct: firstRule?.payout != null ? firstRule.payout / 100 : FALLBACK_DCF_RULES.gmvFirstPct,
    onboardingPayout: onbRule?.payout ?? FALLBACK_DCF_RULES.onboardingPayout,
  };
}

/** Get TL team-level targets (aggregates) */
export function getConfigTLTeamTargets(): {
  teamSITarget: number;
  teamI2SITarget: number;
  dcfGMVTarget: number;
} {
  return {
    teamSITarget: getConfigSITarget('TL'),
    teamI2SITarget: getConfigI2SITarget('TL'),
    dcfGMVTarget: getConfigDCFGMVTarget(),
  };
}
