import type { ScenarioInput } from './scenario';

export interface Suggestion {
  value: number; unit: string; status: 'observed' | 'illustrative';
  title: string; period: string; url?: string; reviewed: string; explanation: string;
}
const reviewed = '2026-09-29';
const example = (value: number, unit: string, explanation: string, url?: string): Suggestion => ({
  value, unit, status: 'illustrative', title: 'Editable scenario assumption',
  period: 'Example, not a market quote', url, reviewed, explanation,
});

export const SUGGESTIONS: Record<keyof ScenarioInput, Suggestion> = {
  price: example(12_000_000, 'KES', 'Example asking price. Replace with the price of the home you are considering.'),
  monthlyRent: example(65_000, 'KES/month', 'Example rent for a comparable home. Replace with a local rental quote.'),
  termYears: example(15, 'years', 'The comparison lasts as long as the selected mortgage term.'),
  depositPct: example(20, '%', 'Example deposit. Your lender may require a different share.'),
  mortgageRatePct: {
    value: 13.5, unit: '%/year', status: 'observed',
    title: 'CBK Bank Supervision Annual Report 2025, Residential Mortgage Survey',
    period: '2025',
    url: 'https://www.centralbank.go.ke/uploads/banking_sector_annual_reports/1241268828_ANNUAL%20REPORT%202025.pdf',
    reviewed,
    explanation: 'Average mortgage interest rate in the 2025 survey (report p. 28). Actual offers vary; most surveyed loans had variable rates.',
  },
  rentGrowthPct: example(5, '%/year', 'Forward rent increase assumption, not a measured national rent forecast.'),
  maintenancePct: example(1, '% of price/year', 'Example recurring maintenance as a share of initial purchase price.'),
  insurancePct: example(0.2, '% of price/year', 'Example annual property insurance; request an actual quote.'),
  acquisitionCostPct: example(5, '% of price', 'Example total purchase transaction costs; verify legal, valuation, tax and lender charges.'),
};

export const DEFAULT_SCENARIO: ScenarioInput = Object.fromEntries(
  Object.entries(SUGGESTIONS).map(([key, suggestion]) => [key, suggestion.value]),
) as unknown as ScenarioInput;
