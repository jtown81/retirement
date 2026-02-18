/**
 * Save Scenario Dialog
 * Modal dialog for saving current plan as a named scenario.
 */

import { useState } from 'react';
import { useScenarioManager } from '@hooks/useScenarioManager';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, NamedScenariosArraySchema } from '@storage/index';
import { Button } from '@components/ui/button';
import { X } from 'lucide-react';

interface SaveScenarioDialogProps {
  onSave: () => void;
  onCancel: () => void;
}

export function SaveScenarioDialog({ onSave, onCancel }: SaveScenarioDialogProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { saveScenario } = useScenarioManager();
  const [scenarios] = useLocalStorage(STORAGE_KEYS.NAMED_SCENARIOS, NamedScenariosArraySchema);

  // Import these dynamically to avoid circular dependencies
  const [currentInputs, setCurrentInputs] = useState<any>(null);
  const [currentResult, setCurrentResult] = useState<any>(null);

  const handleSave = async () => {
    setError('');

    // Validate label
    if (!label.trim()) {
      setError('Scenario name is required');
      return;
    }

    if (label.length > 200) {
      setError('Scenario name must be 200 characters or less');
      return;
    }

    // Check for duplicates
    const isDuplicate = (scenarios ?? []).some(
      (s) => s.label.toLowerCase() === label.toLowerCase(),
    );
    if (isDuplicate) {
      // Allow override
      const confirmed = window.confirm(
        `Scenario "${label}" already exists. Overwrite it?`,
      );
      if (!confirmed) return;
    }

    // In real implementation, these would come from the app context
    // For now, show a message
    if (!currentInputs || !currentResult) {
      setError(
        'Unable to save scenario. Please ensure your plan is complete and return to the form.',
      );
      return;
    }

    setIsLoading(true);
    try {
      const id = saveScenario(label, currentInputs, currentResult, description);
      if (id) {
        onSave();
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to save scenario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Save Current Plan as Scenario
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Scenario Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Scenario Name *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Retire at 57 — MRA+30"
              maxLength={200}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {label.length}/200
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this scenario..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Info Message */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-200">
              This will save your current form data and retirement projection. You can
              load and edit this scenario anytime.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !label.trim()}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Scenario'}
          </Button>
        </div>
      </div>
    </div>
  );
}
