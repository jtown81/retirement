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
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, PersonalInfoSchema, FERSEstimateSchema, ExpenseProfileSchema, TaxProfileSchema, TSPContributionEventSchema, TSPAccountSnapshotSchema } from '@storage/index';
import type { SimulationInput } from '@models/simulation';
import type { FullSimulationResult } from '@models/simulation';
import type { NamedScenario, FormSnapshot } from '@models/scenario';
import { z } from 'zod';

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

  // Load all form data from localStorage for scenario snapshot
  const [personal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [fersEstimate] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [expenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);
  const [taxProfile] = useLocalStorage(STORAGE_KEYS.TAX_PROFILE, TaxProfileSchema);
  const [tspContributions] = useLocalStorage(STORAGE_KEYS.TSP_CONTRIBUTIONS, z.array(TSPContributionEventSchema));
  const [tspSnapshots] = useLocalStorage(STORAGE_KEYS.TSP_SNAPSHOTS, z.array(TSPAccountSnapshotSchema));

  // Build FormSnapshot object
  const formSnapshot: FormSnapshot = {
    personal: personal ?? undefined,
    fersEstimate: fersEstimate ?? undefined,
    expenses: expenses ?? undefined,
    taxProfile: taxProfile ?? undefined,
    tspContributions: (Array.isArray(tspContributions) ? tspContributions : undefined),
    tspSnapshots: (Array.isArray(tspSnapshots) ? tspSnapshots : undefined),
  };

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
        formSnapshot={formSnapshot}
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
