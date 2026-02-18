/**
 * Edit Scenario Dialog
 * Modal dialog for editing scenario label and description.
 */

import { useState } from 'react';
import { Button } from '@components/ui/button';
import { X } from 'lucide-react';

interface EditScenarioDialogProps {
  label: string;
  description: string;
  onSave: (label: string, description: string) => void;
  onCancel: () => void;
}

export function EditScenarioDialog({
  label: initialLabel,
  description: initialDescription,
  onSave,
  onCancel,
}: EditScenarioDialogProps) {
  const [label, setLabel] = useState(initialLabel);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');

    if (!label.trim()) {
      setError('Scenario name is required');
      return;
    }

    if (label.length > 200) {
      setError('Scenario name must be 200 characters or less');
      return;
    }

    onSave(label, description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Edit Scenario
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
              maxLength={200}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!label.trim()}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
