import { Alert, AlertDescription } from '@components/ui/alert';
import { Separator } from '@components/ui/separator';
import { AlertTriangle } from 'lucide-react';
import { SectionHeading } from '../layout/SectionHeading';
import { SummaryPanel } from '../cards/SummaryPanel';
import { MetricCardSkeleton } from '../cards/MetricCardSkeleton';
import { ChartProvider } from './ChartContext';
import { PayGrowthChart } from './PayGrowthChart';
import { ChartSkeleton } from './ChartSkeleton';
import { UpgradePrompt } from '../paywall/UpgradePrompt';
import type { SimulationData } from '@hooks/useSimulation';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface BasicDashboardProps {
  data: SimulationData | null;
  mode: 'demo' | 'user';
}

/**
 * Simplified dashboard for Basic tier users.
 * Shows only core metrics and basic projections.
 * Premium features (Monte Carlo, tax details, detailed projections) are gated behind upgrade.
 *
 * Phase 3B: Basic tier dashboard UI.
 */
export function BasicDashboard({ data, mode }: BasicDashboardProps) {
  if (!data) {
    return (
      <div className="space-y-6">
        {/* Summary Skeleton */}
        <section className="space-y-4">
          <SectionHeading
            title="Retirement Summary"
            description="Key metrics based on your plan data"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        </section>

        <Separator />

        {/* Chart Skeleton */}
        <section className="space-y-4">
          <SectionHeading
            title="Career Pay Growth"
            description="Salary progression from hire to retirement"
          />
          <ChartSkeleton
            title="Pay Growth Over Career"
            subtitle="Annual salary progression by grade and step"
          />
        </section>
      </div>
    );
  }

  const { result, salaryHistory } = data;

  const retireYear = result.projections[0]?.year;
  const year1Surplus = result.projections[0]?.surplus ?? 0;

  return (
    <ChartProvider>
      <div id="print-target" className="space-y-6">
        {/* Print Header (hidden in normal view, shown in print) */}
        <div id="print-header" className="hidden print:block space-y-2 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-bold">FedRetire Retirement Projection</h1>
          <p className="text-sm text-gray-600">
            Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {retireYear && (
            <p className="text-sm text-gray-600">
              Retirement Year: {retireYear}
            </p>
          )}
        </div>

        {mode === 'demo' && (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Showing demo data. Fill in your plan details under "My Plan" to see personalized projections.
              </AlertDescription>
            </Alert>
            <Separator />
          </>
        )}

        {/* Summary Cards — 5 core metrics only */}
        <section className="space-y-4">
          <SectionHeading
            title="Retirement Summary"
            description={mode === 'demo'
              ? 'Key metrics for the GS straight-through demo scenario'
              : 'Key metrics based on your plan data'}
          />
          <SummaryPanel
            annuity={USD_FORMAT.format(result.annualAnnuity)}
            high3={USD_FORMAT.format(result.high3Salary)}
            creditableService={`${result.creditableServiceYears.toFixed(1)} yrs`}
            eligibilityType={result.eligibility.type ?? 'N/A'}
            fersSupplement={result.fersSupplementEligible ? 'Eligible' : 'Not Eligible'}
            year1Surplus={USD_FORMAT.format(year1Surplus)}
            year1SurplusVariant={year1Surplus >= 0 ? 'positive' : 'negative'}
          />
        </section>

        <Separator />

        {/* Pay Growth Chart */}
        <section className="space-y-4">
          <SectionHeading
            title="Career Pay Growth"
            description="Salary progression from hire to retirement with High-3 average highlighted"
          />
          <PayGrowthChart data={salaryHistory} retirementYear={retireYear} />
        </section>

        <Separator />

        {/* Upgrade Prompt for Advanced Projections */}
        <section className="space-y-4">
          <SectionHeading
            title="Advanced Projections"
            description="Unlock detailed retirement planning tools"
          />
          <UpgradePrompt
            feature="Advanced Projections"
            description="Get access to income waterfalls, TSP lifecycle analysis, Monte Carlo confidence bands, detailed tax projections, and more. See the full picture of your retirement."
          />
        </section>
      </div>
    </ChartProvider>
  );
}
