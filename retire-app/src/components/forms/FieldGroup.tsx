import type { ReactNode } from 'react';
import { Label } from '@components/ui/label';
import { cn } from '@lib/utils';

interface FieldGroupProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FieldGroup({ label, htmlFor, error, hint, children }: FieldGroupProps) {
  return (
    <div>
      <Label htmlFor={htmlFor} className={cn('mb-1')}>
        {label}
      </Label>
      {children}
      {error && <p className={cn('text-sm mt-1 text-destructive')}>{error}</p>}
      {hint && !error && <p className={cn('text-sm mt-1 text-muted-foreground')}>{hint}</p>}
    </div>
  );
}
