import { ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import type { ChartContainerProps } from './chart-types';

export function ChartContainer({
  title,
  subtitle,
  minHeight,
  children,
}: ChartContainerProps) {
  const height = minHeight ?? 300;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ minHeight: height }} className="h-[250px] lg:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
