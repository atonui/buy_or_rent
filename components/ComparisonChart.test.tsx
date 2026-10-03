import { afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
afterEach(cleanup);
import { expect, it } from 'vitest';
import { ComparisonChart } from './ComparisonChart';

it('shows both data points for a one-year comparison', () => {
  const { container } = render(<ComparisonChart annual={[{
    year: 1, ownerCashPaid: 1200, renterCashPaid: 600,
  }]} />);
  expect(screen.getByRole('img', { name: /year-by-year cumulative cash paid/i })).toBeTruthy();
  expect(container.querySelectorAll('svg circle')).toHaveLength(2);
  expect(container.querySelectorAll('svg text')).toHaveLength(4);
});

it('explains that the lines add payments through each year', () => {
  render(<ComparisonChart annual={[{
    year: 1, ownerCashPaid: 1200, renterCashPaid: 600,
  }]} />);
  expect(screen.getByText(/total cash paid from the start through the end of that year/i)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /net wealth/i })).toBeNull();
});

it('shows exact cash paid for a selected year', async () => {
  const user = userEvent.setup();
  render(<ComparisonChart annual={[
    { year: 1, ownerCashPaid: 1_200_000, renterCashPaid: 600_000 },
    { year: 2, ownerCashPaid: 2_400_000, renterCashPaid: 1_260_000 },
  ]} />);
  await user.selectOptions(screen.getByRole('combobox', { name: /inspect year/i }), '2');
  expect(screen.getByText(/Year 2: Buy Ksh 2,400,000; Rent Ksh 1,260,000/i)).toBeTruthy();
});
