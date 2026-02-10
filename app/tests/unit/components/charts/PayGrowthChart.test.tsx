import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PayGrowthChart } from '@components/charts/PayGrowthChart';
import type { PayGrowthDataPoint } from '@components/charts/chart-types';

vi.stubGlobal('ResizeObserver', vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

const SAMPLE_DATA: PayGrowthDataPoint[] = [
  { year: 2000, salary: 30_000, grade: 7, step: 1 },
  { year: 2005, salary: 50_000, grade: 9, step: 5 },
  { year: 2010, salary: 80_000, grade: 12, step: 8 },
];

describe('PayGrowthChart', () => {
  it('renders the chart title', () => {
    render(<PayGrowthChart data={SAMPLE_DATA} />);
    expect(screen.getByText('Pay Growth Over Career')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<PayGrowthChart data={SAMPLE_DATA} />);
    expect(screen.getByText('Annual salary progression by grade and step')).toBeInTheDocument();
  });

  it('renders with empty data without crashing', () => {
    const { container } = render(<PayGrowthChart data={[]} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('Pay Growth Over Career')).toBeInTheDocument();
  });

  it('renders with retirement year marker', () => {
    const { container } = render(<PayGrowthChart data={SAMPLE_DATA} retirementYear={2010} />);
    expect(container).toBeTruthy();
  });
});
