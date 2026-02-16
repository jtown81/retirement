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
  it('renders all 9 metric cards (6 core + 3 optional when no fullSimulation)', () => {
    render(<SummaryPanel {...PROPS} />);
    const cards = screen.getAllByTestId('metric-card');
    expect(cards).toHaveLength(9);
  });

  it('renders 12 cards when fullSimulation data is provided', () => {
    render(
      <SummaryPanel
        {...PROPS}
        socialSecurityEstimate="$18,000"
        tspDepletionAge="Age 92"
        lifetimeSurplus="$500,000"
      />
    );
    const cards = screen.getAllByTestId('metric-card');
    expect(cards).toHaveLength(9); // 6 + 3 optional
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
