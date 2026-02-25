import { Lock } from 'lucide-react';
import { Button } from '@components/ui/button';

export interface UpgradePromptProps {
  /** Feature name (e.g., "Advanced Simulation") */
  feature: string;
  /** Optional description of locked feature */
  description?: string;
  /** Optional callback when upgrade button is clicked (Phase 4 integration) */
  onUpgradeClick?: () => void;
}

/**
 * Paywall component shown when a premium feature is accessed by basic tier users.
 * Displays lock icon, feature name, and upgrade CTA button.
 *
 * Phase 3B: UI stub with localStorage tier checking.
 * Phase 4: Wire onUpgradeClick to RevenueCat/Firebase entitlement flow.
 */
export function UpgradePrompt({
  feature,
  description,
  onUpgradeClick,
}: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-border bg-card min-h-96">
      <Lock className="w-12 h-12 text-muted-foreground mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{feature}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
          {description}
        </p>
      )}
      <Button
        onClick={onUpgradeClick}
        className="mt-4"
        aria-label={`Upgrade to Premium to unlock ${feature}`}
      >
        Unlock Premium
      </Button>
      <p className="text-xs text-muted-foreground mt-4">
        Upgrade to access advanced retirement planning tools
      </p>
    </div>
  );
}
