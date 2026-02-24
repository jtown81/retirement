/**
 * LeaveCalendarGrid — Renders 12 MonthCalendar components in a responsive grid.
 */

import { useMemo } from 'react';
import { MonthCalendar } from './MonthCalendar';
import { getFederalHolidays } from '@data/federal-holidays';
import type { CalendarLeaveEntry } from '@fedplan/models';

interface LeaveCalendarGridProps {
  year: number;
  entries: CalendarLeaveEntry[];
  selectedDates: Set<string>;
  onDayClick: (dateStr: string, shiftKey: boolean) => void;
}

export function LeaveCalendarGrid({
  year,
  entries,
  selectedDates,
  onDayClick,
}: LeaveCalendarGridProps) {
  const holidays = useMemo(() => getFederalHolidays(year), [year]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 12 }, (_, month) => (
        <MonthCalendar
          key={month}
          year={year}
          month={month}
          entries={entries}
          selectedDates={selectedDates}
          holidays={holidays}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
}
