import { ResponsiveContainer } from 'recharts';
import type { ChartContainerProps } from './chart-types';

export function ChartContainer({
  title,
  subtitle,
  minHeight,
  children,
}: ChartContainerProps) {
  const height = minHeight ?? 300;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      <div style={{ minHeight: height }} className="h-[250px] lg:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
