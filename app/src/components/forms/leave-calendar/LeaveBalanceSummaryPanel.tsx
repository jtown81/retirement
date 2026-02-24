/**
 * LeaveBalanceSummaryPanel — Compact summary bar showing carry-over, accrued,
 * planned, actual, projected EOY, and use-or-lose for annual and sick leave.
 */

import { cn } from '@lib/utils';
import type { CalendarYearSummary } from '@fedplan/leave/calendar-bridge';

interface LeaveBalanceSummaryPanelProps {
  summary: CalendarYearSummary;
}

function StatItem({
  label,
  value,
  color,
  warning,
}: {
  label: string;
  value: number;
  color?: string;
  warning?: boolean;
}) {
  return (
    <div className="text-center min-w-0">
      <div className="text-xs text-muted-foreground whitespace-normal break-words">{label}</div>
      <div
        className={cn(
          'text-sm font-semibold',
          warning ? 'text-red-600 dark:text-red-400' : color ?? 'text-foreground',
        )}
      >
        {value.toFixed(0)}
      </div>
    </div>
  );
}

export function LeaveBalanceSummaryPanel({ summary }: LeaveBalanceSummaryPanelProps) {
  return (
    <div className="space-y-2">
      {/* Annual Leave Row */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 rounded-md px-3 py-2">
        <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Annual Leave</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <StatItem label="Carry-over" value={summary.annualCarryOver} />
          <StatItem label="Accrued" value={summary.annualAccrued} color="text-green-700 dark:text-green-400" />
          <StatItem label="Planned" value={summary.plannedAnnualUsed} color="text-blue-600 dark:text-blue-400" />
          <StatItem label="Actual" value={summary.actualAnnualUsed} color="text-green-600 dark:text-green-400" />
          <StatItem label="Proj. EOY" value={summary.projectedAnnualEOY} />
          <StatItem
            label="Use/Lose"
            value={summary.useOrLoseHours}
            warning={summary.useOrLoseHours > 0}
          />
        </div>
      </div>

      {/* Sick Leave Row */}
      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-800 rounded-md px-3 py-2">
        <div className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-2">Sick Leave</div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          <StatItem label="Carry-over" value={summary.sickCarryOver} />
          <StatItem label="Accrued" value={summary.sickAccrued} color="text-green-700 dark:text-green-400" />
          <StatItem label="LS Planned" value={summary.plannedSickLS} color="text-orange-600 dark:text-orange-400" />
          <StatItem label="LS Actual" value={summary.actualSickLS} color="text-red-600 dark:text-red-400" />
          <StatItem label="DE Planned" value={summary.plannedSickDE} color="text-orange-600 dark:text-orange-400" />
          <StatItem label="DE Actual" value={summary.actualSickDE} color="text-red-600 dark:text-red-400" />
          <StatItem label="Proj. EOY" value={summary.projectedSickEOY} />
        </div>
      </div>
    </div>
  );
}
