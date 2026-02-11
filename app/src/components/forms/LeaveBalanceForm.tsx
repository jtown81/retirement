import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, LeaveBalanceSchema } from '@storage/index';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import type { LeaveBalance } from '@models/leave';

const DEFAULTS: LeaveBalance = {
  asOf: '',
  annualLeaveHours: 0,
  sickLeaveHours: 0,
  familyCareUsedCurrentYear: 0,
};

export function LeaveBalanceForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
  const [form, setForm] = useState<LeaveBalance>(stored ?? DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof LeaveBalance>(key: K, value: LeaveBalance[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const result = LeaveBalanceSchema.safeParse(form);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])),
      );
      return;
    }
    setErrors({});
    save(result.data);
  };

  const handleClear = () => {
    if (window.confirm('Clear leave balance data? This cannot be undone.')) {
      remove();
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  return (
    <FormSection
      title="Leave Balances"
      description="Current leave balances as reported on your last Leave & Earnings Statement."
      onSave={handleSave}
      onClear={handleClear}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="As-Of Date" htmlFor="leaveAsOf" error={errors.asOf}>
          <input
            id="leaveAsOf"
            type="date"
            value={form.asOf}
            onChange={(e) => set('asOf', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>

        <FieldGroup label="Annual Leave (hours)" htmlFor="annualLeave" error={errors.annualLeaveHours}>
          <input
            id="annualLeave"
            type="number"
            min="0"
            step="1"
            value={form.annualLeaveHours}
            onChange={(e) => set('annualLeaveHours', Number(e.target.value))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>

        <FieldGroup label="Sick Leave (hours)" htmlFor="sickLeave" error={errors.sickLeaveHours}>
          <input
            id="sickLeave"
            type="number"
            min="0"
            step="1"
            value={form.sickLeaveHours}
            onChange={(e) => set('sickLeaveHours', Number(e.target.value))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>

        <FieldGroup label="Family Care Used This Year (hours)" htmlFor="familyCare" error={errors.familyCareUsedCurrentYear}>
          <input
            id="familyCare"
            type="number"
            min="0"
            step="1"
            value={form.familyCareUsedCurrentYear}
            onChange={(e) => set('familyCareUsedCurrentYear', Number(e.target.value))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>
      </div>
    </FormSection>
  );
}
