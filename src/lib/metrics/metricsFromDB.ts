/**
 * METRICS FROM DB — Rank-based dashboard KPIs from Supabase native fields
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  MODULE BOUNDARY                                               │
 * │                                                                │
 * │  This module provides:                                         │
 * │  1. Rank-based metric computation (computeMetrics)             │
 * │     Uses Supabase rank fields: regInspRank, regTokenRank,      │
 * │     regStockinRank — only rank=1 entries count.                │
 * │  2. Per-KAM metric aggregation (computeKAMMetrics)             │
 * │  3. TL team overview (computeTLOverview)                       │
 * │  4. Month projection utilities (getMonthProgress, projectToEOM)│
 * │                                                                │
 * │  WHEN TO USE THIS MODULE:                                      │
 * │  - Main dashboard / home pages (HomePage, AdminHomePage)       │
 * │  - Performance pages (PerformancePage)                         │
 * │  - TL overview pages (TLDetailPage, TLIncentiveDashboard,      │
 * │    TLIncentiveMobile)                                          │
 * │  - KAM detail pages (KAMDetailPage)                            │
 * │  - Admin pages (AdminDCFPage, TargetsModal)                    │
 * │  - Any page needing rank-based inspections/tokens/stock-ins    │
 * │                                                                │
 * │  WHEN TO USE canonicalMetrics INSTEAD:                         │
 * │  - DCF-specific pages (DCFPage, DCFPageTL, DCF drill-downs)   │
 * │  - Pages needing STAGE-BASED classification (classifyLeadStage)│
 * │  - Dealer activity stage derivation                            │
 * │  - Lead detail pages needing range status or channel mapping   │
 * │                                                                │
 * │  CONSUMERS:                                                    │
 * │  - HomePage.tsx                                                │
 * │  - PerformancePage.tsx                                         │
 * │  - TLDetailPage.tsx                                            │
 * │  - TLIncentiveDashboard.tsx, TLIncentiveMobile.tsx             │
 * │  - TLLeaderboardPage.tsx (also uses canonicalMetrics)          │
 * │  - KAMDetailPage.tsx                                           │
 * │  - AdminHomePage.tsx, AdminDCFPage.tsx, TargetsModal.tsx        │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * All metrics use RANK-BASED FILTERING:
 *   - Inspections: reg_insp_rank = 1 AND inspection_date IS NOT NULL
 *   - Tokens/PR:   reg_token_rank = 1 AND (token_date OR final_token_date) IS NOT NULL
 *   - Stock-ins:   reg_stockin_rank = 1 AND (stockin_date OR final_si_date) IS NOT NULL
 *   - I2SI:        stock-ins / inspections * 100
 *
 * Channel derivation: gs_flag=1 → GS, gs_flag=0 → NGS (already done in adapter)
 *
 * Note: time-range predicate now shared via `lib/date/range.ts`
 * (`isDateInRange`) — aliased locally as `isIn` to minimize call-site churn.
 * Input-score composite shared via `lib/metrics/inputScore.ts`.
 * Remaining overlap with canonicalMetrics.ts (I2SI, DCF aggregation, dashboard
 * shapes) is intentional: the two modules serve different page surfaces.
 */

import { getRuntimeDBSync } from '../../data/runtimeDB';
import { TimePeriod } from '../domain/constants';
import { getConfigTLTeamTargets } from '../configFromDB';
import { resolveTimePeriodToRange } from '../time/resolveTimePeriod';
import type { Lead, CallLog, VisitLog, DCFLead, Dealer } from '../../data/types';
import { computeInputScore } from './inputScore';
import { isDateInRange } from '../date/range';

// ── Time Helpers ──
// Local alias to minimize diff; canonical impl lives in lib/date/range.ts.
const isIn = isDateInRange;

// ── Types ──

export interface DashboardMetrics {
    stockIns: number;
    inspections: number; // rank-1 inspections
    tokens: number; // rank-1 tokens/PR
    totalLeads: number;
    openLeads: number;
    wonLeads: number;
    lostLeads: number;
    dcfTotal: number;
    dcfOnboarded: number; // dealers with dcf_onboarded='Y', filtered by dcfOnboardingDate
    dcfDisbursals: number;
    dcfDisbursedValue: number;
    dcfInProgress: number;
    dcfApproved: number;
    dcfRejected: number;
    totalCalls: number;
    connectedCalls: number;
    totalVisits: number;
    completedVisits: number;
    scheduledVisits: number;
    i2si: number;
    conversionRate: number;
    callConnectRate: number;
    totalDealers: number;
    activeDealers: number;
    inactiveDealers: number;
    channelBreakdown: Record<string, number>;
    ragBreakdown: { green: number; amber: number; red: number };
    avgCallDuration: number;
    uniqueDealersVisited: number;
    uniqueDealersCalled: number;
}

export interface KAMMetrics extends DashboardMetrics {
    kamId: string;
    kamName: string;
    inputScore: number;
}

export interface TLOverviewMetrics {
    teamStockIns: number;
    teamStockInsTarget: number;
    teamI2SI: number;
    teamI2SITarget: number;
    teamAvgInputScore: number;
    dcfOnboardings: number;
    dcfGMV: number;
    dcfGMVTarget: number;
    kamMetrics: KAMMetrics[];
}

// ── Main computation ──

export function computeMetrics(
    period: TimePeriod,
    kamId?: string,
    customFrom?: string,
    customTo?: string
): DashboardMetrics {
    const db = getRuntimeDBSync();
    const { fromISO, toISO } = resolveTimePeriodToRange(period, new Date(), customFrom, customTo);
    const from = new Date(fromISO);
    const to = new Date(toISO);

    // Filter by KAM (dealer-based scoping: lead.dealerCode belongs to KAM's dealers)
    const allLeadsForKam: Lead[] = db.leads.filter((l: Lead) => kamId ? l.kamId === kamId : true);

    // ── RANK-BASED METRIC COMPUTATION ──

    // Inspections: reg_insp_rank=1 AND inspection_date in period
    const inspections = allLeadsForKam.filter((l: Lead) =>
        l.regInspRank === 1 && l.inspectionDate && isIn(l.inspectionDate, from, to)
    ).length;

    // Tokens/PR: reg_token_rank=1 AND (token_date OR final_token_date) in period
    const tokens = allLeadsForKam.filter((l: Lead) => {
        if (l.regTokenRank !== 1) return false;
        const tDate = l.finalTokenDate || l.tokenDate;
        return tDate && isIn(tDate, from, to);
    }).length;

    // Stock-ins: reg_stockin_rank=1 AND (stockin_date OR final_si_date) in period
    const stockIns = allLeadsForKam.filter((l: Lead) => {
        if (l.regStockinRank !== 1) return false;
        const siDate = l.finalSiDate || l.stockinDate;
        return siDate && isIn(siDate, from, to);
    }).length;

    // Total leads created in period (all ranks)
    const periodLeads = allLeadsForKam.filter((l: Lead) => isIn(l.createdAt, from, to));
    const totalLeadsCount = allLeadsForKam.length;

    // Status counts (derived from dates)
    const wonLeads = allLeadsForKam.filter((l: Lead) => l.status === 'Won');
    const lostLeads = allLeadsForKam.filter((l: Lead) => l.status === 'Lost');
    const openLeads = allLeadsForKam.filter((l: Lead) => l.status === 'Active');

    // I2SI = stock-ins / inspections * 100
    const i2si = inspections > 0 ? Math.round((stockIns / inspections) * 100) : 0;
    const conversionRate = inspections > 0 ? Math.round((stockIns / inspections) * 100) : 0;

    // ── CALLS ──
    const calls: CallLog[] = db.calls.filter((c: CallLog) => {
        const inPeriod = isIn(c.callDate, from, to);
        const matchesKam = kamId ? c.kamId === kamId : true;
        return inPeriod && matchesKam;
    });
    const connectedCalls = calls.filter((c: CallLog) => c.callStatus === 'CONNECTED' || c.outcome === 'Connected');
    const avgCallDuration = calls.length > 0
        ? calls.reduce((sum: number, c: CallLog) => sum + (c.durationSec || 0), 0) / calls.length
        : 0;
    const callConnectRate = calls.length > 0 ? Math.round((connectedCalls.length / calls.length) * 100) : 0;

    // ── VISITS ──
    const visits: VisitLog[] = db.visits.filter((v: VisitLog) => {
        const inPeriod = isIn(v.visitDate, from, to);
        const matchesKam = kamId ? v.kamId === kamId : true;
        return inPeriod && matchesKam;
    });
    const completedVisits = visits.filter((v: VisitLog) => v.status === 'COMPLETED');
    const scheduledVisits = visits.filter((v: VisitLog) => v.status === 'NOT_STARTED');

    // ── DCF (time-filtered) ──
    const allDcfForKam: DCFLead[] = db.dcfLeads.filter((d: DCFLead) => kamId ? d.kamId === kamId : true);
    // DCF leads created in the time period
    const dcfInPeriod = allDcfForKam.filter((d: DCFLead) => isIn(d.createdAt, from, to));
    // Disbursals: CANONICAL predicate (Wave 1A).
    // Previously: `overallStatus === 'disbursed' || !!disbursalDate` — which
    // over-counted any row that had a stray disbursal date regardless of
    // status, and drifted from KAMIncentiveSimulator's strict status-only
    // filter. Aligning on status === 'disbursed' AND disbursalDate ∈ period.
    const dcfDisbursed = allDcfForKam.filter((d: DCFLead) =>
        d.overallStatus === 'disbursed' && !!d.disbursalDate && isIn(d.disbursalDate, from, to)
    );
    // Status breakdowns for leads created in period
    const dcfInProgress = dcfInPeriod.filter((d: DCFLead) => d.overallStatus === 'in_progress');
    const dcfApproved = dcfInPeriod.filter((d: DCFLead) => d.overallStatus === 'approved');
    const dcfRejected = dcfInPeriod.filter((d: DCFLead) => d.currentFunnel === 'REJECTED' || d.overallStatus === 'rejected');
    const dcfDisbursedValue = dcfDisbursed.reduce((sum: number, d: DCFLead) => sum + (d.loanAmount || 0), 0) / 100000;

    // ── DEALERS ──
    const dealers: Dealer[] = db.dealers.filter((d: Dealer) => kamId ? d.kamId === kamId : true);
    const activeDealers = dealers.filter((d: Dealer) => d.status === 'active').length;
    const inactiveDealers = dealers.filter((d: Dealer) => d.status !== 'active').length;

    // DCF-onboarded dealers (dcf_onboarded='Y') with onboarding date in period
    const dcfOnboardedDealers = dealers.filter((d: Dealer) =>
        d.dcfOnboarded === 'Y' && isIn(d.dcfOnboardingDate, from, to)
    ).length;

    // ── UNIQUE DEALERS ──
    const uniqueDealersVisited = new Set(visits.map((v: VisitLog) => v.dealerId)).size;
    const uniqueDealersCalled = new Set(calls.map((c: CallLog) => c.dealerId)).size;

    // ── CHANNEL BREAKDOWN ──
    const channelBreakdown: Record<string, number> = {};
    allLeadsForKam.forEach((l: Lead) => {
        const ch = l.channel || 'Other';
        channelBreakdown[ch] = (channelBreakdown[ch] || 0) + 1;
    });

    // ── RAG ──
    const ragBreakdown = { green: openLeads.length, amber: 0, red: lostLeads.length };

    return {
        stockIns,
        inspections,
        tokens,
        totalLeads: totalLeadsCount,
        openLeads: openLeads.length,
        wonLeads: wonLeads.length,
        lostLeads: lostLeads.length,
        dcfTotal: dcfInPeriod.length,
        dcfOnboarded: dcfOnboardedDealers,
        dcfDisbursals: dcfDisbursed.length,
        dcfDisbursedValue,
        dcfInProgress: dcfInProgress.length,
        dcfApproved: dcfApproved.length,
        dcfRejected: dcfRejected.length,
        totalCalls: calls.length,
        connectedCalls: connectedCalls.length,
        totalVisits: visits.length,
        completedVisits: completedVisits.length,
        scheduledVisits: scheduledVisits.length,
        i2si,
        conversionRate,
        callConnectRate,
        totalDealers: dealers.length,
        activeDealers,
        inactiveDealers,
        channelBreakdown,
        ragBreakdown,
        avgCallDuration,
        uniqueDealersVisited,
        uniqueDealersCalled,
    };
}

/**
 * Compute metrics per KAM for TL view
 */
export function computeKAMMetrics(period: TimePeriod): KAMMetrics[] {
    const db = getRuntimeDBSync();
    const kamIds = new Set<string>();
    db.leads.forEach((l: Lead) => { if (l.kamId && l.kamId !== 'unassigned') kamIds.add(l.kamId); });
    db.dealers.forEach((d: Dealer) => { if (d.kamId && d.kamId !== 'unassigned') kamIds.add(d.kamId); });

    return Array.from(kamIds).map(kamId => {
        const metrics = computeMetrics(period, kamId);
        const dealer = db.dealers.find((d: Dealer) => d.kamId === kamId);
        const kamName = dealer?.kamName || 'KAM';

        const inputScore = computeInputScore(metrics);

        return { ...metrics, kamId, kamName, inputScore };
    });
}

/**
 * Compute TL overview
 */
export function computeTLOverview(period: TimePeriod): TLOverviewMetrics {
    const kamMetrics = computeKAMMetrics(period);
    const totalMetrics = computeMetrics(period);

    const avgInputScore = kamMetrics.length > 0
        ? Math.round(kamMetrics.reduce((sum, k) => sum + k.inputScore, 0) / kamMetrics.length)
        : 0;

    const tlTargets = getConfigTLTeamTargets();

    return {
        teamStockIns: totalMetrics.stockIns,
        teamStockInsTarget: tlTargets.teamSITarget,
        teamI2SI: totalMetrics.i2si,
        teamI2SITarget: tlTargets.teamI2SITarget,
        teamAvgInputScore: avgInputScore,
        dcfOnboardings: totalMetrics.dcfTotal,
        dcfGMV: totalMetrics.dcfDisbursedValue,
        dcfGMVTarget: tlTargets.dcfGMVTarget,
        kamMetrics,
    };
}

/**
 * Get month context for projections
 */
export function getMonthProgress(): { daysElapsed: number; totalDays: number; progressPct: number } {
    const now = new Date();
    const daysElapsed = now.getDate();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return { daysElapsed, totalDays, progressPct: Math.round((daysElapsed / totalDays) * 100) };
}

/**
 * Project a value to end of month
 */
export function projectToEOM(current: number, daysElapsed: number, totalDays: number): number {
    if (daysElapsed === 0) return 0;
    return Math.round((current / daysElapsed) * totalDays);
}
