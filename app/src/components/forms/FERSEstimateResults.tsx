import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Separator } from '@components/ui/separator';
import { Alert, AlertDescription } from '@components/ui/alert';
import type { FERSEstimateResult } from './useFERSEstimate';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={bold ? 'font-semibold text-foreground' : 'text-foreground'}>{value}</dd>
    </div>
  );
}

export function FERSEstimateResults({ result }: { result: FERSEstimateResult | null }) {
  if (!result) {
    return (
      <Alert className="bg-muted">
        <AlertDescription className="text-center">
          Enter birth date, SCD &mdash; Retirement, and planned retirement date to see your FERS estimate.
        </AlertDescription>
      </Alert>
    );
  }

  if (!result.canCompute) {
    return (
      <Alert>
        <AlertDescription className="space-y-3">
          <div>
            <ServiceSummary result={result} />
          </div>
          <p className="text-sm">
            Select a GS grade and step, or enter a High-3 override, to see full annuity calculations.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <ServiceSummary result={result} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ResultCard title="FERS Annuity">
          <Row label="High-3 salary" value={fmt(result.high3Salary)} bold />
          {result.high3Source === 'override' && result.computedHigh3 > 0 && (
            <Row label="Computed High-3" value={fmt(result.computedHigh3)} />
          )}
          <div className="text-[10px] text-muted-foreground mb-1">
            {result.high3Source === 'override' ? 'User override' : 'Computed from salary projection'}
          </div>
          <Row label="Gross annual" value={fmt(result.grossAnnuity)} />
          <Row label="Reductions" value={result.reductionAmount > 0 ? `-${fmt(result.reductionAmount)}` : '$0'} />
          <Row label="Net annual" value={fmt(result.netAnnuity)} bold />
          <Row label="Net monthly" value={fmt(result.monthlyAnnuity)} bold />
        </ResultCard>

        <ResultCard title="FERS Supplement">
          {result.supplementEligible ? (
            <>
              <Row label="Monthly" value={fmt(result.supplementMonthly)} bold />
              <Row label="Annual" value={fmt(result.supplementAnnual)} />
              <Row label="Ends at" value="Age 62" />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {result.ageAtRetirement >= 62
                ? 'Not applicable — retiring at or after age 62.'
                : 'Not eligible under current retirement type.'}
            </p>
          )}
        </ResultCard>

        <ResultCard title="TSP at Retirement">
          <Row label="Projected balance" value={fmt(result.tspFutureValue)} bold />
          <Row label="Growth" value={fmt(result.tspGrowthAmount)} />
          <Row label="Annual withdrawal" value={fmt(result.annualWithdrawal)} />
          <Row
            label="Runs out"
            value={result.depletionAge === null ? 'NEVER' : `Age ${result.depletionAge}`}
            bold
          />
          <Row label="Balance at 85" value={fmt(result.balanceAt85)} />
        </ResultCard>
      </div>
    </div>
  );
}

function ServiceSummary({ result }: { result: FERSEstimateResult }) {
  const eligLabel = result.eligibility.eligible
    ? result.eligibility.type ?? 'Eligible'
    : 'Not yet eligible';

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      <span className="text-muted-foreground">
        <span className="font-medium text-foreground">
          {result.serviceYears}y {result.serviceMonths}m
        </span>{' '}
        civilian service
      </span>
      <span className="text-muted-foreground">
        Annuity rate:{' '}
        <span className="font-medium text-foreground">{result.annuityPct}%</span>
      </span>
      <span className="text-muted-foreground">
        Creditable:{' '}
        <span className="font-medium text-foreground">
          {result.totalCreditableService.toFixed(1)} years
        </span>
      </span>
      <span className="text-muted-foreground">
        Age at retirement:{' '}
        <span className="font-medium text-foreground">
          {result.ageAtRetirement.toFixed(1)}
        </span>
      </span>
      <span className={`font-medium ${result.eligibility.eligible ? 'text-green-600' : 'text-amber-600'}`}>
        {eligLabel}
      </span>
    </div>
  );
}
