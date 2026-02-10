import type { MetricCardProps } from '@components/charts/chart-types';

const VARIANT_STYLES: Record<NonNullable<MetricCardProps['variant']>, string> = {
  positive: 'text-green-700',
  negative: 'text-red-700',
  neutral: 'text-gray-700',
  default: 'text-gray-900',
};

export function MetricCard({ label, value, variant = 'default' }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4" data-testid="metric-card">
      <p className="text-sm text-gray-500 truncate">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${VARIANT_STYLES[variant]}`}>
        {value}
      </p>
    </div>
  );
}
