/**
 * @deprecated Phase 2 — Use <StatusChip /> from /components/premium/Chip.tsx instead.
 * This file is retained only for reference. It must NOT be imported anywhere.
 *
 * Migration guide:
 *   Old:  <StatusBadge status="Active" />
 *   New:  <StatusChip label="Active" variant="success" dot />
 *
 * The StatusChip automatically maps variant via its `variant` prop:
 *   success → emerald, warning → amber, danger → rose, info → sky
 */

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

/** @deprecated — use StatusChip from premium/Chip.tsx */
export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const getVariantFromStatus = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('success') || lowerStatus.includes('completed') || lowerStatus.includes('approved') || lowerStatus.includes('active') || lowerStatus.includes('disbursed') || lowerStatus.includes('stocked')) {
      return 'success';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('progress') || lowerStatus.includes('inspection')) {
      return 'warning';
    }
    if (lowerStatus.includes('reject') || lowerStatus.includes('lost') || lowerStatus.includes('failed')) {
      return 'error';
    }
    return 'info';
  };

  const actualVariant = variant === 'default' ? getVariantFromStatus(status) : variant;

  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    info: 'bg-sky-50 text-sky-700 border-sky-100',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[actualVariant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full
        ${actualVariant === 'success' ? 'bg-emerald-500' :
          actualVariant === 'warning' ? 'bg-amber-500' :
          actualVariant === 'error' ? 'bg-rose-500' : 'bg-sky-500'}
      `} />
      {status}
    </span>
  );
}
