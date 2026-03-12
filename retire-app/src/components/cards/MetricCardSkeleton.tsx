/**
 * MetricCardSkeleton — Loading skeleton for MetricCard
 */

import { Card, CardContent } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-6 w-32" />
      </CardContent>
    </Card>
  );
}
