/**
 * @deprecated Phase 2 — Use <ChannelChip /> from /components/premium/Chip.tsx instead.
 * This file is retained only for reference. It must NOT be imported anywhere.
 *
 * Migration guide:
 *   Old:  <ChannelBadge channel="C2B" />
 *   New:  <ChannelChip channel="C2B" />
 *
 * ChannelChip uses identical color mapping (violet/blue/emerald/amber).
 */

interface ChannelBadgeProps {
  channel: 'NGS' | 'GS' | 'DCF' | string;
}

/** @deprecated — use ChannelChip from premium/Chip.tsx */
export function ChannelBadge({ channel }: ChannelBadgeProps) {
  const styles: Record<string, string> = {
    NGS: 'bg-violet-50 text-violet-700 border-violet-100',
    GS: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    DCF: 'bg-amber-50 text-amber-700 border-amber-100',
    // Legacy fallbacks
    C2B: 'bg-violet-50 text-violet-700 border-violet-100',
    C2D: 'bg-blue-50 text-blue-700 border-blue-100',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${styles[channel]}`}>
      {channel}
    </span>
  );
}
