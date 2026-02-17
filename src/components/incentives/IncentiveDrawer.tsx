/**
 * INCENTIVE DRAWER — TL Incentive Projection Sheet
 *
 * Bottom sheet showing:
 *   - Projected incentive (₹)
 *   - Slab table (compact)
 *   - Boosters/reducers breakdown
 *   - Gates & warnings
 *
 * Data sourced from GET /v1/incentives/summary
 */

import { useState, useEffect } from 'react';
import {
  X, TrendingUp, TrendingDown, Target, Zap, IndianRupee,
  CheckCircle2, AlertTriangle, ShieldAlert, ChevronRight, BarChart3,
} from 'lucide-react';
import { getIncentiveSummary } from '../../lib/api/crmApi';
import type { IncentiveSummary } from '../../lib/api/crmApi';
import { toast } from 'sonner@2.0.3';

interface IncentiveDrawerProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
  timeScope?: string;
}

function formatINR(n: number): string {
  return `\u20B9${n.toLocaleString('en-IN')}`;
}

export function IncentiveDrawer({ open, onClose, userId, timeScope = 'mtd' }: IncentiveDrawerProps) {
  const [data, setData] = useState<IncentiveSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getIncentiveSummary({ timeScope, user_id: userId })
        .then(setData)
        .catch(err => {
          console.error('[IncentiveDrawer] Error:', err);
          toast.error('Could not load incentive data');
        })
        .finally(() => setLoading(false));
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [open, timeScope, userId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          animateIn ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Incentive Projection</h2>
              <p className="text-[11px] text-slate-400">{timeScope.toUpperCase()} period</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : data ? (
            <>
              {/* Projected Incentive Hero */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 rounded-2xl p-5 text-white text-center">
                <div className="text-[11px] text-indigo-200 font-medium uppercase tracking-wider mb-1">Projected Incentive</div>
                <div className="text-[32px] font-black leading-none">{formatINR(data.projected_incentive)}</div>
                <div className="text-[11px] text-indigo-200 mt-2">
                  Base: {formatINR(data.base_incentive)} + Boosters: {formatINR(data.boosters.reduce((s, b) => s + b.amount, 0))}
                </div>
              </div>

              {/* Slab Info */}
              <div className="card-premium p-4">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Current Slab</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-400">Achievement</div>
                    <div className="text-[16px] font-bold text-slate-800">{data.slab_info.achievement_pct}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">I2SI</div>
                    <div className="text-[16px] font-bold text-slate-800">{data.slab_info.i2si_pct}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Per SI Rate</div>
                    <div className="text-[16px] font-bold text-indigo-700">{formatINR(data.slab_info.per_si_rate)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Slab</div>
                    <div className="text-[12px] font-semibold text-slate-600 mt-0.5">{data.slab_info.slab_label}</div>
                  </div>
                </div>
              </div>

              {/* Mini Slab Table */}
              <div className="card-premium p-4">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Slab Matrix (₹/SI)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left py-1.5 font-semibold">Ach%</th>
                        <th className="text-center py-1.5 font-semibold">&lt;12%</th>
                        <th className="text-center py-1.5 font-semibold">12-15%</th>
                        <th className="text-center py-1.5 font-semibold">&gt;15%</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 font-semibold">
                      {[
                        { label: '<95%', values: [400, 500, 600] },
                        { label: '95-110%', values: [600, 800, 1000] },
                        { label: '>110%', values: [800, 1100, 1400] },
                      ].map(row => (
                        <tr key={row.label} className="border-t border-slate-50">
                          <td className="py-1.5 text-slate-500">{row.label}</td>
                          {row.values.map((v, i) => {
                            const isActive = v === data.slab_info.per_si_rate;
                            return (
                              <td key={i} className={`text-center py-1.5 ${isActive ? 'text-indigo-700 font-black bg-indigo-50 rounded' : ''}`}>
                                {formatINR(v)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Boosters */}
              {data.boosters.length > 0 && (
                <div className="card-premium p-4">
                  <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Boosters
                  </h3>
                  <div className="space-y-2">
                    {data.boosters.map((b, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <div className="text-[12px] font-semibold text-slate-700">{b.label}</div>
                          <div className="text-[10px] text-slate-400">{b.explanation}</div>
                        </div>
                        <span className="text-[13px] font-bold text-emerald-600">+{formatINR(b.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gates */}
              {data.gates.length > 0 && (
                <div className="card-premium p-4">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Gates
                  </h3>
                  <div className="space-y-2">
                    {data.gates.map((g, i) => (
                      <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${
                        g.passed ? 'bg-emerald-50' : 'bg-amber-50'
                      }`}>
                        {g.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className={`text-[12px] font-semibold ${g.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {g.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{g.explanation}</div>
                        </div>
                        <span className={`text-[11px] font-bold ${g.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {g.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Computation Breakdown */}
              <div className="px-3 py-2.5 bg-slate-100 rounded-xl space-y-1">
                {data.explanations.map((exp, i) => (
                  <p key={i} className="text-[10px] text-slate-500 leading-relaxed">{exp}</p>
                ))}
              </div>

              {/* Progress metrics */}
              <div className="card-premium p-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'SI Ach', value: `${data.meta.achieved_si}/${data.meta.target_si}` },
                    { label: 'I2SI', value: `${data.meta.achieved_i2si}%` },
                    { label: 'Day', value: `${data.meta.days_elapsed}/${data.meta.days_in_month}` },
                    { label: 'Score', value: data.meta.score },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="text-[14px] font-bold text-slate-800 tabular-nums">{m.value}</div>
                      <div className="text-[9px] text-slate-400 font-medium uppercase">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-[13px] text-slate-400">No incentive data available</div>
          )}
        </div>
      </div>
    </div>
  );
}