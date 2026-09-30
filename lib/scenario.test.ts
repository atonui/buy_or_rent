import { describe, expect, it } from 'vitest';
import { amortize, mortgagePayment, validateScenario, type ScenarioInput } from './scenario';

const base: ScenarioInput = {
  price: 1_200_000, monthlyRent: 10_000, termYears: 1, depositPct: 20,
  mortgageRatePct: 0, rentGrowthPct: 0,
  maintenancePct: 0, insurancePct: 0,
  acquisitionCostPct: 0,
};

describe('mortgage schedule', () => {
  it('amortizes zero interest evenly', () => {
    const rows = amortize(1_200_000, 0, 12);
    expect(rows).toHaveLength(12);
    expect(rows[0].principalPaid).toBeCloseTo(100_000);
    expect(rows.every(row => row.interest === 0)).toBe(true);
    expect(rows[11].balance).toBe(0);
  });
  it('has no payment for a full deposit', () => {
    expect(mortgagePayment(0, 14.9, 12)).toBe(0);
    expect(amortize(0, 14.9, 12).every(row => row.balance === 0 && row.payment === 0)).toBe(true);
  });
  it('ends a positive-rate schedule without a negative balance', () => {
    const rows = amortize(1_000_000, 14.9, 180);
    expect(rows.at(-1)?.balance).toBe(0);
    expect(rows.every(row => row.principalPaid >= 0 && row.balance >= 0)).toBe(true);
  });
});

describe('scenario validation', () => {
  it.each([
    ['price', 0], ['monthlyRent', Number.NaN], ['termYears', 0],
    ['depositPct', 101],
  ] as const)('rejects %s = %s', (key, value) => {
    expect(validateScenario({ ...base, [key]: value })[key]).toBeTruthy();
  });
  it('accepts a finite zero-rate scenario', () => {
    expect(validateScenario(base)).toEqual({});
  });
});

import { calculateScenario } from './scenario';

describe('rent versus own comparison', () => {
  it('compares total cash paid for the same year', () => {
    const x = calculateScenario({ ...base, depositPct: 100, monthlyRent: 100_000 });
    expect(x.ownerCashPaid).toBeCloseTo(1_200_000);
    expect(x.renterCashPaid).toBeCloseTo(1_200_000);
    expect(x.rentPaid).toBeCloseTo(1_200_000);
    expect(x.annual).toHaveLength(1);
  });
  it('counts deposit and mortgage principal once', () => {
    const x = calculateScenario(base);
    expect(x.ownerCashPaid).toBeCloseTo(1_200_000);
    expect(x.renterCashPaid).toBeCloseTo(120_000);
    expect(x.deposit).toBeCloseTo(240_000);
    expect(x.principalPaid).toBeCloseTo(960_000);
  });
  it('steps rent up after month twelve', () => {
    const x = calculateScenario({ ...base, termYears: 2, monthlyRent: 100, rentGrowthPct: 10 });
    expect(x.annual[0].renterCashPaid).toBeCloseTo(1_200);
    expect(x.annual[1].renterCashPaid).toBeCloseTo(2_520);
    expect(x.finalMonthlyRent).toBeCloseTo(110);
  });
  it('matches a hand-calculated cash scenario without double counting', () => {
    const x = calculateScenario({ ...base, price: 1_200, monthlyRent: 50, depositPct: 25, acquisitionCostPct: 5 });
    expect(x.ownerCashPaid).toBeCloseTo(1_260);
    expect(x.renterCashPaid).toBeCloseTo(600);
    expect(x.principalPaid).toBeCloseTo(900);
    expect(x.interestPaid).toBe(0);
  });
  it('refuses invalid input before calculation', () => {
    expect(() => calculateScenario({ ...base, price: 0 })).toThrow(/price/i);
  });
});
