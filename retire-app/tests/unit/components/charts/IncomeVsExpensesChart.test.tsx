import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IncomeVsExpensesChart } from '@components/charts/IncomeVsExpensesChart';
import type { AnnualProjection } from '@models/simulation';

vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

const SAMPLE_DATA: AnnualProjection[] = [
  { year: 2025, age: 58, annuity: 28_000, fersSupplementAmount: 5_000, tspWithdrawal: 16_000, totalIncome: 49_000, totalExpenses: 60_000, surplus: -11_000 },
  { year: 2026, age: 59, annuity: 28_560, fersSupplementAmount: 5_100, tspWithdrawal: 16_320, totalIncome: 49_980, totalExpenses: 61_500, surplus: -11_520 },
];

describe('IncomeVsExpensesChart', () => {
  it('renders the chart title', () => {
    render(<IncomeVsExpensesChart data={SAMPLE_DATA} />);
    expect(screen.getByText('Retirement Income vs. Expenses')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<IncomeVsExpensesChart data={SAMPLE_DATA} />);
    expect(screen.getByText('Annual income and spending projection over your retirement horizon')).toBeInTheDocument();
  });

  it('renders with empty data without crashing', () => {
    const { container } = render(<IncomeVsExpensesChart data={[]} />);
    expect(container).toBeTruthy();
  });
});
