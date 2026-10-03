'use client';
import { useState } from 'react';
import type { AnnualPoint } from '../lib/scenario';

const shortKes = (value: number) => `${(value / 1_000_000).toFixed(1)}m`;
const money = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });
export function ComparisonChart({ annual }: { annual: AnnualPoint[] }) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const selected = annual.find(point => point.year === selectedYear) ?? annual[annual.length - 1];
  const values = annual.flatMap(point => [point.ownerCashPaid, point.renterCashPaid]);
  const low = 0;
  const high = Math.max(1, ...values);
  const x = (index: number) => 52 + index * 650 / Math.max(annual.length - 1, 1);
  const y = (value: number) => 225 - (value - low) * 185 / (high - low);
  const points = (key: 'ownerCashPaid' | 'renterCashPaid') => annual.map((point, index) => `${x(index)},${y(point[key])}`).join(' ');
  return <section className="chart-panel" aria-labelledby="chart-heading">
    <div className="panel-heading"><div><p className="eyebrow">OVER TIME</p><h2 id="chart-heading">Cash paid, year by year</h2></div></div>
    <p className="chart-explanation">Each point is the total cash paid from the start through the end of that year. Buying includes the deposit, purchase costs, mortgage payments and upkeep. Renting includes rent and the assumed annual increases.</p>
    <div className="chart-inspect"><label htmlFor="inspect-year">Inspect year</label><select id="inspect-year" value={selected.year} onChange={event => setSelectedYear(Number(event.target.value))}>{annual.map(point => <option key={point.year} value={point.year}>Year {point.year}</option>)}</select><p aria-live="polite">Year {selected.year}: Buy {money.format(selected.ownerCashPaid)}; Rent {money.format(selected.renterCashPaid)}</p></div>
    <div className="legend"><span><i className="legend-owner" /> Buy</span><span><i className="legend-rent" /> Rent</span><span>KES millions</span></div>
    <svg className="line-chart" viewBox="0 0 750 270" role="img" aria-label="Year-by-year cumulative cash paid for buying and renting">
      {[0, 0.5, 1].map(fraction => { const yy = 225 - fraction * 185; return <g key={fraction}><line x1="52" x2="702" y1={yy} y2={yy} stroke="#d8dfdb" strokeDasharray="4 6" /><text x="44" y={yy + 4} textAnchor="end" fontSize="12" fill="#64756f">{shortKes(low + fraction * (high - low))}</text></g>; })}
      <polyline points={points('ownerCashPaid')} fill="none" stroke="#116a5b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={points('renterCashPaid')} fill="none" stroke="#d38155" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {annual.length === 1 ? <>
        <circle cx={x(0)} cy={y(annual[0].ownerCashPaid)} r="6" fill="#116a5b" />
        <circle cx={x(0)} cy={y(annual[0].renterCashPaid)} r="6" fill="#d38155" />
        <text x="52" y="257" fontSize="12" fill="#64756f">Year 1</text>
      </> : <><text x="52" y="257" fontSize="12" fill="#64756f">Year 1</text><text x="702" y="257" textAnchor="end" fontSize="12" fill="#64756f">Year {annual.length}</text></>}
    </svg>
    <details className="data-table"><summary>View yearly figures</summary><div className="table-scroll"><table><thead><tr><th>Year</th><th>Buy cash paid</th><th>Rent cash paid</th></tr></thead><tbody>{annual.map(point => <tr key={point.year}><th>{point.year}</th><td>{shortKes(point.ownerCashPaid)}</td><td>{shortKes(point.renterCashPaid)}</td></tr>)}</tbody></table></div></details>
  </section>;
}
