import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, PersonalInfoSchema } from '@storage/index';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import type { z } from 'zod';

type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

const DEFAULTS: PersonalInfo = {
  birthDate: '',
  scdLeave: '',
  scdRetirement: '',
  paySystem: 'GS',
};

export function PersonalInfoForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [form, setForm] = useState<PersonalInfo>(stored ?? DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof PersonalInfo>(key: K, value: PersonalInfo[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const result = PersonalInfoSchema.safeParse(form);
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
    if (window.confirm('Clear all personal info? This cannot be undone.')) {
      remove();
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  return (
    <FormSection
      title="Personal Information"
      description="Basic information used to determine retirement eligibility and annuity calculations."
      onSave={handleSave}
      onClear={handleClear}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Date of Birth" htmlFor="birthDate" error={errors.birthDate}>
          <Input
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
          />
        </FieldGroup>

        <FieldGroup label="SCD — Leave" htmlFor="scdLeave" error={errors.scdLeave} hint="Service Computation Date for leave accrual">
          <Input
            id="scdLeave"
            type="date"
            value={form.scdLeave}
            onChange={(e) => set('scdLeave', e.target.value)}
          />
        </FieldGroup>

        <FieldGroup label="SCD — Retirement" htmlFor="scdRetirement" error={errors.scdRetirement} hint="Service Computation Date for retirement">
          <Input
            id="scdRetirement"
            type="date"
            value={form.scdRetirement}
            onChange={(e) => set('scdRetirement', e.target.value)}
          />
        </FieldGroup>

        <FieldGroup label="Pay System" htmlFor="paySystem" error={errors.paySystem}>
          <Select value={form.paySystem} onValueChange={(v) => set('paySystem', v as PersonalInfo['paySystem'])}>
            <SelectTrigger id="paySystem" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GS">GS — General Schedule</SelectItem>
              <SelectItem value="LEO">LEO — Law Enforcement Officer</SelectItem>
              <SelectItem value="Title38">Title 38 — VA Health</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>
      </div>
    </FormSection>
  );
}
