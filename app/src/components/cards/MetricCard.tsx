import { memo } from 'react';
import { Card, CardContent } from '@components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@lib/utils';
import type { MetricCardProps } from '@components/charts/chart-types';

const VARIANT_STYLES: Record<NonNullable<MetricCardProps['variant']>, string> = {
  positive: 'text-green-700 dark:text-green-400',
  negative: 'text-red-700 dark:text-red-400',
  neutral: 'text-muted-foreground',
  default: 'text-foreground',
};

function MetricCardComponent({ label, value, variant = 'default' }: MetricCardProps) {
  return (
    <Card
      data-testid="metric-card"
      className="transition-shadow hover:shadow-md"
    >
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className={cn('mt-1 text-lg font-semibold break-words line-clamp-2 flex items-center gap-2', VARIANT_STYLES[variant])}>
          {variant === 'positive' && <TrendingUp className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
          {variant === 'negative' && <TrendingDown className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export const MetricCard = memo(MetricCardComponent);
