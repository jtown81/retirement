import type { ReactNode } from 'react';
import { Label } from '@components/ui/label';
import { cn } from '@lib/utils';
import { AlertCircle } from 'lucide-react';

interface FieldGroupProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FieldGroup({ label, htmlFor, error, hint, required, children }: FieldGroupProps) {
  return (
    <div>
      <Label htmlFor={htmlFor} className={cn('mb-1 flex items-center gap-1')}>
        {label}
        {required && <span className="text-destructive" aria-label="required">*</span>}
      </Label>
      <div className={cn('relative', error && 'has-error')}>
        {children}
      </div>
      {error && (
        <div className={cn(
          'flex items-start gap-1.5 text-sm mt-1.5 text-destructive',
          'animate-in fade-in-0 slide-in-from-top-1 duration-200'
        )}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p role="alert">{error}</p>
        </div>
      )}
      {hint && !error && <p className={cn('text-sm mt-1.5 text-muted-foreground')}>{hint}</p>}
    </div>
  );
}
