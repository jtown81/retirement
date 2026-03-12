/**
 * LeaveBalanceForm — Root orchestrator for the leave calendar system.
 *
 * Composes the toolbar, summary panel, calendar grid, and entry modal
 * into a single form section. Replaces the original 4-field balance form.
 */

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { useLeaveCalendar } from './leave-calendar/useLeaveCalendar';
import { LeaveCalendarToolbar } from './leave-calendar/LeaveCalendarToolbar';
import { LeaveBalanceSummaryPanel } from './leave-calendar/LeaveBalanceSummaryPanel';
import { LeaveCalendarGrid } from './leave-calendar/LeaveCalendarGrid';
import { LeaveEntryModal } from './leave-calendar/LeaveEntryModal';
import { weekdaysInRange, parseDate } from '@modules/leave/calendar-utils';
import type { CalendarLeaveType, SickLeaveCode, CalendarLeaveEntry } from '@models/leave-calendar';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function LeaveBalanceForm() {
  const cal = useLeaveCalendar();
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const lastClickedRef = useRef<string | null>(null);

  // Find existing entry when editing a single selected date
  const selectedArr = Array.from(selectedDates);
  const existingEntry =
    selectedArr.length === 1
      ? cal.activeYearData.entries.find((e) => e.date === selectedArr[0])
      : undefined;

  const handleDayClick = useCallback(
    (dateStr: string, shiftKey: boolean) => {
      if (shiftKey && lastClickedRef.current) {
        // Range selection: all weekdays between last click and this click
        const start = parseDate(
          lastClickedRef.current < dateStr ? lastClickedRef.current : dateStr,
        );
        const end = parseDate(
          lastClickedRef.current < dateStr ? dateStr : lastClickedRef.current,
        );
        const range = weekdaysInRange(start, end);
        setSelectedDates(new Set(range));
      } else {
        // Toggle single date or start new selection
        setSelectedDates((prev) => {
          const next = new Set<string>();
          if (!prev.has(dateStr)) {
            next.add(dateStr);
          }
          return next;
        });
      }
      lastClickedRef.current = dateStr;

      // Auto-open modal
      setShowModal(true);
    },
    [],
  );

  const handleSave = useCallback(
    (
      leaveType: CalendarLeaveType,
      hours: number,
      sickCode?: SickLeaveCode,
      notes?: string,
    ) => {
      if (existingEntry && selectedArr.length === 1) {
        // Update existing entry
        cal.updateEntry(existingEntry.id, { leaveType, hours, sickCode, notes });
      } else {
        // Create new entries for all selected dates
        // First remove any existing entries for these dates
        const existingIds = cal.activeYearData.entries
          .filter((e) => selectedDates.has(e.date))
          .map((e) => e.id);
        if (existingIds.length > 0) {
          cal.removeEntries(existingIds);
        }

        const newEntries: CalendarLeaveEntry[] = selectedArr.map((date) => ({
          id: generateId(),
          date,
          leaveType,
          hours,
          sickCode,
          notes,
        }));
        cal.addEntries(newEntries);
      }
      setShowModal(false);
      setSelectedDates(new Set());
    },
    [cal, existingEntry, selectedArr, selectedDates],
  );

  const handleDelete = useCallback(() => {
    if (selectedArr.length === 1 && existingEntry) {
      cal.removeEntry(existingEntry.id);
    } else {
      const ids = cal.activeYearData.entries
        .filter((e) => selectedDates.has(e.date))
        .map((e) => e.id);
      if (ids.length > 0) cal.removeEntries(ids);
    }
    setShowModal(false);
    setSelectedDates(new Set());
  }, [cal, selectedArr, existingEntry, selectedDates]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedDates(new Set());
  }, []);

  // Legend
  const legendItems = [
    { color: 'bg-blue-400', label: 'Planned Annual' },
    { color: 'bg-green-500', label: 'Actual Annual' },
    { color: 'bg-orange-400', label: 'Planned Sick' },
    { color: 'bg-red-500', label: 'Actual Sick' },
    { color: 'bg-amber-400', label: 'Federal Holiday' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Calendar</CardTitle>
        <CardDescription>
          Plan and track your leave day-by-day. Click a day to add leave; Shift+click to select a range.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Toolbar */}
        <LeaveCalendarToolbar
          year={cal.data.activeYear}
          accrualRate={cal.activeYearData.accrualRatePerPP}
          carryOver={cal.activeYearData.carryOver}
          onYearChange={cal.setActiveYear}
          onAccrualRateChange={cal.setAccrualRate}
          onCarryOverChange={cal.setCarryOver}
          onClearYear={cal.clearYear}
        />

        {/* Summary Panel */}
        <LeaveBalanceSummaryPanel summary={cal.summary} />

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {legendItems.map((item) => (
            <Badge key={item.label} variant="outline" className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              {item.label}
            </Badge>
          ))}
        </div>

        {/* Calendar Grid */}
        <LeaveCalendarGrid
          year={cal.data.activeYear}
          entries={cal.activeYearData.entries}
          selectedDates={selectedDates}
          onDayClick={handleDayClick}
        />
      </CardContent>

      {/* Modal */}
      {showModal && selectedArr.length > 0 && (
        <LeaveEntryModal
          selectedDates={selectedArr}
          existingEntry={existingEntry}
          onSave={handleSave}
          onDelete={
            existingEntry ||
            cal.activeYearData.entries.some((e) => selectedDates.has(e.date))
              ? handleDelete
              : undefined
          }
          onClose={handleCloseModal}
        />
      )}
    </Card>
  );
}
