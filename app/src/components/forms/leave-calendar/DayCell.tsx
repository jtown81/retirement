/**
 * DayCell — Single day cell in the month calendar grid.
 *
 * Shows day number, a color dot for leave type, and hours badge for partial days.
 * Colors: blue = planned-annual, green = actual-annual,
 *         orange = planned-sick, red = actual-sick.
 */

import type { CalendarLeaveEntry, CalendarLeaveType } from '@models/leave-calendar';

interface DayCellProps {
  day: number;
  dateStr: string;
  isWeekend: boolean;
  isToday: boolean;
  isSelected: boolean;
  entries: CalendarLeaveEntry[];
  holidayName?: string;
  onClick: (dateStr: string, shiftKey: boolean) => void;
}

const TYPE_COLORS: Record<CalendarLeaveType, string> = {
  'planned-annual': 'bg-blue-400',
  'actual-annual': 'bg-green-500',
  'planned-sick': 'bg-orange-400',
  'actual-sick': 'bg-red-500',
};

const TYPE_RING_COLORS: Record<CalendarLeaveType, string> = {
  'planned-annual': 'ring-blue-400',
  'actual-annual': 'ring-green-500',
  'planned-sick': 'ring-orange-400',
  'actual-sick': 'ring-red-500',
};

export function DayCell({
  day,
  dateStr,
  isWeekend,
  isToday,
  isSelected,
  entries,
  holidayName,
  onClick,
}: DayCellProps) {
  if (day === 0) {
    return <div className="h-10 sm:h-12" />;
  }

  const isOff = isWeekend || !!holidayName;
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const primaryEntry = entries[0];

  return (
    <button
      type="button"
      disabled={isOff}
      onClick={(e) => onClick(dateStr, e.shiftKey)}
      title={holidayName}
      className={`
        h-10 sm:h-12 relative flex flex-col items-center justify-center rounded text-xs
        transition-colors
        ${isOff ? 'cursor-default' : 'hover:bg-gray-50 cursor-pointer'}
        ${isWeekend ? 'bg-gray-100 text-gray-400' : ''}
        ${holidayName && !isWeekend ? 'bg-amber-50 text-amber-800' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        ${isToday && !isSelected ? 'ring-1 ring-gray-400' : ''}
      `}
    >
      <span className={`text-xs ${holidayName && !isWeekend ? 'text-amber-800' : 'text-gray-800'} ${isWeekend ? 'text-gray-400' : ''} ${isToday ? 'font-bold' : ''}`}>{day}</span>
      {holidayName && !isWeekend && (
        <span className="w-2 h-2 text-amber-600 leading-none text-[8px]" title={holidayName}>&#9670;</span>
      )}
      {primaryEntry && !holidayName && (
        <span
          className={`w-2 h-2 rounded-full mt-0.5 ${TYPE_COLORS[primaryEntry.leaveType]}`}
          title={primaryEntry.leaveType}
        />
      )}
      {totalHours > 0 && totalHours < 8 && (
        <span className="absolute bottom-0.5 right-0.5 text-[9px] text-gray-500 leading-none">
          {totalHours}h
        </span>
      )}
    </button>
  );
}
