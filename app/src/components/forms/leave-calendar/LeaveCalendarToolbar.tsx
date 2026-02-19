/**
 * LeaveCalendarToolbar — Year picker, accrual rate dropdown,
 * carry-over inputs, save/clear actions.
 */

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => onYearChange(year - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground w-12 text-center">
            {year}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onYearChange(year + 1)}
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Accrual rate */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Accrual:</label>
          <Select value={String(accrualRate)} onValueChange={(val) => onAccrualRateChange(Number(val) as AccrualRate)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCRUAL_RATE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (window.confirm(`Clear all leave entries for ${year}?`)) {
              onClearYear();
            }
          }}
          className="ml-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Year
        </Button>
      </div>

      {/* Row 2: Carry-over inputs */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            Annual carry-over (hrs):
          </label>
          <Input
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
            className="w-20 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            Sick carry-over (hrs):
          </label>
          <Input
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
            className="w-20 h-9 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
