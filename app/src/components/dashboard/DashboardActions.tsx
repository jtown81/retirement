/**
 * Dashboard Actions Panel
 * Integrates scenario management and export features
 * Appears at the top of the dashboard for easy access
 */

import { useState } from 'react';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { SaveScenarioDialog } from '@components/dialogs/SaveScenarioDialog';
import { ScenarioListDialog } from '@components/dialogs/ScenarioListDialog';
import { ExportPanel } from '@components/charts/ExportPanel';
import { Save, FolderOpen } from 'lucide-react';
import { useScenarioManager } from '@hooks/useScenarioManager';
import type { SimulationInput } from '@models/simulation';
import type { FullSimulationResult } from '@models/simulation';
import type { NamedScenario } from '@models/scenario';

interface DashboardActionsProps {
  inputs: SimulationInput | null;
  result: FullSimulationResult | null;
  projectionYears: any[] | null;
  onScenarioLoaded?: (scenario: NamedScenario) => void;
}

export function DashboardActions({
  inputs,
  result,
  projectionYears,
  onScenarioLoaded,
}: DashboardActionsProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const { scenarios } = useScenarioManager();
  const scenarioCount = scenarios.length;

  return (
    <>
      <div className="space-y-4">
        {/* Quick Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Scenario Management
            </CardTitle>
            <CardDescription>
              Save, load, and compare different retirement plan scenarios
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => setIsSaveDialogOpen(true)}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save as Scenario
              </Button>

              <Button
                onClick={() => setIsListDialogOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                View Scenarios ({scenarioCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Panel */}
        <ExportPanel projectionYears={projectionYears} />
      </div>

      {/* Dialogs */}
      <SaveScenarioDialog
        isOpen={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        inputs={inputs}
        result={result}
        onScenarioSaved={() => {
          // Refresh scenario count if needed
        }}
      />

      <ScenarioListDialog
        isOpen={isListDialogOpen}
        onOpenChange={setIsListDialogOpen}
        onLoadScenario={onScenarioLoaded}
      />
    </>
  );
}
