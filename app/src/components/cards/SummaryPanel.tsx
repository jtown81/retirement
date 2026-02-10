import { MetricCard } from './MetricCard';
import type { SummaryPanelProps } from '@components/charts/chart-types';

export function SummaryPanel({
  annuity,
  high3,
  creditableService,
  eligibilityType,
  fersSupplement,
  year1Surplus,
  year1SurplusVariant,
}: SummaryPanelProps) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
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
    </div>
  );
}
