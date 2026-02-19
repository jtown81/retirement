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
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Alert, AlertDescription } from '@components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { SimulationInput } from '@models/simulation';
import type { FullSimulationResult } from '@models/simulation';

interface SaveScenarioDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inputs: SimulationInput | null;
  result: FullSimulationResult | null;
  onScenarioSaved?: (scenarioId: string) => void;
}

export function SaveScenarioDialog({
  isOpen,
  onOpenChange,
  inputs,
  result,
  onScenarioSaved,
}: SaveScenarioDialogProps) {
  const { saveScenario } = useScenarioManager();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) {
      setError('Please enter a scenario name');
      return;
    }

    if (!inputs || !result) {
      setError('Plan data not available. Please fill out all form sections first.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const scenarioId = saveScenario(
        label,
        inputs,
        result,
        description || undefined,
      );

      if (scenarioId) {
        setSuccess(true);
        setLabel('');
        setDescription('');
        setTimeout(() => {
          setSuccess(false);
          onOpenChange(false);
          onScenarioSaved?.(scenarioId);
        }, 1500);
      } else {
        setError('Failed to save scenario. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Save Scenario</DialogTitle>
          <DialogDescription>
            Save your current retirement plan as a named scenario for comparison and analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success ? (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Scenario saved successfully!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="scenario-name" className="text-sm font-medium">
                  Scenario Name *
                </label>
                <Input
                  id="scenario-name"
                  placeholder="e.g., Retire at 57 (MRA+30)"
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    setError(null);
                  }}
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name for this retirement plan scenario
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="scenario-desc" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  id="scenario-desc"
                  placeholder="Add notes about this scenario..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Notes to help you remember why you saved this scenario
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !label.trim()}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Scenario'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
