import { useState } from 'react';
import { useScenarioManager } from '@hooks/useScenarioManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import {
  AlertTriangle,
  Trash2,
  Star,
  Copy,
  Download,
  AlertCircle,
} from 'lucide-react';
import { exportScenarioJSON } from '@utils/export';
import type { NamedScenario } from '@models/scenario';

interface ScenarioListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadScenario?: (scenario: NamedScenario) => void;
}

export function ScenarioListDialog({
  isOpen,
  onOpenChange,
  onLoadScenario,
}: ScenarioListDialogProps) {
  const { scenarios, deleteScenario, setBaseline } = useScenarioManager();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    try {
      deleteScenario(id);
      setDeleteConfirm(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scenario');
    }
  };

  const handleSetBaseline = (id: string) => {
    setBaseline(id);
  };

  const handleExport = (scenario: NamedScenario) => {
    exportScenarioJSON(scenario);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Saved Scenarios</DialogTitle>
          <DialogDescription>
            View, compare, and manage your retirement plan scenarios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {scenarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No scenarios saved yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Save your current plan to create a scenario for comparison.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {scenario.label}
                        </h3>
                        {scenario.isBaseline && (
                          <Badge variant="default" className="gap-1">
                            <Star className="w-3 h-3" />
                            Baseline
                          </Badge>
                        )}
                      </div>
                      {scenario.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {scenario.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                        <span>Created: {scenario.createdAt}</span>
                        {scenario.updatedAt && (
                          <span>Updated: {scenario.updatedAt}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {!scenario.isBaseline && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetBaseline(scenario.id)}
                        className="gap-1"
                      >
                        <Star className="w-3 h-3" />
                        Set as Baseline
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onLoadScenario?.(scenario);
                        onOpenChange(false);
                      }}
                      className="gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(scenario)}
                      className="gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(scenario.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>

                  {deleteConfirm === scenario.id && (
                    <div className="flex gap-2 items-center bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                          Delete "{scenario.label}"?
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(scenario.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
