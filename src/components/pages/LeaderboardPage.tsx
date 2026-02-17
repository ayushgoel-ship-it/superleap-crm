/**
 * LEADERBOARD PAGE — Premium KAM + TL Ranking
 *
 * Features:
 *   - Your Rank hero card (progress ring + behind text)
 *   - Toggle chips: Today, D-1, MTD, LMTD
 *   - Top 3 podium
 *   - Full rankings with LMTD micro-trend markers
 *   - KAM + TL scope toggle
 *   - API-driven via GET /v1/leaderboard
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy, TrendingUp, TrendingDown, Target, Zap,
  ChevronDown, Crown, Medal, Award, BarChart3, Users,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import type { UserRole } from '../../lib/shared/appTypes';
import { getLeaderboard } from '../../lib/api/crmApi';
import type { LeaderboardResponse, LeaderboardEntry } from '../../lib/api/crmApi';
import { toast } from 'sonner@2.0.3';
import { TimePeriod } from '../../lib/domain/constants';

type Scope = 'kam' | 'tl';

interface LeaderboardPageProps {
  userRole: UserRole;
}

// ── Helpers ──

function formatINR(n: number): string {
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(0)}K`;
  return `\u20B9${n}`;
}

// SVG Progress Ring
function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        className="text-slate-100" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)"
        strokeWidth={6} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out" />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// LMTD Trend Marker
function TrendMarker({ delta }: { delta: number }) {
  if (Math.abs(delta) < 2) return null;
  const isUp = delta > 0;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  const color = isUp ? 'text-emerald-600' : 'text-rose-500';
  return (
    <span className={`inline-flex items-center gap-0.5 ${color}`}>
      <Icon className="w-2.5 h-2.5" />
      <span className="text-[9px] font-bold tabular-nums">{Math.abs(delta)}%</span>
    </span>
  );
}

// Podium icon
function PodiumIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  return <Award className="w-5 h-5 text-amber-700" />;
}

const PERIOD_CHIPS: { key: TimePeriod; label: string }[] = [
  { key: TimePeriod.MTD, label: 'MTD' },
  { key: TimePeriod.D_MINUS_1, label: 'D-1' },
  { key: TimePeriod.LAST_7D, label: 'L7D' },
  { key: TimePeriod.LMTD, label: 'LMTD' },
];

// ── Component ──

export function LeaderboardPage({ userRole }: LeaderboardPageProps) {
  const [period, setPeriod] = useState<TimePeriod>(TimePeriod.MTD);
  const [scope, setScope] = useState<Scope>(userRole === 'TL' || userRole === 'Admin' ? 'tl' : 'kam');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLeaderboard({
        scope,
        timeScope: period,
      });
      setData(result);
    } catch (err) {
      // Silently fall back to mock data — backend may not be available in demo/prototype
      console.warn('[Leaderboard] API unavailable, using demo data');
      setData(generateMockData(scope));
    } finally {
      setLoading(false);
    }
  }, [scope, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const myRank = data?.your_rank_card;
  const top3 = data?.top3 || [];
  const fullList = data?.full_list || [];

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa]">
      {/* ═══ HEADER ═══ */}
      <div className="glass-nav border-b border-slate-200/60 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-[16px] font-bold text-slate-900">Leaderboard</h1>
              <p className="text-[11px] text-slate-400 font-medium">{scope === 'kam' ? 'KAM Rankings' : 'TL Rankings'}</p>
            </div>
          </div>

          {/* Scope toggle (visible for TL/Admin) */}
          {(userRole === 'TL' || userRole === 'Admin') && (
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['kam', 'tl'] as Scope[]).map(s => (
                <button key={s} onClick={() => setScope(s)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all min-h-[32px] ${
                    scope === s ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                  }`}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Period chips */}
        <div className="flex gap-2">
          {PERIOD_CHIPS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all min-h-[32px] ${
                period === p.key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200/50'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {/* ═══ YOUR RANK HERO ═══ */}
            {myRank && (
              <div className="card-premium p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 p-5 text-white">
                  <div className="flex items-center gap-4">
                    {/* Progress Ring */}
                    <div className="relative flex-shrink-0">
                      <ProgressRing pct={myRank.percentile} size={76} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-[20px] font-black leading-none">#{myRank.rank}</div>
                          <div className="text-[9px] font-medium text-indigo-200 mt-0.5">of {myRank.total}</div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-indigo-200 font-medium mb-1">Your Ranking</div>
                      <div className="text-[13px] font-bold text-white/90 leading-snug mb-2">
                        {myRank.behind_text}
                      </div>
                      <div className="text-[10px] text-indigo-200 font-medium">
                        Score: <span className="text-white font-bold">{myRank.score}</span> &middot;
                        Top {myRank.percentile}%
                      </div>
                    </div>
                  </div>

                  {/* KPI chips */}
                  <div className="flex gap-2 mt-4">
                    {[
                      { label: 'Stock-ins', value: myRank.stock_ins, icon: Target },
                      { label: 'I2SI%', value: `${myRank.i2si_pct}%`, icon: BarChart3 },
                      { label: 'DCF Disb.', value: myRank.dcf_disbursed, icon: Zap },
                    ].map(kpi => (
                      <div key={kpi.label} className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl px-2.5 py-2 text-center">
                        <div className="text-[14px] font-bold text-white">{kpi.value}</div>
                        <div className="text-[9px] text-indigo-200 font-medium mt-0.5">{kpi.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TOP 3 PODIUM ═══ */}
            {top3.length > 0 && (
              <div className="card-premium p-4">
                <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Top Performers</h3>
                <div className="flex gap-2">
                  {/* Reorder for podium: 2nd, 1st, 3rd */}
                  {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, idx) => {
                    const isFirst = entry.rank === 1;
                    return (
                      <div key={entry.id}
                        className={`flex-1 text-center rounded-xl p-3 transition-all ${
                          isFirst
                            ? 'bg-gradient-to-b from-amber-50 to-amber-100/50 border border-amber-200 -mt-2'
                            : 'bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <PodiumIcon rank={entry.rank} />
                        <div className={`text-[12px] font-bold mt-1.5 truncate ${isFirst ? 'text-amber-800' : 'text-slate-700'}`}>
                          {entry.name.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{entry.city || entry.region}</div>
                        <div className={`text-[15px] font-black mt-1 ${isFirst ? 'text-amber-700' : 'text-slate-800'}`}>
                          {entry.stock_ins}
                        </div>
                        <div className="text-[9px] text-slate-400">SI</div>
                        {entry.is_current_user && (
                          <div className="mt-1 text-[8px] font-bold text-indigo-600 bg-indigo-50 rounded px-1.5 py-0.5">YOU</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ FULL RANKINGS ═══ */}
            <div className="card-premium overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Full Rankings ({fullList.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-50">
                {fullList.map(entry => (
                  <div key={entry.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      entry.is_current_user ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-black flex-shrink-0 ${
                      entry.rank <= 3
                        ? entry.rank === 1 ? 'bg-amber-100 text-amber-700'
                          : entry.rank === 2 ? 'bg-slate-200 text-slate-600'
                          : 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {entry.rank}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[13px] font-semibold truncate ${
                          entry.is_current_user ? 'text-indigo-700' : 'text-slate-800'
                        }`}>
                          {entry.name}
                        </span>
                        {entry.is_current_user && (
                          <span className="text-[8px] font-bold text-indigo-600 bg-indigo-100 rounded px-1 py-0.5 flex-shrink-0">YOU</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{entry.city || entry.region}</span>
                        <TrendMarker delta={entry.lmtd_delta} />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-[14px] font-bold text-slate-800 tabular-nums">{entry.stock_ins}</div>
                        <div className="text-[9px] text-slate-400">SI</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12px] font-semibold text-slate-600 tabular-nums">{entry.i2si_pct}%</div>
                        <div className="text-[9px] text-slate-400">I2SI</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[12px] font-semibold text-violet-600 tabular-nums">{entry.dcf_disbursed}</div>
                        <div className="text-[9px] text-slate-400">DCF</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {data?.notes && (
              <div className="px-3 py-2 bg-slate-100 rounded-xl">
                <p className="text-[10px] text-slate-500 leading-relaxed">{data.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mock data fallback ──

function generateMockData(scope: Scope): LeaderboardResponse {
  const names = scope === 'kam'
    ? ['Amit Verma', 'Sneha Kapoor', 'Rohan Desai', 'Karthik Reddy', 'Kavita Patil', 'Vikram Malhotra', 'Anjali Nair', 'Rahul Bose', 'Priyanka Das', 'Priya Sharma']
    : ['Rajesh Kumar', 'Amit Sharma', 'Priya Iyer', 'Neha Singh', 'Suresh Ghosh'];

  const cities = scope === 'kam'
    ? ['Gurgaon', 'Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Noida', 'Chennai', 'Kolkata', 'Bhubaneswar', 'Faridabad']
    : ['NCR', 'West', 'South', 'NCR', 'East'];

  const fullList: LeaderboardEntry[] = names.map((name, i) => {
    const si = Math.max(1, 28 - i * 3);
    const insp = Math.max(1, 45 - i * 4);
    const dcf = Math.max(0, 8 - i);
    return {
      rank: i + 1,
      id: `${scope}-${i}`,
      name,
      city: cities[i],
      region: cities[i],
      stock_ins: si,
      i2si_pct: Math.round((si / insp) * 1000) / 10,
      dcf_disbursed: dcf,
      stockin_equiv: si + 3 * dcf,
      projected_achievement_pct: Math.round(Math.min((si / 30) * 100, 150)),
      score: Math.round(90 - i * 7),
      lmtd_delta: Math.round((Math.random() - 0.3) * 20),
      is_current_user: i === 0,
    };
  });

  const my = fullList[0];
  return {
    your_rank_card: {
      rank: my.rank,
      total: fullList.length,
      percentile: Math.round((1 - (my.rank - 1) / fullList.length) * 100),
      behind_text: "You're #1!",
      stock_ins: my.stock_ins,
      i2si_pct: my.i2si_pct,
      dcf_disbursed: my.dcf_disbursed,
      stockin_equiv: my.stockin_equiv,
      projected_achievement_pct: my.projected_achievement_pct,
      score: my.score,
    },
    top3: fullList.slice(0, 3),
    full_list: fullList,
    notes: 'Rank = 60% SI-equiv (SI + 3×DCF) + 40% projected achievement%. Showing mock data.',
  };
}