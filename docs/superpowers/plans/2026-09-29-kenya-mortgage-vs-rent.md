# Kenya Mortgage Versus Rent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a Kenya-focused, editable 15-year mortgage versus rent calculator with equal cash-paid and ending-wealth views.

**Architecture:** A static React/TypeScript Site stores scenario input in browser state. A pure monthly calculation module supplies annual series and summaries; a separate reviewed defaults module contains values and provenance. The page renders accessible inputs, results, chart, breakdown and sources without a backend.

**Tech Stack:** Sites static Vinext starter (React, TypeScript), Vitest for pure calculation and data tests, SVG for chart, CSS for responsive layout.

**Spec:** `docs/superpowers/specs/2026-09-29-kenya-mortgage-vs-rent-design.md`

## Global Constraints

- Default term is 15 years; all suggested figures are editable and resettable.
- Show cumulative nominal cash paid and ending net wealth with equal prominence.
- Mortgage rate is fixed over the selected term; annual nominal rate divided by 12.
- Month-zero renter capital equals buyer deposit plus acquisition costs; monthly budget differences flow into renter investments at month end.
- National statistics are context, not a property quotation; purchase price and comparable rent are visibly illustrative examples until changed.
- No accounts, live scraping, backend storage, taxes, variable rates, or investment fees in version one.
- Source title, reporting period, URL, review date and observed/illustrative status accompany each suggested value; actual figures must be verified against current primary publications during implementation.
- Use the Sites registration, preview, build and publishing sequence for the finished website.

## Review Focus

1. Zero mortgage rate must yield straight-line principal and no interest (Task 1).
2. A 100% deposit must yield zero monthly mortgage payment and balance (Task 1).
3. Negative annual investment return greater than −100% must remain finite and reduce balance (Task 2).
4. Very high rent can drive the renter balance negative; show that funding shortfall explicitly, without clipping it to zero (Tasks 2 and 4).
5. Empty, nonfinite, out-of-range and zero purchase-price inputs must block results with a field error (Tasks 1 and 4).

## File map

- `lib/scenario.ts`: input/result types, validation, mortgage amortization and annual result series.
- `lib/scenario.test.ts`: pure math and boundary tests.
- `lib/defaults.ts`: dated suggestions and provenance, separate from the math.
- `lib/defaults.test.ts`: provenance completeness and range checks.
- `app/page.tsx`: input state, result cards, explanation, sources and page composition.
- `components/ScenarioFields.tsx`: accessible editable fields, reset control and inline errors.
- `components/ComparisonChart.tsx`: accessible SVG annual chart with textual table fallback.
- `app/globals.css`: shared theme and responsive layout.
- `app/layout.tsx`, `public/favicon.svg`: title, description and site icon.
- `.openai/hosting.json`: Sites static output configuration created by the supported setup flow.

---

### Task 1: Mortgage schedule and validation

**Files:** Create `lib/scenario.ts`, `lib/scenario.test.ts`; incorporate project/test setup needed to run tests.

**Interfaces:**
- Produces `ScenarioInput` with `price`, `monthlyRent`, `termYears`, `depositPct`, `mortgageRatePct`, `rentGrowthPct`, `appreciationPct`, `investmentReturnPct`, `maintenancePct`, `insurancePct`, `acquisitionCostPct`, `saleCostPct` (all numbers).
- Produces `validateScenario(input: ScenarioInput): Partial<Record<keyof ScenarioInput, string>>`.
- Produces `mortgagePayment(principal: number, annualRatePct: number, months: number): number` and `amortize(principal: number, annualRatePct: number, months: number): { payment: number; interest: number; principalPaid: number; balance: number }[]`.

- [ ] **Step 1: Write failing tests** in `lib/scenario.test.ts`: 1,200,000 principal over 12 months at zero interest gives 100,000 monthly principal, zero interest and zero final balance; zero principal gives all-zero schedule; a positive-rate schedule pays off within a cent without negative principal; `validateScenario` rejects `price=0`, `monthlyRent=NaN`, `termYears=0`, `depositPct=101`, `investmentReturnPct=-100` and accepts finite values including zero mortgage rate.
- [ ] **Step 2: Run** `npx vitest run lib/scenario.test.ts`; expect failures for undefined exports.
- [ ] **Step 3: Implement** the declared interfaces. Allow term 1–40 integer years, price >0, rent >=0, deposit 0–100%, mortgage/rent growth/appreciation/maintenance/insurance/acquisition/sale rates >=0 and <=100%, and investment return >−100% and <=100%. Cap final principal payment to remaining balance.
- [ ] **Step 4: Run** `npx vitest run lib/scenario.test.ts`; expect pass.
- [ ] **Step 5: Commit** math and tests with `git commit -m "feat: add mortgage schedule and scenario validation"`.

### Task 2: Monthly comparison and annual results

**Files:** Modify `lib/scenario.ts`, `lib/scenario.test.ts`.

**Interfaces:**
- Consumes `ScenarioInput`, `validateScenario`, `amortize` from Task 1.
- Produces `calculateScenario(input: ScenarioInput): ScenarioResult`, throwing a descriptive validation error for invalid input.
- `ScenarioResult` has `monthlyPayment`, `ownerCashPaid`, `renterCashPaid`, `ownerNetWealth`, `renterNetWealth`, `deposit`, `acquisitionCosts`, `interestPaid`, `principalPaid`, `ownerRunningCosts`, `rentPaid`, `homeValue`, `sellingCosts`, `renterInvestmentBalance`, and `annual: AnnualPoint[]`. Each `AnnualPoint` has `year`, `ownerCashPaid`, `renterCashPaid`, `ownerNetWealth`, `renterNetWealth`.

- [ ] **Step 1: Write failing tests**: with price 1,200,000, rent 100,000/month, 100% deposit, zero all rates/costs, one year, assert owner cash 1,200,000, renter cash 1,200,000, renter wealth zero, owner wealth 1,200,000 and one annual point. Separately test 0% deposit, zero mortgage interest, rent 10,000, price 1,200,000, zero other rates, one year: owner cash 1,200,000, renter cash 120,000, renter investment 1,080,000, owner wealth 1,200,000. Test rent growth occurs in month 13, not month 12; a −10% return reduces initial alternative capital over 12 months; rent exceeding the equal budget drives renter investment below zero. For an independent hand fixture use price 1,200, rent 50/month, deposit 25%, acquisition 5%, sale 10%, one year, zero all other rates/costs: owner cash 1,260, renter cash 600, renter wealth 660, owner wealth 1,080, principal paid 900, interest zero.
- [ ] **Step 2: Run** `npx vitest run lib/scenario.test.ts`; expect new tests to fail.
- [ ] **Step 3: Implement** `calculateScenario`. At month zero invest deposit plus acquisition costs on the renter path. Accrue investments monthly before adding the monthly owner-minus-renter outlay. Grow home value monthly at the effective rate. Record an annual point after each twelfth month. Sum sale costs only into ending owner net wealth.
- [ ] **Step 4: Run** `npx vitest run lib/scenario.test.ts`; expect pass, including the independent hand fixture.
- [ ] **Step 5: Commit** with `git commit -m "feat: calculate owner and renter outcomes"`.

### Task 3: Curated Kenyan suggestions

**Files:** Create `lib/defaults.ts`, `lib/defaults.test.ts`.

**Interfaces:**
- Produces `DEFAULT_SCENARIO: ScenarioInput` and `SUGGESTIONS: Record<keyof ScenarioInput, { value: number; unit: string; status: 'observed' | 'illustrative'; title: string; period: string; url?: string; reviewed: string; explanation: string }>`.
- `DEFAULT_SCENARIO` values exactly mirror `SUGGESTIONS` values.

- [ ] **Step 1: Check primary publications**: verify the latest CBK mortgage-specific average rate and report period; inspect KNBS RPPI/KBA HPI for context. Record source URLs and review date. If a newer report lacks a mortgage-specific number, explicitly use the latest verified mortgage survey rather than the general lending rate.
- [ ] **Step 2: Write failing data tests** asserting every scenario key has a finite suggestion, `DEFAULT_SCENARIO` validates, every observed value has a primary-source URL and reporting period, and example purchase price/rent plus forward-looking growth/return figures have `illustrative` status.
- [ ] **Step 3: Run** `npx vitest run lib/defaults.test.ts`; expect failure for missing module.
- [ ] **Step 4: Implement** the suggestions with reviewed figures and honest labels; acquisition, maintenance, insurance, appreciation, rent growth and return are illustrative unless a directly comparable observation is verified. Do not present a historic index change as a forecast.
- [ ] **Step 5: Run** `npx vitest run lib/defaults.test.ts`; expect pass; commit with `git commit -m "feat: add sourced Kenya scenario defaults"`.

### Task 4: Editable comparison page

**Files:** Create `components/ScenarioFields.tsx`, `components/ComparisonChart.tsx`; modify `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `public/favicon.svg`.

**Interfaces:** Consumes `DEFAULT_SCENARIO`, `SUGGESTIONS`, `validateScenario`, `calculateScenario`, `ScenarioInput`, `ScenarioResult`. `ScenarioFields` accepts `value`, `errors`, `onChange(key, value)` and `onReset`; `ComparisonChart` accepts `annual: AnnualPoint[]`.

- [ ] **Step 1: Write a failing user-flow check** (component test if supported by starter, otherwise a scripted browser check) for editing rent, changing a result, resetting it, and entering blank/invalid price to show a field error instead of results. Include a check that the negative renter balance is labeled “funding shortfall.”
- [ ] **Step 2: Run the check** and observe the missing controls/results fail.
- [ ] **Step 3: Implement** the primary inputs, equal cash and wealth cards, expandable assumptions, numeric breakdown, yearly SVG chart with textual data table, sources panel and methodology copy. Keep raw field strings until validation so empty input is not coerced to zero. Use `Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })`, clear accessible labels, keyboard-friendly controls and responsive CSS. Provide reset. Distinguish observed versus illustrative defaults visibly and include source periods.
- [ ] **Step 4: Set** page metadata and a site-specific SVG favicon. Run the user-flow check and `npm run build`; expect both to pass. Inspect phone and desktop and correct any broken layout or chart labeling.
- [ ] **Step 5: Commit** with `git commit -m "feat: build mortgage versus rent comparison page"`.

### Task 5: Site delivery and end-to-end verification

**Files:** Modify `.openai/hosting.json` only as required by Sites' supported static setup; no new application subsystem.

**Interfaces:** Consumes the complete static build and Sites hosting flow.

- [ ] **Step 1: Run** all tests and the production build; record actual output, not a claimed pass.
- [ ] **Step 2: Review** the five Review Focus cases, the source links and dates, year 15 totals, mobile/desktop behavior and screen-reader-readable numeric fallback. Compare a hand-calculated fixture with the rendered page.
- [ ] **Step 3: Use** Sites hosting to save and publish the complete static Site, then confirm terminal deployment status and working public URL.
- [ ] **Step 4: Report** the URL, the key assumptions and any known limits; commit any hosting configuration changes with `git commit -m "chore: configure static site publishing"`.
