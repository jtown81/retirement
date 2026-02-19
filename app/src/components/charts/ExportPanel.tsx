import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Download, Info } from 'lucide-react';
import { exportProjectionCSV, exportScenariosJSON } from '@utils/export';
import { useScenarioManager } from '@hooks/useScenarioManager';
import type { SimulationYearResult } from '@models/simulation';

interface ExportPanelProps {
  projectionYears: SimulationYearResult[] | null;
}

export function ExportPanel({ projectionYears }: ExportPanelProps) {
  const { scenarios } = useScenarioManager();

  const handleExportProjection = () => {
    if (!projectionYears || projectionYears.length === 0) {
      return;
    }
    exportProjectionCSV(projectionYears, `retirement-projection-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportAllScenarios = () => {
    if (scenarios.length === 0) {
      return;
    }
    exportScenariosJSON(scenarios as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Your Plan
        </CardTitle>
        <CardDescription>
          Download your retirement projection and scenarios for analysis or sharing
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Export projection data as CSV for Excel analysis, or export scenarios as JSON
            for backup and sharing.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handleExportProjection}
            disabled={!projectionYears || projectionYears.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Projection (CSV)
          </Button>

          <Button
            onClick={handleExportAllScenarios}
            disabled={scenarios.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Scenarios ({scenarios.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold">Projection CSV</h4>
            <p className="text-muted-foreground">
              Year-by-year projection with income, taxes, expenses, and TSP balance
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Scenarios JSON</h4>
            <p className="text-muted-foreground">
              All saved scenarios with inputs and results for backup or import
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
