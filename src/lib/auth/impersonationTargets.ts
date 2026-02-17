import { ImpersonationTarget } from './types';

/**
 * Mock list of KAMs and TLs that Admin can impersonate
 * These are "actor profiles" - they may or may not have auth credentials
 */

export const MOCK_KAMS: ImpersonationTarget[] = [
  {
    userId: 'kam-rajesh',
    name: 'Rajesh Kumar',
    role: 'KAM',
    city: 'Gurgaon',
  },
  {
    userId: 'kam-amit',
    name: 'Amit Singh',
    role: 'KAM',
    city: 'Delhi',
  },
  {
    userId: 'kam-priya',
    name: 'Priya Mehta',
    role: 'KAM',
    city: 'Noida',
  },
  {
    userId: 'kam-vikram',
    name: 'Vikram Patel',
    role: 'KAM',
    city: 'Bangalore',
  },
  {
    userId: 'kam-sneha',
    name: 'Sneha Reddy',
    role: 'KAM',
    city: 'Hyderabad',
  },
];

export const MOCK_TLS: ImpersonationTarget[] = [
  {
    userId: 'tl-priya',
    name: 'Priya Sharma',
    role: 'TL',
    city: 'Gurgaon',
  },
  {
    userId: 'tl-rahul',
    name: 'Rahul Verma',
    role: 'TL',
    city: 'Delhi',
  },
  {
    userId: 'tl-anjali',
    name: 'Anjali Kapoor',
    role: 'TL',
    city: 'Bangalore',
  },
  {
    userId: 'tl-suresh',
    name: 'Suresh Kumar',
    role: 'TL',
    city: 'Mumbai',
  },
];

export function getImpersonationTargets(role: 'KAM' | 'TL'): ImpersonationTarget[] {
  return role === 'KAM' ? MOCK_KAMS : MOCK_TLS;
}

export function getImpersonationTarget(userId: string): ImpersonationTarget | null {
  const allTargets = [...MOCK_KAMS, ...MOCK_TLS];
  return allTargets.find(t => t.userId === userId) || null;
}
