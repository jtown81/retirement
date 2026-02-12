/**
 * LeaveCalendarToolbar — Year picker, accrual rate dropdown,
 * carry-over inputs, save/clear actions.
 */

import type { AccrualRate, LeaveCarryOver } from '@models/leave-calendar';

interface LeaveCalendarToolbarProps {
  year: number;
  accrualRate: AccrualRate;
  carryOver: LeaveCarryOver;
  onYearChange: (year: number) => void;
  onAccrualRateChange: (rate: AccrualRate) => void;
  onCarryOverChange: (carryOver: LeaveCarryOver) => void;
  onClearYear: () => void;
}

const ACCRUAL_RATE_OPTIONS: { value: AccrualRate; label: string }[] = [
  { value: 4, label: '4 hrs/PP (< 3 yrs)' },
  { value: 6, label: '6 hrs/PP (3–15 yrs)' },
  { value: 8, label: '8 hrs/PP (15+ yrs)' },
];

export function LeaveCalendarToolbar({
  year,
  accrualRate,
  carryOver,
  onYearChange,
  onAccrualRateChange,
  onCarryOverChange,
  onClearYear,
}: LeaveCalendarToolbarProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Year + Accrual Rate */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Year picker */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onYearChange(year - 1)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            aria-label="Previous year"
          >
            &larr;
          </button>
          <span className="text-sm font-semibold text-gray-800 w-12 text-center">
            {year}
          </span>
          <button
            type="button"
            onClick={() => onYearChange(year + 1)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            aria-label="Next year"
          >
            &rarr;
          </button>
        </div>

        {/* Accrual rate */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Accrual:</label>
          <select
            value={accrualRate}
            onChange={(e) => onAccrualRateChange(Number(e.target.value) as AccrualRate)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {ACCRUAL_RATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Clear all leave entries for ${year}?`)) {
              onClearYear();
            }
          }}
          className="ml-auto text-xs text-gray-500 hover:text-red-600"
        >
          Clear Year
        </button>
      </div>

      {/* Row 2: Carry-over inputs */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 whitespace-nowrap">
            Annual carry-over (hrs):
          </label>
          <input
            type="number"
            min={0}
            max={240}
            step={1}
            value={carryOver.annualLeaveHours}
            onChange={(e) =>
              onCarryOverChange({
                ...carryOver,
                annualLeaveHours: Math.max(0, Number(e.target.value)),
              })
            }
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 whitespace-nowrap">
            Sick carry-over (hrs):
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={carryOver.sickLeaveHours}
            onChange={(e) =>
              onCarryOverChange({
                ...carryOver,
                sickLeaveHours: Math.max(0, Number(e.target.value)),
              })
            }
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
