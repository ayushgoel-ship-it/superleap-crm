/**
 * Smoke tests — verify that core domain modules import and expose
 * expected top-level symbols. These tests are intentionally shallow;
 * they guard against build-level regressions (broken imports, renamed
 * exports) rather than business logic.
 */

import { describe, it, expect } from 'vitest';

import { ProductivityStatus, TimePeriod } from '../lib/domain/constants';
import { ROUTES } from '../navigation/routes';
import { ROLE_CONFIGS } from '../navigation/roleConfig';
import {
  computeCallProductivity,
  computeVisitProductivity,
} from '../lib/productivity/productivityService';

describe('domain constants', () => {
  it('ProductivityStatus has the three canonical values', () => {
    expect(ProductivityStatus.PRODUCTIVE).toBe('productive');
    expect(ProductivityStatus.NON_PRODUCTIVE).toBe('non_productive');
    expect(ProductivityStatus.PROVISIONAL).toBe('provisional');
  });

  it('TimePeriod includes MTD and LMTD', () => {
    expect(TimePeriod.MTD).toBe('MTD');
    expect(TimePeriod.LMTD).toBe('LMTD');
  });
});

describe('navigation', () => {
  it('ROUTES exposes the admin routes added to AppRoute', () => {
    expect(ROUTES.ADMIN_USERS).toBeDefined();
    expect(ROUTES.ADMIN_TARGETS).toBeDefined();
    expect(ROUTES.ADMIN_REPORTS).toBeDefined();
  });

  it('ROLE_CONFIGS covers every role including SUPER_ADMIN', () => {
    expect(ROLE_CONFIGS.KAM).toBeDefined();
    expect(ROLE_CONFIGS.TL).toBeDefined();
    expect(ROLE_CONFIGS.Admin).toBeDefined();
    expect(ROLE_CONFIGS.ADMIN).toBeDefined();
    expect(ROLE_CONFIGS.SUPER_ADMIN).toBeDefined();
  });
});

describe('productivity service', () => {
  const emptyActivity = {
    dealerId: 'd-1',
    leads: [],
    inspections: [],
    stockIns: [],
    dcfOnboarding: [],
    dcfLeads: [],
    dcfDisbursals: [],
  };

  it('marks a long-past call with no activity as NON_PRODUCTIVE', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString();
    const ev = computeCallProductivity(past, emptyActivity);
    expect(ev.isProductive).toBe(false);
    expect(ev.status).toBe(ProductivityStatus.NON_PRODUCTIVE);
  });

  it('marks a very recent visit with no activity as PROVISIONAL', () => {
    const recent = new Date().toISOString();
    const ev = computeVisitProductivity(recent, emptyActivity);
    expect(ev.isProductive).toBe(false);
    expect(ev.status).toBe(ProductivityStatus.PROVISIONAL);
  });
});
