import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, RetirementAssumptionsFullSchema } from '@storage/index';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { Input } from '@components/ui/input';
import type { z } from 'zod';

type AssumptionsFull = z.infer<typeof RetirementAssumptionsFullSchema>;

const DEFAULTS: AssumptionsFull = {
  proposedRetirementDate: '',
  tspGrowthRate: 0.07,
  colaRate: 0.02,
  retirementHorizonYears: 30,
  tspWithdrawalRate: 0.04,
  estimatedSSMonthlyAt62: undefined,
};

export function AssumptionsForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.ASSUMPTIONS, RetirementAssumptionsFullSchema);
  const [form, setForm] = useState<AssumptionsFull>(stored ?? DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof AssumptionsFull>(key: K, value: AssumptionsFull[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const result = RetirementAssumptionsFullSchema.safeParse(form);
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
    if (window.confirm('Clear assumptions? This cannot be undone.')) {
      remove();
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  return (
    <FormSection
      title="Retirement Assumptions"
      description="Key assumptions that drive the retirement projection. Adjust these to explore different scenarios."
      onSave={handleSave}
      onClear={handleClear}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Proposed Retirement Date" htmlFor="retireDate" error={errors.proposedRetirementDate}>
          <Input
            id="retireDate"
            type="date"
            value={form.proposedRetirementDate}
            onChange={(e) => set('proposedRetirementDate', e.target.value)}
          />
        </FieldGroup>

        <FieldGroup label="TSP Growth Rate (%)" htmlFor="tspGrowth" error={errors.tspGrowthRate} hint="e.g. 7 for 7%">
          <Input
            id="tspGrowth"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={(form.tspGrowthRate * 100).toFixed(1)}
            onChange={(e) => set('tspGrowthRate', Number(e.target.value) / 100)}
          />
        </FieldGroup>

        <FieldGroup label="COLA Rate (%)" htmlFor="cola" error={errors.colaRate} hint="Annual cost-of-living adjustment">
          <Input
            id="cola"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={(form.colaRate * 100).toFixed(1)}
            onChange={(e) => set('colaRate', Number(e.target.value) / 100)}
          />
        </FieldGroup>

        <FieldGroup label="Retirement Horizon (years)" htmlFor="horizon" error={errors.retirementHorizonYears}>
          <Input
            id="horizon"
            type="number"
            min="1"
            max="60"
            step="1"
            value={form.retirementHorizonYears}
            onChange={(e) => set('retirementHorizonYears', Number(e.target.value))}
          />
        </FieldGroup>

        <FieldGroup label="TSP Withdrawal Rate (%, optional)" htmlFor="withdrawal" error={errors.tspWithdrawalRate} hint="4% rule is the default">
          <Input
            id="withdrawal"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={form.tspWithdrawalRate != null ? (form.tspWithdrawalRate * 100).toFixed(1) : ''}
            onChange={(e) => set('tspWithdrawalRate', e.target.value ? Number(e.target.value) / 100 : undefined)}
          />
        </FieldGroup>

        <FieldGroup label="Estimated SS Monthly at 62 ($, optional)" htmlFor="ssEstimate" error={errors.estimatedSSMonthlyAt62} hint="From your Social Security statement">
          <Input
            id="ssEstimate"
            type="number"
            min="0"
            step="50"
            value={form.estimatedSSMonthlyAt62 ?? ''}
            onChange={(e) => set('estimatedSSMonthlyAt62', e.target.value ? Number(e.target.value) : undefined)}
          />
        </FieldGroup>
      </div>
    </FormSection>
  );
}
