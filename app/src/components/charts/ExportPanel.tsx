import { useState } from 'react';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Alert, AlertDescription } from '@components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@components/ui/dialog';
import { Download, Info, Printer, Grid3X3 } from 'lucide-react';
import {
  exportProjectionCSV,
  exportScenariosJSON,
  exportProjectionXLSX,
  exportScenarioDiffCSV,
  triggerPrint,
} from '@utils/export';
import { useScenarioManager } from '@hooks/useScenarioManager';
import type { SimulationYearResult, SimulationInput } from '@models/simulation';

interface ExportPanelProps {
  projectionYears: SimulationYearResult[] | null;
  input?: SimulationInput | null;
}

export function ExportPanel({ projectionYears, input }: ExportPanelProps) {
  const { scenarios } = useScenarioManager();
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [selectedBaseline, setSelectedBaseline] = useState<string>(scenarios[0]?.id ?? '');
  const [selectedComparison, setSelectedComparison] = useState<string>(scenarios[1]?.id ?? '');

  const handleExportProjection = () => {
    if (!projectionYears || projectionYears.length === 0) {
      return;
    }
    exportProjectionCSV(projectionYears, `retirement-projection-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportExcel = async () => {
    if (!projectionYears || projectionYears.length === 0) {
      return;
    }
    await exportProjectionXLSX(projectionYears, input ?? null, scenarios.length > 0 ? (scenarios as any) : undefined);
  };

  const handleExportAllScenarios = () => {
    if (scenarios.length === 0) {
      return;
    }
    exportScenariosJSON(scenarios as any);
  };

  const handleExportDiff = () => {
    const baseline = scenarios.find((s) => s.id === selectedBaseline);
    const comparison = scenarios.find((s) => s.id === selectedComparison);

    if (!baseline || !comparison) {
      return;
    }

    // Extract metrics from scenario results (using 'years' not 'projections')
    const baselineMetrics: Record<string, number | string> = {
      'Label': baseline.label,
      'Year 1 Gross Income': baseline.result?.years[0]?.totalIncome ?? 0,
      'Year 1 Expenses': baseline.result?.years[0]?.totalExpenses ?? 0,
      'Year 1 Surplus': baseline.result?.years[0]?.surplus ?? 0,
      'Year 1 Federal Tax': baseline.result?.years[0]?.federalTax ?? 0,
      'Lifetime Income': (baseline.result?.years ?? []).reduce((sum: number, p: any) => sum + p.totalIncome, 0),
      'Lifetime Expenses': (baseline.result?.years ?? []).reduce((sum: number, p: any) => sum + p.totalExpenses, 0),
      'Lifetime Surplus': (baseline.result?.years ?? []).reduce((sum: number, p: any) => sum + p.surplus, 0),
      'Final Year TSP Balance': baseline.result?.years && baseline.result.years.length > 0 ? baseline.result.years[baseline.result.years.length - 1]?.totalTSPBalance ?? 0 : 0,
    };

    const comparisonMetrics: Record<string, number | string> = {
      'Label': comparison.label,
      'Year 1 Gross Income': comparison.result?.years[0]?.totalIncome ?? 0,
      'Year 1 Expenses': comparison.result?.years[0]?.totalExpenses ?? 0,
      'Year 1 Surplus': comparison.result?.years[0]?.surplus ?? 0,
      'Year 1 Federal Tax': comparison.result?.years[0]?.federalTax ?? 0,
      'Lifetime Income': (comparison.result?.years ?? []).reduce((sum: number, p: any) => sum + p.totalIncome, 0),
      'Lifetime Expenses': (comparison.result?.years ?? []).reduce((sum: number, p: any) => sum + p.totalExpenses, 0),
      'Lifetime Surplus': (comparison.result?.years ?? []).reduce((sum: number, p: any) => sum + p.surplus, 0),
      'Final Year TSP Balance': comparison.result?.years && comparison.result.years.length > 0 ? comparison.result.years[comparison.result.years.length - 1]?.totalTSPBalance ?? 0 : 0,
    };

    exportScenarioDiffCSV(baseline.label, comparison.label, baselineMetrics, comparisonMetrics);
    setDiffDialogOpen(false);
  };

  const handlePrint = () => {
    triggerPrint('FedRetire Retirement Projection');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" aria-hidden="true" />
          Export Your Plan
        </CardTitle>
        <CardDescription>
          Download your retirement projection and scenarios for analysis or sharing
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Export your retirement projection as CSV for Excel analysis, print as PDF,
            or backup your scenarios as JSON.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleExportProjection}
            disabled={!projectionYears || projectionYears.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Export CSV
          </Button>

          <Button
            onClick={handleExportExcel}
            disabled={!projectionYears || projectionYears.length === 0}
            className="gap-2"
          >
            <Grid3X3 className="w-4 h-4" aria-hidden="true" />
            Export Excel
          </Button>

          <Button
            onClick={handlePrint}
            disabled={!projectionYears || projectionYears.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Print / PDF
          </Button>

          <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={scenarios.length < 2}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Compare ({scenarios.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Compare Scenarios</DialogTitle>
                <DialogDescription>
                  Select two scenarios to compare side-by-side. Differences will be calculated automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label htmlFor="baseline-scenario-select" className="text-sm font-semibold">Baseline Scenario</label>
                  <select
                    id="baseline-scenario-select"
                    value={selectedBaseline}
                    onChange={(e) => setSelectedBaseline(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="comparison-scenario-select" className="text-sm font-semibold">Comparison Scenario</label>
                  <select
                    id="comparison-scenario-select"
                    value={selectedComparison}
                    onChange={(e) => setSelectedComparison(e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExportDiff}
                    disabled={selectedBaseline === selectedComparison}
                    className="flex-1"
                  >
                    Export Comparison CSV
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleExportAllScenarios}
            disabled={scenarios.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Scenarios JSON
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-semibold">Export CSV</p>
            <p className="text-muted-foreground">
              Year-by-year projection with income, taxes, expenses, and TSP balance
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Export Excel</p>
            <p className="text-muted-foreground">
              Multi-sheet workbook with inputs, full projection, and scenario comparison
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Print / PDF</p>
            <p className="text-muted-foreground">
              Print-optimized view with charts, summary cards, and projections
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Compare Scenarios</p>
            <p className="text-muted-foreground">
              Export side-by-side comparison of two scenarios with differences and percent change
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
