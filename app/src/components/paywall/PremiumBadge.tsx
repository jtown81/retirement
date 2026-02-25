import { Lock } from 'lucide-react';

export interface PremiumBadgeProps {
  /** Optional custom label (defaults to "Premium") */
  label?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Inline badge component indicating a feature is premium-only.
 * Used alongside locked buttons, tabs, and other UI elements.
 *
 * Displays lock icon + label with subtle styling.
 */
export function PremiumBadge({
  label = 'Premium',
  className = '',
}: PremiumBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 ${className}`}
      aria-label={label}
    >
      <Lock className="w-3 h-3" aria-hidden="true" />
      {label}
    </span>
  );
}
