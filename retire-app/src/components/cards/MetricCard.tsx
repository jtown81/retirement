import { Card, CardContent } from '@components/ui/card';
import { cn } from '@lib/utils';
import type { MetricCardProps } from '@components/charts/chart-types';

const VARIANT_STYLES: Record<NonNullable<MetricCardProps['variant']>, string> = {
  positive: 'text-green-700 dark:text-green-400',
  negative: 'text-red-700 dark:text-red-400',
  neutral: 'text-muted-foreground',
  default: 'text-foreground',
};

export function MetricCard({ label, value, variant = 'default' }: MetricCardProps) {
  return (
    <Card
      data-testid="metric-card"
      className="transition-shadow hover:shadow-md"
    >
      <CardContent className="pt-2 sm:pt-4 px-3 sm:px-4">
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
        <p className={cn('mt-1 text-base sm:text-lg font-semibold truncate', VARIANT_STYLES[variant])}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
