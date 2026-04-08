/**
 * tlIncentive.validation — boundary-case assertions for computeTLIncentive.
 *
 * This project does not yet wire a test runner (no vitest/jest in package.json),
 * so we mirror the existing pattern in `lib/incentiveEngine.validation.ts`:
 * a plain module exporting named cases + a `runAll()` that throws on failure.
 *
 * Invoke manually from a dev console or import from an ad-hoc script:
 *   import { runAll } from './tlIncentive.validation';
 *   runAll();
 *
 * The 6 locked boundary cases cover every branch of the formula.
 */

import { computeTLIncentive, type TLIncentiveInput } from './tlIncentive';

interface Case {
  name: string;
  input: TLIncentiveInput;
  expect: Partial<{
    rate: 0 | 100 | 150;
    multiplier: 0 | 0.5 | 1;
    midMonthBonus: number;
    gross: number;
    final: number;
  }>;
}

const baseInput: TLIncentiveInput = {
  teamStockins: 0,
  teamStockinMonthlyTarget: 100,
  teamDcfDisbursed: 0,
  teamScore: 80,
  midMonthProgressPct: 0,
  periodCoversMidMonth: false,
};

const CASES: Case[] = [
  // 1. Below 100% target → rate 0, no stockin incentive
  {
    name: 'below_100_pct_zero_rate',
    input: { ...baseInput, teamStockins: 90, teamScore: 80 },
    expect: { rate: 0, multiplier: 1, gross: 0, final: 0 },
  },
  // 2. Exactly 100% → ₹100 rate
  {
    name: 'exactly_100_pct_rate_100',
    input: { ...baseInput, teamStockins: 100, teamScore: 80 },
    // gross = 100*100 = 10000; × 1 = 10000
    expect: { rate: 100, multiplier: 1, gross: 10000, final: 10000 },
  },
  // 3. 105% → still ₹100 (100-109 band)
  {
    name: 'mid_band_105_pct',
    input: { ...baseInput, teamStockins: 105, teamScore: 80 },
    expect: { rate: 100, multiplier: 1, gross: 10500, final: 10500 },
  },
  // 4. Exactly 110% → ₹150 (cap band)
  {
    name: 'exactly_110_pct_rate_150',
    input: { ...baseInput, teamStockins: 110, teamScore: 80 },
    // gross = 110*150 = 16500
    expect: { rate: 150, multiplier: 1, gross: 16500, final: 16500 },
  },
  // 5. Score between 50-69 → ×0.5 multiplier
  {
    name: 'score_in_50_69_half_payout',
    input: { ...baseInput, teamStockins: 120, teamScore: 60 },
    // gross = 120*150 = 18000; × 0.5 = 9000
    expect: { rate: 150, multiplier: 0.5, gross: 18000, final: 9000 },
  },
  // 6. Score < 50 → ×0 (zero payout regardless of achievement)
  {
    name: 'score_below_50_zero_payout',
    input: { ...baseInput, teamStockins: 200, teamScore: 40 },
    expect: { rate: 150, multiplier: 0, gross: 200 * 150, final: 0 },
  },
];

// Bonus case: mid-month bonus triggered when period covers day 15 and ≥50%
const BONUS_CASE: Case = {
  name: 'mid_month_bonus_triggered',
  input: {
    ...baseInput,
    teamStockins: 100,
    teamScore: 80,
    midMonthProgressPct: 60,
    periodCoversMidMonth: true,
  },
  // stockin 100*100 + dcf 0 + bonus 2500 = 12500; ×1 = 12500
  expect: { rate: 100, multiplier: 1, midMonthBonus: 2500, gross: 12500, final: 12500 },
};

export function runAll(): { passed: number; failed: Array<{ name: string; reason: string }> } {
  const failed: Array<{ name: string; reason: string }> = [];
  let passed = 0;

  for (const c of [...CASES, BONUS_CASE]) {
    const got = computeTLIncentive(c.input);
    const diffs: string[] = [];
    for (const k of Object.keys(c.expect) as Array<keyof Case['expect']>) {
      const want = (c.expect as any)[k];
      const actual = (got as any)[k];
      if (want !== actual) diffs.push(`${k}: expected ${want}, got ${actual}`);
    }
    if (diffs.length === 0) {
      passed++;
    } else {
      failed.push({ name: c.name, reason: diffs.join('; ') });
    }
  }

  if (failed.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[tlIncentive.validation] FAILURES:', failed);
    throw new Error(`tlIncentive validation failed: ${failed.length} case(s)`);
  }
  // eslint-disable-next-line no-console
  console.log(`[tlIncentive.validation] ${passed}/${CASES.length + 1} cases passed`);
  return { passed, failed };
}
