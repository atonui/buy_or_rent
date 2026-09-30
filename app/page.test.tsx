import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';

afterEach(cleanup);
afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
  delete (window as Window & { plausible?: unknown }).plausible;
  vi.unstubAllGlobals();
});

describe('anonymous comparison measurement', () => {
  it('counts a start and one completed comparison after edited results stay visible', () => {
    vi.useFakeTimers();
    const events: string[] = [];
    (window as Window & { plausible?: (name: string) => void }).plausible = name => events.push(name);
    let onIntersect: IntersectionObserverCallback = () => {};
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { onIntersect = callback; }
      observe() {}
      disconnect() {}
    });
    render(<Home />);
    expect(events).toEqual([]);
    const rent = screen.getByRole('spinbutton', { name: /monthly rent/i });
    fireEvent.change(rent, { target: { value: '66000' } });
    act(() => onIntersect([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(events).toEqual(['Comparison Started']);
    act(() => vi.advanceTimersByTime(3000));
    expect(events).toEqual(['Comparison Started', 'Comparison Completed']);
    fireEvent.change(rent, { target: { value: '67000' } });
    act(() => vi.advanceTimersByTime(3000));
    expect(events).toEqual(['Comparison Started', 'Comparison Completed']);
  });
  it('does not complete when an edited result becomes invalid', () => {
    vi.useFakeTimers();
    const events: string[] = [];
    (window as Window & { plausible?: (name: string) => void }).plausible = name => events.push(name);
    let onIntersect: IntersectionObserverCallback = () => {};
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { onIntersect = callback; }
      observe() {}
      disconnect() {}
    });
    render(<Home />);
    const rent = screen.getByRole('spinbutton', { name: /monthly rent/i });
    fireEvent.change(rent, { target: { value: '66000' } });
    act(() => onIntersect([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    fireEvent.change(rent, { target: { value: '' } });
    act(() => vi.advanceTimersByTime(3000));
    expect(events).toEqual(['Comparison Started']);
  });
});
describe('calculator page', () => {
  it('updates the comparison when rent changes, then resets', async () => {
    const user = userEvent.setup();
    render(<Home />);
    const rent = screen.getByRole('spinbutton', { name: /monthly rent/i });
    const original = screen.getByTestId('renter-cash').textContent;
    await user.clear(rent);
    await user.type(rent, '100000');
    expect(screen.getByTestId('renter-cash').textContent).not.toBe(original);
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByTestId('renter-cash').textContent).toBe(original);
  });
  it('blocks results for blank price and names the error', async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.clear(screen.getByRole('spinbutton', { name: /purchase price/i }));
    expect(screen.getByText(/price must be greater than zero|enter a valid number/i)).toBeTruthy();
    expect(screen.queryByTestId('renter-cash')).toBeNull();
  });
});

describe('adjustable horizon', () => {
  it('uses the edited term in the chart heading', async () => {
    const user = userEvent.setup();
    render(<Home />);
    const term = screen.getByRole('spinbutton', { name: /mortgage term/i });
    await user.clear(term);
    await user.type(term, '20');
    expect(screen.getByRole('heading', { name: /cash paid, year by year/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /the cost over 20 years/i })).toBeTruthy();
  });
});

describe('structured scenario control', () => {
  it('updates visible results and rejects invalid input', async () => {
    let tool: { execute: (input: unknown) => unknown } | undefined;
    Object.defineProperty(document, 'modelContext', { configurable: true, value: {
      registerTool: (candidate: typeof tool) => { tool = candidate; },
    } });
    try {
      render(<Home />);
      expect(tool).toBeTruthy();
      const before = screen.getByTestId('renter-cash').textContent;
      const { act } = await import('@testing-library/react');
      await act(async () => { await tool!.execute({ monthlyRent: 100_000 }); });
      expect(screen.getByTestId('renter-cash').textContent).not.toBe(before);
      await expect(() => tool!.execute({ price: 0 })).toThrow(/price/i);
    } finally { delete (document as Document & { modelContext?: unknown }).modelContext; }
  });
});

describe('comparison explanations', () => {
  it('compares housing payments without hypothetical investing', () => {
    render(<Home />);
    expect(screen.getAllByText('buy or rent?').length).toBeGreaterThan(0);
    expect(screen.getByText(/Buying leaves you owning the property/i)).toBeTruthy();
    expect(screen.queryByText(/investment balance/i)).toBeNull();
    expect(screen.queryByRole('spinbutton', { name: /investment return/i })).toBeNull();
    expect(screen.queryByText(/Start with Kenyan data/i)).toBeNull();
  });
  it('shows rent paid and the first and final monthly rent', () => {
    render(<Home />);
    expect(screen.getByText('Starting monthly rent')).toBeTruthy();
    expect(screen.getByText('Final monthly rent')).toBeTruthy();
    expect(screen.getByText(/same property over the same period/i)).toBeTruthy();
  });
});
