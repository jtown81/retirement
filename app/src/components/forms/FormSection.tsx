import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  onSave: () => void;
  onClear: () => void;
  onLoadDefaults?: () => void;
  children: ReactNode;
}

export function FormSection({ title, description, onSave, onClear, onLoadDefaults, children }: FormSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>

      <div className="space-y-4">{children}</div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Save Section
        </button>
        <button
          type="button"
          onClick={onClear}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
        >
          Clear Section
        </button>
        {onLoadDefaults && (
          <button
            type="button"
            onClick={onLoadDefaults}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Load Defaults
          </button>
        )}
      </div>
    </div>
  );
}
