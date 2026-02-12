/**
 * LeaveEntryModal — Modal for adding/editing leave entries on selected date(s).
 *
 * Leave type dropdown, hours input (default 8, step 0.25),
 * sick code dropdown (conditional on sick type), notes, save/delete/cancel.
 */

import { useState, useEffect } from 'react';
import type { CalendarLeaveType, SickLeaveCode, CalendarLeaveEntry } from '@models/leave-calendar';

interface LeaveEntryModalProps {
  selectedDates: string[];
  /** Existing entry if editing a single date that has one */
  existingEntry?: CalendarLeaveEntry;
  onSave: (leaveType: CalendarLeaveType, hours: number, sickCode?: SickLeaveCode, notes?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const LEAVE_TYPE_OPTIONS: { value: CalendarLeaveType; label: string }[] = [
  { value: 'planned-annual', label: 'Planned Annual' },
  { value: 'actual-annual', label: 'Actual Annual' },
  { value: 'planned-sick', label: 'Planned Sick' },
  { value: 'actual-sick', label: 'Actual Sick' },
];

const SICK_CODE_OPTIONS: { value: SickLeaveCode; label: string }[] = [
  { value: 'LS', label: 'LS — Self' },
  { value: 'DE', label: 'DE — Dependent' },
];

export function LeaveEntryModal({
  selectedDates,
  existingEntry,
  onSave,
  onDelete,
  onClose,
}: LeaveEntryModalProps) {
  const [leaveType, setLeaveType] = useState<CalendarLeaveType>(
    existingEntry?.leaveType ?? 'planned-annual',
  );
  const [hours, setHours] = useState(existingEntry?.hours ?? 8);
  const [sickCode, setSickCode] = useState<SickLeaveCode | undefined>(
    existingEntry?.sickCode,
  );
  const [notes, setNotes] = useState(existingEntry?.notes ?? '');

  const isSick = leaveType === 'planned-sick' || leaveType === 'actual-sick';

  useEffect(() => {
    if (!isSick) setSickCode(undefined);
  }, [isSick]);

  const dateLabel =
    selectedDates.length === 1
      ? selectedDates[0]
      : `${selectedDates.length} days selected`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          {existingEntry ? 'Edit Leave Entry' : 'Add Leave'}
        </h3>
        <p className="text-xs text-gray-500 mb-4">{dateLabel}</p>

        <div className="space-y-3">
          {/* Leave Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Leave Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as CalendarLeaveType)}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {LEAVE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hours */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hours
            </label>
            <input
              type="number"
              min={0.25}
              max={8}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Sick Code (conditional) */}
          {isSick && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sick Leave Code
              </label>
              <select
                value={sickCode ?? ''}
                onChange={(e) =>
                  setSickCode(e.target.value ? (e.target.value as SickLeaveCode) : undefined)
                }
                className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— optional —</option>
                {SICK_CODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-5 pt-3 border-t border-gray-200">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                onSave(leaveType, hours, isSick ? sickCode : undefined, notes || undefined)
              }
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
