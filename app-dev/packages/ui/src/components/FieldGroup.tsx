import type { ReactNode, ReactElement } from 'react';
import { Children, isValidElement, cloneElement } from 'react';
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
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  // Inject aria-invalid and aria-describedby into the child input
  const childrenWithA11y = Children.map(children, (child) => {
    if (isValidElement(child) && errorId && error) {
      return cloneElement(child as ReactElement, {
        'aria-invalid': true,
        'aria-describedby': errorId,
      } as Record<string, unknown>);
    }
    return child;
  });

  return (
    <div>
      <Label htmlFor={htmlFor} className={cn('mb-1 flex items-center gap-1')}>
        {label}
        {required && <span className="text-destructive" aria-label="required">*</span>}
      </Label>
      <div className={cn('relative', error && 'has-error')}>
        {childrenWithA11y}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className={cn(
            'flex items-start gap-1.5 text-sm mt-1.5 text-destructive',
            'animate-in fade-in-0 slide-in-from-top-1 duration-200'
          )}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {hint && !error && <p className={cn('text-sm mt-1.5 text-muted-foreground')}>{hint}</p>}
    </div>
  );
}
