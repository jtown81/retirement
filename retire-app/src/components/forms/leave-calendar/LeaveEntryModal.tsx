/**
 * LeaveEntryModal — Modal for adding/editing leave entries on selected date(s).
 *
 * Leave type dropdown, hours input (default 8, step 0.25),
 * sick code dropdown (conditional on sick type), notes, save/delete/cancel.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{existingEntry ? 'Edit Leave Entry' : 'Add Leave'}</DialogTitle>
          <DialogDescription>{dateLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type</Label>
            <Select value={leaveType} onValueChange={(val) => setLeaveType(val as CalendarLeaveType)}>
              <SelectTrigger id="leave-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              type="number"
              min={0.25}
              max={8}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </div>

          {/* Sick Code (conditional) */}
          {isSick && (
            <div className="space-y-2">
              <Label htmlFor="sick-code">Sick Leave Code</Label>
              <Select value={sickCode ?? ''} onValueChange={(val) => setSickCode(val ? (val as SickLeaveCode) : undefined)}>
                <SelectTrigger id="sick-code">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— optional —</SelectItem>
                  {SICK_CODE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                onSave(leaveType, hours, isSick ? sickCode : undefined, notes || undefined)
              }
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
