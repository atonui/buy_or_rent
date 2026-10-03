'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScenarioFields, FIELD_NAMES } from '../components/ScenarioFields';
import { ComparisonChart } from '../components/ComparisonChart';
import { DEFAULT_SCENARIO, SUGGESTIONS } from '../lib/defaults';
import { calculateScenario, validateScenario, type ScenarioInput } from '../lib/scenario';

const money = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
const initial = () => Object.fromEntries(Object.entries(DEFAULT_SCENARIO).map(([key, value]) => [key, String(value)])) as Record<keyof ScenarioInput, string>;
type AnalyticsWindow = Window & { plausible?: (event: string) => void };
function recordOnce(event: 'Comparison Started' | 'Comparison Completed') {
  const tracker = (window as AnalyticsWindow).plausible;
  if (!tracker) return;
  const key = `buy-or-rent:${event}`;
  if (sessionStorage.getItem(key)) return;
  tracker(event);
  sessionStorage.setItem(key, '1');
}

export default function Home() {
  const [fields, setFields] = useState(initial);
  const [edited, setEdited] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const changeField = (key: keyof ScenarioInput, value: string) => {
    recordOnce('Comparison Started');
    setEdited(true);
    setFields(previous => ({ ...previous, [key]: value }));
  };
  useEffect(() => {
    if (!resultsRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => setResultsVisible(entries.some(entry => entry.isIntersecting)), { threshold: 0.25 });
    observer.observe(resultsRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const keys = Object.keys(DEFAULT_SCENARIO) as (keyof ScenarioInput)[];
    const properties = Object.fromEntries(keys.map(key => [key, { type: 'number' }]));
    try {
      void Promise.resolve(context.registerTool({
        name: 'configure_housing_scenario', title: 'Configure mortgage and rent scenario',
        description: 'Change one or more calculator assumptions and update the visible Kenya mortgage versus rent comparison.',
        inputSchema: { type: 'object', properties, minProperties: 1, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(candidate: unknown) {
          if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Provide scenario fields');
          const changes = candidate as Record<string, unknown>;
          const next = { ...fields };
          for (const [key, value] of Object.entries(changes)) {
            if (!keys.includes(key as keyof ScenarioInput) || typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid ${key}`);
            next[key as keyof ScenarioInput] = String(value);
          }
          if (!Object.keys(changes).length) throw new Error('Provide at least one field');
          const numeric = Object.fromEntries(Object.entries(next).map(([key, value]) => [key, Number(value)])) as unknown as ScenarioInput;
          const fieldErrors = validateScenario(numeric);
          if (Object.keys(fieldErrors).length) throw new Error(`Invalid ${Object.keys(fieldErrors).join(', ')}`);
          const totals = calculateScenario(numeric);
          recordOnce('Comparison Started');
          setEdited(true);
          setFields(next);
          return { ownerCashPaid: totals.ownerCashPaid, renterCashPaid: totals.renterCashPaid };
        },
      }, { signal: lifecycle.signal })).catch(() => {});
    } catch { /* Optional browser capability. The visible calculator remains available. */ }
    return () => lifecycle.abort();
  }, [fields]);
  const input = useMemo(() => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim() === '' ? NaN : Number(value)])) as unknown as ScenarioInput, [fields]);
  const errors = validateScenario(input);
  const valid = Object.keys(errors).length === 0;
  const result = valid ? calculateScenario(input) : null;
  const year = valid ? input.termYears : DEFAULT_SCENARIO.termYears;
  useEffect(() => {
    if (!edited || !valid || !resultsVisible) return;
    const timer = window.setTimeout(() => recordOnce('Comparison Completed'), 3000);
    return () => window.clearTimeout(timer);
  }, [edited, valid, resultsVisible, fields]);
  return <main className="site-shell">
    <header className="site-header"><div className="brand"><span className="brand-mark" aria-hidden="true"><span /></span><span>buy or rent?</span></div><a href="#methodology">How it works <span aria-hidden="true">↗</span></a></header>
    <div className="intro"><div><p className="eyebrow"><span className="eyebrow-dot" /> KENYA HOUSING DECISIONS</p><h1>Mortgage vs rent<br /><span>in Kenya.</span></h1><p>Compare what it costs to buy or rent the same property over {year} years. Change the numbers to match a home you are considering.</p></div><div className="intro-note"><strong>15</strong><span>years is the starting point.<br />Change it to match your mortgage.</span></div></div>
    <div className="workspace-grid">
      <ScenarioFields value={fields} errors={errors} onChange={changeField} onReset={() => setFields(initial())} />
      <section className="results" aria-label="Comparison results" ref={resultsRef}>
        {result ? <>
          <div className="result-intro"><p className="eyebrow">AT YEAR {year}</p><h2>Cash paid over {year} years</h2><p>Compare the total cash you would pay to buy or rent a comparable home over the same period.</p></div>
          <div className="result-card"><div className="card-top"><span className="card-icon cash-icon" aria-hidden="true">↗</span><span>CASH PAID</span></div><h3>Total out of pocket</h3><div className="comparison-row"><div><span>Buy</span><strong>{money.format(result.ownerCashPaid)}</strong><small>You own the home at the end.</small></div><div><span>Rent</span><strong data-testid="renter-cash">{money.format(result.renterCashPaid)}</strong></div></div><p>{result.ownerCashPaid > result.renterCashPaid ? `Buying uses ${money.format(result.ownerCashPaid - result.renterCashPaid)} more cash.` : `Renting uses ${money.format(result.renterCashPaid - result.ownerCashPaid)} more cash.`}</p><p className="result-assumptions">Calculated using {input.rentGrowthPct}% annual rent growth and a fixed {input.mortgageRatePct}% mortgage rate.</p></div>
          <p className="ownership-note">Buying leaves you owning the property at the end of the mortgage. These totals compare cash paid; they do not subtract the property’s value.</p>
          <div className="payment-strip"><span>Indicative monthly mortgage payment</span><strong>{money.format(result.monthlyPayment)}</strong></div>
        </> : <div className="invalid-panel" role="status"><h2>Check your inputs</h2><p>Fix the highlighted fields to see the comparison.</p></div>}
      </section>
    </div>
    {result && <><ComparisonChart annual={result.annual} /><section className="breakdown" aria-labelledby="breakdown-title"><div><p className="eyebrow">BEHIND THE TOTALS</p><h2 id="breakdown-title">Where the money goes</h2><p>Mortgage principal is included in mortgage payments. Both totals cover the same property over the same period.</p></div><div className="breakdown-grid"><div className="breakdown-card"><h3>Buying</h3><dl>{[['Deposit', result.deposit], ['Purchase costs', result.acquisitionCosts], ['Mortgage principal', result.principalPaid], ['Mortgage interest', result.interestPaid], ['Maintenance & insurance', result.ownerRunningCosts]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{money.format(value as number)}</dd></div>)}</dl></div><div className="breakdown-card"><h3>Renting</h3><dl><div><dt>Total rent paid</dt><dd>{money.format(result.rentPaid)}</dd></div><div><dt>Starting monthly rent</dt><dd>{money.format(input.monthlyRent)}</dd></div><div><dt>Final monthly rent</dt><dd>{money.format(result.finalMonthlyRent)}</dd></div></dl><p>Total rent adds every monthly payment over {year} years, including the annual rent increase you entered. The starting and final amounts are monthly figures, not extra costs.</p></div></div></section></>}
    <section className="seo-guide" aria-labelledby="guide-title"><p className="eyebrow">THE COMPARISON EXPLAINED</p><h2 id="guide-title">How does the mortgage vs rent calculator work?</h2><div className="guide-grid"><div><h3>What does renting cost over the mortgage term?</h3><p>Enter the monthly rent for a comparable property. The calculator adds every rent payment for the selected number of years. If you enter annual rent growth, the monthly rent rises after each 12-month period.</p></div><div><h3>What does the buying total include?</h3><p>It adds your deposit, purchase costs, mortgage payments, maintenance and insurance. Mortgage payments contain principal and interest; the principal is not counted twice.</p></div><div><h3>Does the lower cash total make it the better choice?</h3><p>No. Buying leaves you with a property once the mortgage is paid. This comparison shows cash paid and does not deduct the home’s value. It also excludes taxes, moving costs, renovations and future interest-rate changes.</p></div></div></section>
    <section className="sources" id="methodology"><div><p className="eyebrow">DATA & METHOD</p><h2>Know what is measured.<br />Know what is assumed.</h2><p>The 13.5% suggested rate is the 2025 Central Bank of Kenya mortgage survey average. It is not a lender quote. The survey also found that 75.6% of mortgages had variable rates; this calculator holds the entered rate fixed to show one scenario.</p><p>Purchase price and comparable rent are examples. Enter local figures for the property you are considering. Rent growth and ownership costs are editable illustrations, not forecasts.</p><p className="method-note">Monthly amortization uses the entered annual rate divided by 12. The buying total includes deposit, purchase costs, all mortgage payments, maintenance and insurance. Rent increases once every 12 months. Figures are nominal KES. Buying leaves a property at the end, but the cash totals do not deduct its value. Taxes, moving costs, renovations and mortgage rate changes are excluded.</p></div><div className="source-list"><h3>Suggested figures</h3>{(Object.keys(SUGGESTIONS) as (keyof ScenarioInput)[]).map(key => { const s = SUGGESTIONS[key]; return <div className="source-row" key={key}><div><strong>{FIELD_NAMES[key]}</strong><span>{s.value.toLocaleString('en-KE')} {s.unit} · {s.status === 'observed' ? `Observed, ${s.period}` : 'Illustrative'}</span></div><p>{s.explanation}</p>{s.url && <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a>}</div>; })}<p className="review-date">Sources reviewed 29 September 2026 · <a href="https://www.kba.co.ke/housing-price-index/" target="_blank" rel="noopener noreferrer">KBA housing index ↗</a></p></div></section>
    <footer><span>buy or rent?</span><span>A scenario tool, not a mortgage offer or financial advice.</span>{process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL && <span>Anonymous analytics count visits and calculator interactions. Entered amounts and contact details are not sent.</span>}</footer>
  </main>;
}
