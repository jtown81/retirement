import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryPanel } from '@components/cards/SummaryPanel';

const PROPS = {
  annuity: '$27,900',
  high3: '$90,000',
  creditableService: '31.0 yrs',
  eligibilityType: 'MRA+30',
  fersSupplement: 'Eligible',
  year1Surplus: '-$5,000',
  year1SurplusVariant: 'negative' as const,
};

describe('SummaryPanel', () => {
  it('renders all 6 metric cards', () => {
    render(<SummaryPanel {...PROPS} />);
    const cards = screen.getAllByTestId('metric-card');
    expect(cards).toHaveLength(6);
  });

  it('displays all metric values', () => {
    render(<SummaryPanel {...PROPS} />);
    expect(screen.getByText('$27,900')).toBeInTheDocument();
    expect(screen.getByText('$90,000')).toBeInTheDocument();
    expect(screen.getByText('31.0 yrs')).toBeInTheDocument();
    expect(screen.getByText('MRA+30')).toBeInTheDocument();
    expect(screen.getByText('Eligible')).toBeInTheDocument();
    expect(screen.getByText('-$5,000')).toBeInTheDocument();
  });

  it('has summary-panel test id', () => {
    render(<SummaryPanel {...PROPS} />);
    expect(screen.getByTestId('summary-panel')).toBeInTheDocument();
  });
});
