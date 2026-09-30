import { afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
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
