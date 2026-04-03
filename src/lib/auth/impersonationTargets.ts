import { ImpersonationTarget } from './types';
import { getRuntimeDBSync } from '../../data/runtimeDB';

/**
 * Impersonation targets derived from the Supabase users table.
 * No more hardcoded mock user lists.
 */

function buildTargetsFromDB(): { kams: ImpersonationTarget[]; tls: ImpersonationTarget[] } {
  const db = getRuntimeDBSync();
  const seen = new Set<string>();
  const kams: ImpersonationTarget[] = [];
  const tls: ImpersonationTarget[] = [];

  // Extract unique KAMs from dealers and leads
  db.dealers.forEach((d: any) => {
    if (d.kamId && d.kamId !== 'unassigned' && !seen.has(d.kamId)) {
      seen.add(d.kamId);
      kams.push({ userId: d.kamId, name: d.kamName || 'KAM', role: 'KAM', city: d.city || 'NCR' });
    }
  });
  db.leads.forEach((l: any) => {
    if (l.kamId && l.kamId !== 'unassigned' && !seen.has(l.kamId)) {
      seen.add(l.kamId);
      kams.push({ userId: l.kamId, name: l.kamName || 'KAM', role: 'KAM', city: l.city || 'NCR' });
    }
  });

  // TLs — derive from dealers' tlId
  const tlSeen = new Set<string>();
  db.dealers.forEach((d: any) => {
    if (d.tlId && d.tlId !== 'tl-default' && !tlSeen.has(d.tlId)) {
      tlSeen.add(d.tlId);
      tls.push({ userId: d.tlId, name: `TL-${d.tlId}`, role: 'TL', city: d.city || 'NCR' });
    }
  });

  return { kams, tls };
}

export function getImpersonationTargets(role: 'KAM' | 'TL'): ImpersonationTarget[] {
  const { kams, tls } = buildTargetsFromDB();
  return role === 'KAM' ? kams : tls;
}

export function getImpersonationTarget(userId: string): ImpersonationTarget | null {
  const { kams, tls } = buildTargetsFromDB();
  return [...kams, ...tls].find(t => t.userId === userId) || null;
}

// Legacy exports for backward compatibility
export const MOCK_KAMS: ImpersonationTarget[] = [];
export const MOCK_TLS: ImpersonationTarget[] = [];
