import { describe, expect, it } from 'vitest';
import { DEFAULT_SCENARIO, SUGGESTIONS } from './defaults';
import { validateScenario } from './scenario';

describe('curated defaults', () => {
  it('provides finite valid defaults for every scenario field', () => {
    expect(validateScenario(DEFAULT_SCENARIO)).toEqual({});
    for (const [key, value] of Object.entries(DEFAULT_SCENARIO)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(SUGGESTIONS[key as keyof typeof SUGGESTIONS].value).toBe(value);
    }
  });
  it('gives observed figures a primary source and reporting period', () => {
    for (const suggestion of Object.values(SUGGESTIONS)) {
      expect(suggestion.reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(suggestion.explanation.length).toBeGreaterThan(10);
      if (suggestion.status === 'observed') {
        expect(suggestion.url).toMatch(/^https:\/\//);
        expect(suggestion.period).not.toBe('');
      }
    }
    expect(SUGGESTIONS.mortgageRatePct.value).toBe(13.5);
    expect(SUGGESTIONS.mortgageRatePct.period).toBe('2025');
  });
  it('marks property examples and forward projections as illustrative', () => {
    for (const key of ['price', 'monthlyRent', 'rentGrowthPct'] as const) {
      expect(SUGGESTIONS[key].status).toBe('illustrative');
    }
  });
});
