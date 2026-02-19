import { Check, Circle } from 'lucide-react';
import { Badge } from '@components/ui/badge';

interface TabCompletionBadgeProps {
  isComplete: boolean;
  size?: 'sm' | 'md';
}

/**
 * Visual indicator for tab completion status
 * Shows checkmark when complete, circle when incomplete
 */
export function TabCompletionBadge({ isComplete, size = 'sm' }: TabCompletionBadgeProps) {
  if (!isComplete) {
    return (
      <Circle
        className={`text-muted-foreground flex-shrink-0 ${
          size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
        }`}
        fill="currentColor"
      />
    );
  }

  return (
    <Badge variant="default" className="gap-1 ml-2">
      <Check className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
    </Badge>
  );
}
