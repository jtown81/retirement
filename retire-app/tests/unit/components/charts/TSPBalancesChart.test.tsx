import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TSPBalancesChart } from '@components/charts/TSPBalancesChart';
import type { TSPBalanceDataPoint } from '@components/charts/chart-types';

vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

const SAMPLE_DATA: TSPBalanceDataPoint[] = [
  { year: 2010, traditionalBalance: 100_000, rothBalance: 0, totalBalance: 100_000 },
  { year: 2015, traditionalBalance: 200_000, rothBalance: 50_000, totalBalance: 250_000 },
  { year: 2020, traditionalBalance: 350_000, rothBalance: 100_000, totalBalance: 450_000 },
];

describe('TSPBalancesChart', () => {
  it('renders the chart title', () => {
    render(<TSPBalancesChart data={SAMPLE_DATA} />);
    expect(screen.getByText('TSP Balance Growth')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<TSPBalancesChart data={SAMPLE_DATA} />);
    expect(screen.getByText('Traditional and Roth TSP projected balances')).toBeInTheDocument();
  });

  it('renders with empty data without crashing', () => {
    const { container } = render(<TSPBalancesChart data={[]} />);
    expect(container).toBeTruthy();
  });
});
