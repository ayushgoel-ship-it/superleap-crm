/**
 * KAMFilter — compact "All KAMs / <KAM>" dropdown.
 *
 * Sources the KAM list from useActorScope (which returns the current actor's
 * team roster). Hidden for pure KAM role (nothing to filter). For TL the list
 * is the TL's team; for Admin it's all KAMs (after any other cascade).
 *
 * On change, updates the scope context so every page consuming
 * `useActorScope().effectiveKamIds` re-filters automatically.
 */
import { useActorScope } from '../../lib/auth/useActorScope';

interface Props {
  className?: string;
  /** Show a leading label (e.g. "KAM"). Default true. */
  showLabel?: boolean;
  /** When true, wraps the control in a sticky header so it remains visible while scrolling. */
  sticky?: boolean;
}

export function KAMFilter({ className = '', showLabel = true, sticky = false }: Props) {
  const { role, teamKams, kamFilter, setKamFilter } = useActorScope();

  // Pure KAM role has no choice to make.
  if (role === 'KAM') return null;
  if (!teamKams || teamKams.length === 0) return null;

  const stickyWrap = sticky
    ? 'sticky top-0 z-20 bg-white/95 backdrop-blur-sm py-2'
    : '';

  return (
    <div className={`flex items-center gap-2 ${stickyWrap} ${className}`}>
      {showLabel && (
        <label className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
          KAM
        </label>
      )}
      <select
        value={kamFilter}
        onChange={(e) => setKamFilter(e.target.value)}
        className="text-[12px] font-medium px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
      >
        <option value="all">All KAMs ({teamKams.length})</option>
        {teamKams.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name}
          </option>
        ))}
      </select>
    </div>
  );
}
