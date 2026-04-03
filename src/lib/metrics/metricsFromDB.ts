/**
 * METRICS FROM DB — Computes all dashboard KPIs from canonical Supabase data
 *
 * All metrics use RANK-BASED FILTERING:
 *   - Inspections: reg_insp_rank = 1 AND inspection_date IS NOT NULL
 *   - Tokens/PR:   reg_token_rank = 1 AND (token_date OR final_token_date) IS NOT NULL
 *   - Stock-ins:   reg_stockin_rank = 1 AND (stockin_date OR final_si_date) IS NOT NULL
 *   - I2SI:        stock-ins / inspections * 100
 *
 * Channel derivation: gs_flag=1 → GS, gs_flag=0 → NGS (already done in adapter)
 */

import { getRuntimeDBSync } from '../../data/runtimeDB';
import { TimePeriod } from '../domain/constants';
import type { Lead, CallLog, VisitLog, DCFLead, Dealer } from '../../data/types';

// ── Time Helpers ──

function getDateRange(period: TimePeriod): { from: Date; to: Date } {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    switch (period) {
        case TimePeriod.TODAY:
            return { from: todayStart, to: tomorrowStart };
        case TimePeriod.D_MINUS_1: {
            const yesterday = new Date(todayStart);
            yesterday.setDate(yesterday.getDate() - 1);
            return { from: yesterday, to: todayStart };
        }
        case TimePeriod.MTD: {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { from: monthStart, to: tomorrowStart };
        }
        case TimePeriod.LAST_MONTH: {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { from: lastMonthStart, to: thisMonthStart };
        }
        default: {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { from: monthStart, to: tomorrowStart };
        }
    }
}

function isInRange(dateStr: string | undefined, from: Date, to: Date): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= from && d < to;
}

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
    kamId?: string
): DashboardMetrics {
    const db = getRuntimeDBSync();
    const { from, to } = getDateRange(period);

    // Filter by KAM (dealer-based scoping: lead.dealerCode belongs to KAM's dealers)
    const allLeadsForKam: Lead[] = db.leads.filter((l: Lead) => kamId ? l.kamId === kamId : true);

    // ── RANK-BASED METRIC COMPUTATION ──

    // Inspections: reg_insp_rank=1 AND inspection_date in period
    const inspections = allLeadsForKam.filter((l: Lead) =>
        l.regInspRank === 1 && l.inspectionDate && isInRange(l.inspectionDate, from, to)
    ).length;

    // Tokens/PR: reg_token_rank=1 AND (token_date OR final_token_date) in period
    const tokens = allLeadsForKam.filter((l: Lead) => {
        if (l.regTokenRank !== 1) return false;
        const tDate = l.finalTokenDate || l.tokenDate;
        return tDate && isInRange(tDate, from, to);
    }).length;

    // Stock-ins: reg_stockin_rank=1 AND (stockin_date OR final_si_date) in period
    const stockIns = allLeadsForKam.filter((l: Lead) => {
        if (l.regStockinRank !== 1) return false;
        const siDate = l.finalSiDate || l.stockinDate;
        return siDate && isInRange(siDate, from, to);
    }).length;

    // Total leads created in period (all ranks)
    const periodLeads = allLeadsForKam.filter((l: Lead) => isInRange(l.createdAt, from, to));
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
        const inPeriod = isInRange(c.callDate, from, to);
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
        const inPeriod = isInRange(v.visitDate, from, to);
        const matchesKam = kamId ? v.kamId === kamId : true;
        return inPeriod && matchesKam;
    });
    const completedVisits = visits.filter((v: VisitLog) => v.status === 'COMPLETED');
    const scheduledVisits = visits.filter((v: VisitLog) => v.status === 'NOT_STARTED');

    // ── DCF ──
    const allDcfForKam: DCFLead[] = db.dcfLeads.filter((d: DCFLead) => kamId ? d.kamId === kamId : true);
    const dcfDisbursed = allDcfForKam.filter((d: DCFLead) => d.overallStatus === 'disbursed' || !!d.disbursalDate);
    const dcfInProgress = allDcfForKam.filter((d: DCFLead) => d.overallStatus === 'in_progress');
    const dcfApproved = allDcfForKam.filter((d: DCFLead) => d.overallStatus === 'approved');
    const dcfRejected = allDcfForKam.filter((d: DCFLead) => d.currentFunnel === 'REJECTED' || d.overallStatus === 'rejected');
    const dcfDisbursedValue = dcfDisbursed.reduce((sum: number, d: DCFLead) => sum + (d.loanAmount || 0), 0) / 100000;

    // ── DEALERS ──
    const dealers: Dealer[] = db.dealers.filter((d: Dealer) => kamId ? d.kamId === kamId : true);
    const activeDealers = dealers.filter((d: Dealer) => d.status === 'active').length;
    const inactiveDealers = dealers.filter((d: Dealer) => d.status !== 'active').length;

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
        dcfTotal: allDcfForKam.length,
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

        const visitScore = Math.min(metrics.completedVisits / 3, 1) * 30;
        const callScore = Math.min(metrics.totalCalls / 5, 1) * 30;
        const dealerScore = Math.min(metrics.uniqueDealersCalled / 3, 1) * 20;
        const convScore = Math.min(metrics.conversionRate / 50, 1) * 20;
        const inputScore = Math.round(visitScore + callScore + dealerScore + convScore);

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

    return {
        teamStockIns: totalMetrics.stockIns,
        teamStockInsTarget: 150,
        teamI2SI: totalMetrics.i2si,
        teamI2SITarget: 65,
        teamAvgInputScore: avgInputScore,
        dcfOnboardings: totalMetrics.dcfTotal,
        dcfGMV: totalMetrics.dcfDisbursedValue,
        dcfGMVTarget: 50,
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
