import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { useState, useEffect } from 'react';

interface FormErrorSummaryProps {
  errors: Record<string, string>;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

/**
 * Displays a summary of form validation errors
 * Useful when a sub-form has multiple field errors
 */
export function FormErrorSummary({
  errors,
  onDismiss,
  autoHideDuration,
}: FormErrorSummaryProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after duration if specified
  useEffect(() => {
    if (!autoHideDuration || Object.keys(errors).length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, [errors, autoHideDuration]);

  const errorCount = Object.keys(errors).filter((key) => errors[key]).length;

  if (errorCount === 0 || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const errorMessages = Object.entries(errors)
    .filter(([, msg]) => msg)
    .map(([key, msg]) => msg);

  return (
    <Alert variant="destructive" className="mb-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <AlertTitle>
              {errorCount === 1 ? 'Validation error' : `${errorCount} validation errors`}
            </AlertTitle>
            {errorCount === 1 ? (
              <AlertDescription className="mt-1">{errorMessages[0]}</AlertDescription>
            ) : (
              <ul className="mt-2 space-y-1">
                {errorMessages.map((msg, idx) => (
                  <li key={idx} className="text-sm text-destructive/90">
                    • {msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 flex-shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss error</span>
        </Button>
      </div>
    </Alert>
  );
}
