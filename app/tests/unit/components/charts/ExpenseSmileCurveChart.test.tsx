import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseSmileCurveChart } from '@components/charts/ExpenseSmileCurveChart';
import type { SmileCurveDataPoint } from '@components/charts/chart-types';

vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

const SAMPLE_DATA: SmileCurveDataPoint[] = [
  { yearsIntoRetirement: 0, multiplier: 1.0, adjustedExpenses: 60_000, baseExpenses: 60_000 },
  { yearsIntoRetirement: 15, multiplier: 0.85, adjustedExpenses: 51_000, baseExpenses: 60_000 },
  { yearsIntoRetirement: 30, multiplier: 0.95, adjustedExpenses: 57_000, baseExpenses: 60_000 },
];

describe('ExpenseSmileCurveChart', () => {
  it('renders the chart title', () => {
    render(<ExpenseSmileCurveChart data={SAMPLE_DATA} />);
    expect(screen.getByText('Expense Smile Curve')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<ExpenseSmileCurveChart data={SAMPLE_DATA} />);
    expect(screen.getByText(/Blanchett 2014/)).toBeInTheDocument();
  });

  it('renders with empty data without crashing', () => {
    const { container } = render(<ExpenseSmileCurveChart data={[]} />);
    expect(container).toBeTruthy();
  });
});
