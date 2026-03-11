import { AlertCircle } from 'lucide-react';

interface FormErrorSummaryProps {
  errors: Record<string, string>;
}

/**
 * Displays a summary of form errors at the top of a form section.
 * Only renders if there are errors present.
 */
export function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors);

  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <span className="font-medium capitalize">{field}:</span> {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
