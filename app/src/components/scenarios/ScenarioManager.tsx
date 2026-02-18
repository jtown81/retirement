/**
 * Scenario Manager
 * Main component for managing named scenarios.
 */

import { useState } from 'react';
import { useScenarioManager } from '@hooks/useScenarioManager';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, NamedScenariosArraySchema } from '@storage/index';
import { exportScenariosJSON } from '@utils/export';
import { Button } from '@components/ui/button';
import { AlertCircle, Trash2, Edit2, Copy, CheckCircle, Download } from 'lucide-react';
import { SaveScenarioDialog } from './SaveScenarioDialog';
import { EditScenarioDialog } from './EditScenarioDialog';
import type { NamedScenario } from '@models/scenario';

interface ScenarioManagerProps {
  onLoadScenario?: (scenario: NamedScenario & any) => void;
}

export function ScenarioManager({ onLoadScenario }: ScenarioManagerProps) {
  const [scenarios] = useLocalStorage(STORAGE_KEYS.NAMED_SCENARIOS, NamedScenariosArraySchema);
  const { deleteScenario, setBaseline, getBaseline, updateScenario } = useScenarioManager();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const baseline = getBaseline();
  const scenarioList = scenarios ?? [];

  const handleDelete = (id: string) => {
    try {
      deleteScenario(id);
      setDeleteConfirmId(null);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleEdit = (scenario: NamedScenario & any) => {
    setEditingId(scenario.id);
    setEditLabel(scenario.label);
    setEditDescription(scenario.description ?? '');
  };

  const handleSaveEdit = (label: string, description: string) => {
    if (editingId) {
      updateScenario(editingId, { label, description });
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scenarios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Save and compare retirement plans
          </p>
        </div>
        <Button onClick={() => setShowSaveDialog(true)} className="gap-2">
          <Copy className="w-4 h-4" />
          Save Current Plan
        </Button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <SaveScenarioDialog
          onSave={() => setShowSaveDialog(false)}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}

      {/* Edit Dialog */}
      {editingId && (
        <EditScenarioDialog
          label={editLabel}
          description={editDescription}
          onSave={handleSaveEdit}
          onCancel={() => setEditingId(null)}
        />
      )}

      {/* Empty State */}
      {scenarioList.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No scenarios saved yet. Create one to start comparing retirement plans.
          </p>
        </div>
      ) : (
        <>
          {/* Scenarios List */}
          <div className="space-y-3">
            {scenarioList.map((scenario) => (
              <div
                key={scenario.id}
                className={`rounded-lg border p-4 transition-all ${
                  baseline?.id === scenario.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {scenario.label}
                      </h3>
                      {baseline?.id === scenario.id && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          <CheckCircle className="w-3 h-3" />
                          Baseline
                        </span>
                      )}
                    </div>
                    {scenario.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {scenario.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {scenario.createdAt}
                      {scenario.updatedAt && scenario.updatedAt !== scenario.createdAt
                        ? ` • Updated: ${scenario.updatedAt}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {baseline?.id !== scenario.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBaseline(scenario.id)}
                        title="Set as baseline for comparison"
                      >
                        Set Baseline
                      </Button>
                    )}
                    {onLoadScenario && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLoadScenario(scenario)}
                      >
                        Load
                      </Button>
                    )}
                    <button
                      onClick={() => handleEdit(scenario)}
                      className="p-2 hover:bg-muted rounded-md transition-colors"
                      title="Edit scenario"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <div className="relative group">
                      <button
                        onClick={() => setDeleteConfirmId(scenario.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 rounded-md transition-colors"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Delete Confirmation */}
                      {deleteConfirmId === scenario.id && (
                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-border rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
                          <p className="text-sm font-medium mb-3">
                            Delete "{scenario.label}"?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(scenario.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="rounded-lg border border-border bg-muted p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Scenarios:</span>
                    <p className="font-medium text-foreground">{scenarioList.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Baseline:</span>
                    <p className="font-medium text-foreground">
                      {baseline?.label ?? 'None'}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportScenariosJSON(scenarioList as any)}
                className="gap-2"
                title="Export all scenarios as JSON"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export All</span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
