import { memo } from 'react';
import { MetricCard } from './MetricCard';
import type { SummaryPanelProps } from '@components/charts/chart-types';

function SummaryPanelComponent({
  annuity,
  high3,
  creditableService,
  eligibilityType,
  fersSupplement,
  year1Surplus,
  year1SurplusVariant,
  socialSecurityEstimate,
  tspDepletionAge,
  tspDepletionVariant = 'default',
  lifetimeSurplus,
  lifetimeSurplusVariant = 'default',
}: SummaryPanelProps) {
  const hasFullSimulation = !!(socialSecurityEstimate || tspDepletionAge);

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      data-testid="summary-panel"
    >
      <MetricCard label="Annual Annuity" value={annuity} />
      <MetricCard label="High-3 Salary" value={high3} />
      <MetricCard label="Creditable Service" value={creditableService} />
      <MetricCard label="Eligibility" value={eligibilityType} />
      <MetricCard label="FERS Supplement" value={fersSupplement} />
      <MetricCard
        label="Year-1 Surplus"
        value={year1Surplus}
        variant={year1SurplusVariant}
      />
      {hasFullSimulation ? (
        <>
          <MetricCard
            label="Social Security (est.)"
            value={socialSecurityEstimate || 'N/A'}
          />
          <MetricCard
            label="TSP Depletion Age"
            value={tspDepletionAge || 'N/A'}
            variant={tspDepletionVariant}
          />
          <MetricCard
            label="Lifetime Surplus/Deficit"
            value={lifetimeSurplus || 'N/A'}
            variant={lifetimeSurplusVariant}
          />
        </>
      ) : (
        <>
          <MetricCard
            label="Social Security (est.)"
            value="Complete Simulation tab"
            variant="neutral"
          />
          <MetricCard
            label="TSP Depletion Age"
            value="Complete Simulation tab"
            variant="neutral"
          />
          <MetricCard
            label="Lifetime Surplus/Deficit"
            value="Complete Simulation tab"
            variant="neutral"
          />
        </>
      )}
    </div>
  );
}

export const SummaryPanel = memo(SummaryPanelComponent);
