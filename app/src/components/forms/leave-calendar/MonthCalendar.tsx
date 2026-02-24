/**
 * MonthCalendar — Standard calendar grid for one month.
 *
 * Renders day headers and DayCell components.
 * Click selects a day, shift+click selects a range from last-selected.
 */

import { DayCell } from './DayCell';
import { formatDate } from '@fedplan/leave';
import { Card } from '@components/ui/card';
import type { CalendarLeaveEntry } from '@fedplan/models';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthCalendarProps {
  year: number;
  month: number; // 0-indexed
  entries: CalendarLeaveEntry[];
  selectedDates: Set<string>;
  holidays: Map<string, string>;
  onDayClick: (dateStr: string, shiftKey: boolean) => void;
}

export function MonthCalendar({
  year,
  month,
  entries,
  selectedDates,
  holidays,
  onDayClick,
}: MonthCalendarProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = formatDate(new Date());

  // Build entries lookup by date
  const entriesByDate = new Map<string, CalendarLeaveEntry[]>();
  for (const entry of entries) {
    const existing = entriesByDate.get(entry.date) ?? [];
    existing.push(entry);
    entriesByDate.set(entry.date, existing);
  }

  // Build grid rows
  const cells: { day: number; dateStr: string }[] = [];

  // Leading blanks
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, dateStr: '' });
  }
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: formatDate(new Date(year, month, d)) });
  }

  // Month-level totals
  const monthEntries = entries.filter((e) => {
    const [, m] = e.date.split('-').map(Number);
    return m === month + 1;
  });
  const monthHours = monthEntries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <Card className="p-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-foreground">
          {MONTH_NAMES[month]}
        </h4>
        {monthHours > 0 && (
          <span className="text-xs text-muted-foreground">{monthHours}h used</span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground pb-1">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const isWeekend =
            cell.day > 0 && (new Date(year, month, cell.day).getDay() === 0 || new Date(year, month, cell.day).getDay() === 6);
          return (
            <DayCell
              key={i}
              day={cell.day}
              dateStr={cell.dateStr}
              isWeekend={isWeekend}
              isToday={cell.dateStr === todayStr}
              isSelected={selectedDates.has(cell.dateStr)}
              entries={entriesByDate.get(cell.dateStr) ?? []}
              holidayName={holidays.get(cell.dateStr)}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </Card>
  );
}
