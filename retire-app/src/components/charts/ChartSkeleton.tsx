/**
 * ChartSkeleton — Loading skeleton for chart containers
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';

interface ChartSkeletonProps {
  title: string;
  subtitle?: string;
}

export function ChartSkeleton({ title, subtitle }: ChartSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ minHeight: 300 }} className="h-[250px] lg:h-[350px]">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
