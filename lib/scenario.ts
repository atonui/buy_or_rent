export interface ScenarioInput {
  price: number; monthlyRent: number; termYears: number; depositPct: number;
  mortgageRatePct: number; rentGrowthPct: number;
  maintenancePct: number; insurancePct: number; acquisitionCostPct: number;
}

export function validateScenario(input: ScenarioInput): Partial<Record<keyof ScenarioInput, string>> {
  const errors: Partial<Record<keyof ScenarioInput, string>> = {};
  for (const [key, value] of Object.entries(input) as [keyof ScenarioInput, number][]) {
    if (!Number.isFinite(value)) { errors[key] = 'Enter a valid number'; continue; }
    if (key === 'price' && value <= 0) errors[key] = 'Price must be greater than zero';
    else if (key === 'termYears' && (!Number.isInteger(value) || value < 1 || value > 40)) errors[key] = 'Use 1 to 40 whole years';
    else if (key === 'monthlyRent' && value < 0) errors[key] = 'Rent cannot be negative';
    else if (!['price', 'termYears', 'monthlyRent'].includes(key) && (value < 0 || value > 100)) errors[key] = 'Use a value from 0% to 100%';
  }
  return errors;
}

export function mortgagePayment(principal: number, annualRatePct: number, months: number): number {
  if (principal === 0) return 0;
  const rate = annualRatePct / 1200;
  return rate === 0 ? principal / months : principal * rate / (1 - Math.pow(1 + rate, -months));
}

export interface MortgageRow { payment: number; interest: number; principalPaid: number; balance: number }
export function amortize(principal: number, annualRatePct: number, months: number): MortgageRow[] {
  const regular = mortgagePayment(principal, annualRatePct, months);
  let balance = principal;
  return Array.from({ length: months }, (_, index) => {
    const interest = balance * annualRatePct / 1200;
    const principalPaid = index === months - 1 ? balance : Math.min(balance, Math.max(0, regular - interest));
    balance = Math.max(0, balance - principalPaid);
    return { payment: principalPaid + interest, interest, principalPaid, balance };
  });
}

export interface AnnualPoint {
  year: number; ownerCashPaid: number; renterCashPaid: number;
}
export interface ScenarioResult {
  monthlyPayment: number; ownerCashPaid: number; renterCashPaid: number;
  deposit: number;
  acquisitionCosts: number; interestPaid: number; principalPaid: number;
  ownerRunningCosts: number; rentPaid: number; finalMonthlyRent: number; annual: AnnualPoint[];
}

export function calculateScenario(input: ScenarioInput): ScenarioResult {
  const errors = validateScenario(input);
  if (Object.keys(errors).length) throw new Error(`Invalid scenario: ${Object.keys(errors).join(', ')}`);
  const months = input.termYears * 12;
  const deposit = input.price * input.depositPct / 100;
  const acquisitionCosts = input.price * input.acquisitionCostPct / 100;
  const schedule = amortize(input.price - deposit, input.mortgageRatePct, months);
  const runningMonthly = input.price * (input.maintenancePct + input.insurancePct) / 1200;
  let ownerCashPaid = deposit + acquisitionCosts;
  let renterCashPaid = 0;
  let interestPaid = 0;
  let principalPaid = 0;
  let ownerRunningCosts = 0;
  let finalMonthlyRent = input.monthlyRent;
  const annual: AnnualPoint[] = [];
  for (let month = 0; month < months; month++) {
    const mortgage = schedule[month];
    const rent = input.monthlyRent * Math.pow(1 + input.rentGrowthPct / 100, Math.floor(month / 12));
    const ownerOutlay = mortgage.payment + runningMonthly;
    ownerCashPaid += ownerOutlay;
    renterCashPaid += rent;
    interestPaid += mortgage.interest;
    principalPaid += mortgage.principalPaid;
    ownerRunningCosts += runningMonthly;
    finalMonthlyRent = rent;
    if ((month + 1) % 12 === 0) {
      annual.push({
        year: (month + 1) / 12, ownerCashPaid, renterCashPaid,
      });
    }
  }
  return {
    monthlyPayment: schedule[0].payment, ownerCashPaid, renterCashPaid,
    deposit, acquisitionCosts,
    interestPaid, principalPaid, ownerRunningCosts, rentPaid: renterCashPaid,
    finalMonthlyRent, annual,
  };
}
