import { CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';

interface FormStateIndicatorProps {
  state: 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';
  message?: string;
  compact?: boolean;
}

/**
 * Displays the current state of a form
 * Useful for showing which section has unsaved changes or is being saved
 */
export function FormStateIndicator({
  state,
  message,
  compact = false,
}: FormStateIndicatorProps) {
  if (state === 'idle' || state === 'unsaved') {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="w-3 h-3" />
        Unsaved changes
      </div>
    );
  }

  if (state === 'saving') {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving...
      </div>
    );
  }

  if (state === 'saved') {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-3 h-3" />
        Saved {message ? `- ${message}` : ''}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive">
        <AlertCircle className="w-3 h-3" />
        {message || 'Error'}
      </div>
    );
  }

  return null;
}
