import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaveBalancesChart } from '@components/charts/LeaveBalancesChart';
import type { LeaveBalanceDataPoint } from '@components/charts/chart-types';

vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

const SAMPLE_DATA: LeaveBalanceDataPoint[] = [
  { year: 2000, annualLeaveHours: 104, sickLeaveHours: 104 },
  { year: 2005, annualLeaveHours: 160, sickLeaveHours: 520 },
  { year: 2010, annualLeaveHours: 240, sickLeaveHours: 1040 },
];

describe('LeaveBalancesChart', () => {
  it('renders the chart title', () => {
    render(<LeaveBalancesChart data={SAMPLE_DATA} />);
    expect(screen.getByText('Leave Balances')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<LeaveBalancesChart data={SAMPLE_DATA} />);
    expect(screen.getByText(/Annual and sick leave accumulation.*retirement credit/)).toBeInTheDocument();
  });

  it('renders with empty data without crashing', () => {
    const { container } = render(<LeaveBalancesChart data={[]} />);
    expect(container).toBeTruthy();
  });
});
