/**
 * LeaveBalanceSummaryPanel — Compact summary bar showing carry-over, accrued,
 * planned, actual, projected EOY, and use-or-lose for annual and sick leave.
 */

import type { CalendarYearSummary } from '@modules/leave/calendar-bridge';

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
      <div className="text-[10px] text-gray-500 whitespace-normal break-words">{label}</div>
      <div
        className={`text-sm font-semibold ${
          warning ? 'text-red-600' : color ?? 'text-gray-900'
        }`}
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
      <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
        <div className="text-xs font-medium text-blue-800 mb-1">Annual Leave</div>
        <div className="flex justify-between gap-2 overflow-x-auto">
          <StatItem label="Carry-over" value={summary.annualCarryOver} />
          <StatItem label="Accrued" value={summary.annualAccrued} color="text-green-700" />
          <StatItem label="Planned" value={summary.plannedAnnualUsed} color="text-blue-600" />
          <StatItem label="Actual" value={summary.actualAnnualUsed} color="text-green-600" />
          <StatItem label="Proj. EOY" value={summary.projectedAnnualEOY} />
          <StatItem
            label="Use/Lose"
            value={summary.useOrLoseHours}
            warning={summary.useOrLoseHours > 0}
          />
        </div>
      </div>

      {/* Sick Leave Row */}
      <div className="bg-orange-50 border border-orange-100 rounded-md px-3 py-2">
        <div className="text-xs font-medium text-orange-800 mb-1">Sick Leave</div>
        <div className="flex justify-between gap-2 overflow-x-auto">
          <StatItem label="Carry-over" value={summary.sickCarryOver} />
          <StatItem label="Accrued" value={summary.sickAccrued} color="text-green-700" />
          <StatItem label="LS Planned" value={summary.plannedSickLS} color="text-orange-600" />
          <StatItem label="LS Actual" value={summary.actualSickLS} color="text-red-600" />
          <StatItem label="DE Planned" value={summary.plannedSickDE} color="text-orange-600" />
          <StatItem label="DE Actual" value={summary.actualSickDE} color="text-red-600" />
          <StatItem label="Proj. EOY" value={summary.projectedSickEOY} />
        </div>
      </div>
    </div>
  );
}
