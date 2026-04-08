/**
 * tlIncentive — Pure TL incentive computation.
 *
 * Formula (locked by user, 2026-04):
 *
 *  1. Base per-stockin rate from team target achievement %:
 *       < 100%           → ₹0
 *       100% ≤ x < 110%  → ₹100
 *       ≥ 110%           → ₹150 (cap)
 *
 *  2. Stockin incentive       = teamStockins × rate
 *
 *  3. DCF incentive           = teamDcfDisbursed × ₹1000
 *
 *  4. Mid-month bonus (flat ₹2500): triggered when the active period
 *     covers day 15 of the current month AND stockin progress by day 15
 *     reached ≥ 50% of the full monthly team stockin target. Caller passes
 *     `periodCoversMidMonth` and `midMonthProgressPct` already resolved.
 *
 *  5. Gross                   = stockin + dcf + midMonthBonus
 *
 *  6. Score multiplier from team input score (0-100 avg of KAM scores):
 *       ≥ 70  → ×1.0
 *       ≥ 50  → ×0.5
 *       < 50  → ×0
 *
 *  7. Final                   = gross × multiplier
 *
 * Pure — no side effects, safe in render.
 */

export interface TLIncentiveInput {
  teamStockins: number;
  teamStockinMonthlyTarget: number;
  teamDcfDisbursed: number;
  teamScore: number;              // 0-100 (average of KAM input scores)
  midMonthProgressPct: number;    // 0-100; stockins by day 15 ÷ monthly target × 100
  periodCoversMidMonth: boolean;  // true if active period includes day 15 of current month
}

export interface TLIncentiveBreakdown {
  rate: 0 | 100 | 150;
  targetAchPct: number;
  stockinIncentive: number;
  dcfIncentive: number;
  midMonthBonus: number;
  gross: number;
  multiplier: 0 | 0.5 | 1;
  final: number;
  rateReason: string;
  multiplierReason: string;
  bonusReason: string;
}

export function computeTLIncentive(input: TLIncentiveInput): TLIncentiveBreakdown {
  const {
    teamStockins,
    teamStockinMonthlyTarget,
    teamDcfDisbursed,
    teamScore,
    midMonthProgressPct,
    periodCoversMidMonth,
  } = input;

  // 1. Base rate from achievement %
  const targetAchPct =
    teamStockinMonthlyTarget > 0
      ? Math.round((teamStockins / teamStockinMonthlyTarget) * 100)
      : 0;

  let rate: 0 | 100 | 150;
  let rateReason: string;
  if (targetAchPct >= 110) {
    rate = 150;
    rateReason = `Team at ${targetAchPct}% of target (≥110%) — max rate ₹150/stockin`;
  } else if (targetAchPct >= 100) {
    rate = 100;
    rateReason = `Team at ${targetAchPct}% of target (100-109%) — rate ₹100/stockin`;
  } else {
    rate = 0;
    rateReason = `Team at ${targetAchPct}% of target (<100%) — no stockin payout`;
  }

  // 2. Stockin incentive
  const stockinIncentive = teamStockins * rate;

  // 3. DCF incentive
  const dcfIncentive = teamDcfDisbursed * 1000;

  // 4. Mid-month bonus
  let midMonthBonus = 0;
  let bonusReason: string;
  if (!periodCoversMidMonth) {
    bonusReason = 'Active period does not cover day 15 of current month — bonus N/A';
  } else if (midMonthProgressPct >= 50) {
    midMonthBonus = 2500;
    bonusReason = `By day 15, team reached ${Math.round(midMonthProgressPct)}% of monthly target (≥50%) — ₹2,500 bonus unlocked`;
  } else {
    bonusReason = `By day 15, team only at ${Math.round(midMonthProgressPct)}% of monthly target (<50%) — bonus missed`;
  }

  // 5. Gross
  const gross = stockinIncentive + dcfIncentive + midMonthBonus;

  // 6. Score multiplier
  let multiplier: 0 | 0.5 | 1;
  let multiplierReason: string;
  if (teamScore >= 70) {
    multiplier = 1;
    multiplierReason = `Team score ${Math.round(teamScore)} (≥70) — full payout`;
  } else if (teamScore >= 50) {
    multiplier = 0.5;
    multiplierReason = `Team score ${Math.round(teamScore)} (50-69) — half payout`;
  } else {
    multiplier = 0;
    multiplierReason = `Team score ${Math.round(teamScore)} (<50) — zero payout`;
  }

  // 7. Final
  const final = Math.round(gross * multiplier);

  return {
    rate,
    targetAchPct,
    stockinIncentive,
    dcfIncentive,
    midMonthBonus,
    gross,
    multiplier,
    final,
    rateReason,
    multiplierReason,
    bonusReason,
  };
}
