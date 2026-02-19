import { ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import type { ChartContainerProps } from './chart-types';

export function ChartContainer({
  title,
  subtitle,
  minHeight,
  children,
}: ChartContainerProps) {
  // Note: Charts should NOT use inner ResponsiveContainer wrappers.
  // ChartContainer's ResponsiveContainer will handle all responsive sizing.
  // If a chart needs custom height on specific breakpoints, add a className prop.
  const heightClass = minHeight
    ? minHeight <= 300
      ? 'h-[250px] lg:h-[350px]'
      : minHeight <= 400
        ? 'h-[300px] lg:h-[400px]'
        : 'h-[350px] lg:h-[450px]'
    : 'h-[250px] lg:h-[350px]';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={heightClass}>
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
