/**
 * ChartTooltip — Shared tooltip wrapper using semantic design tokens.
 *
 * Provides consistent styling for all chart tooltips with proper dark mode support.
 */

import { cn } from '@lib/utils';

interface ChartTooltipProps {
  children: React.ReactNode;
  className?: string;
}

export function ChartTooltip({ children, className }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        'bg-popover text-popover-foreground border border-border rounded px-3 py-2 shadow-md text-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
