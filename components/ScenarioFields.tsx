import { useState } from 'react';
import type { ScenarioInput } from '../lib/scenario';
import { SUGGESTIONS } from '../lib/defaults';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const names: Record<keyof ScenarioInput, string> = {
  price: 'Purchase price', monthlyRent: 'Monthly rent', termYears: 'Mortgage term',
  depositPct: 'Deposit', mortgageRatePct: 'Mortgage interest', rentGrowthPct: 'Annual rent growth',
  maintenancePct: 'Annual maintenance', insurancePct: 'Annual insurance',
  acquisitionCostPct: 'Purchase costs',
};
const primary: (keyof ScenarioInput)[] = ['price', 'monthlyRent', 'termYears', 'depositPct', 'mortgageRatePct', 'rentGrowthPct'];
const extra: (keyof ScenarioInput)[] = ['maintenancePct', 'insurancePct', 'acquisitionCostPct'];
export const FIELD_NAMES = names;

interface Props {
  value: Record<keyof ScenarioInput, string>;
  errors: Partial<Record<keyof ScenarioInput, string>>;
  onChange: (key: keyof ScenarioInput, value: string) => void;
  onReset: () => void;
}
export function ScenarioFields({ value, errors, onChange, onReset }: Props) {
  const [focusedAmount, setFocusedAmount] = useState<'price' | 'monthlyRent' | null>(null);
  const field = (key: keyof ScenarioInput) => {
    const suggestion = SUGGESTIONS[key];
    const id = `field-${key}`;
    const isAmount = key === 'price' || key === 'monthlyRent';
    return <div className="field" key={key}>
      <div className="field-head"><label htmlFor={id}>{names[key]}</label><span>{suggestion.unit}</span></div>
      <Input id={id} type={isAmount ? 'text' : 'number'} inputMode={isAmount ? 'numeric' : 'decimal'}
        step={isAmount ? undefined : key === 'termYears' ? 1 : 'any'}
        value={isAmount && focusedAmount !== key && /^\d+$/.test(value[key]) ? Number(value[key]).toLocaleString('en-KE') : value[key]}
        aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${id}-error` : `${id}-hint`}
        onFocus={isAmount ? () => setFocusedAmount(key) : undefined}
        onBlur={isAmount ? () => setFocusedAmount(null) : undefined}
        onChange={event => onChange(key, isAmount ? event.target.value.replace(/,/g, '') : event.target.value)} />
      {errors[key] ? <p className="field-error" id={`${id}-error`} role="alert">{errors[key]}</p>
        : <p className="field-hint" id={`${id}-hint`}>{key === 'monthlyRent' ? 'Use the rent for a similar home in the same area. Illustrative · editable' : suggestion.status === 'observed' ? 'CBK 2025 average · editable' : 'Illustrative · editable'}</p>}
    </div>;
  };
  return <section className="input-panel" aria-labelledby="inputs-heading">
    <div className="panel-heading"><div><p className="eyebrow">YOUR SCENARIO</p><h2 id="inputs-heading">Set the numbers</h2></div><Button variant="outline" size="sm" onClick={onReset}>Reset assumptions</Button></div>
    <div className="fields-grid">{primary.map(field)}</div>
    <details className="advanced"><summary>More assumptions <span>Upkeep and fees</span></summary><div className="fields-grid">{extra.map(field)}</div></details>
  </section>;
}
