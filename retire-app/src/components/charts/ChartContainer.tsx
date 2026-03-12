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
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs sm:text-sm">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div style={{ minHeight: height }} className="h-[200px] sm:h-[280px] md:h-[320px] lg:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
