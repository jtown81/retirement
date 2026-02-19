import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, FERSEstimateSchema } from '@storage/index';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';
import defaultInputs from '@data/default-inputs.json';

type FERSEstimate = z.infer<typeof FERSEstimateSchema>;

interface AnnuitySocialFormState {
  annuityReductionPct: string;
  ssaBenefitAt62: string;
  annualEarnings: string;
}

const DEFAULTS: AnnuitySocialFormState = {
  annuityReductionPct: '0',
  ssaBenefitAt62: '',
  annualEarnings: '',
};

function formStateFromStored(fers: FERSEstimate | null): AnnuitySocialFormState {
  return {
    annuityReductionPct: fers ? String(fers.annuityReductionPct * 100) : '0',
    ssaBenefitAt62: fers?.ssaBenefitAt62 != null ? String(fers.ssaBenefitAt62) : '',
    annualEarnings: fers?.annualEarnings != null ? String(fers.annualEarnings) : '',
  };
}

function loadFromDefaults(): AnnuitySocialFormState {
  return { ...DEFAULTS, ...(defaultInputs as Partial<AnnuitySocialFormState>) };
}

export function AnnuitySocialSubForm() {
  const [storedFERS, saveFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [form, setForm] = useState<AnnuitySocialFormState>(() => {
    const hasStoredData = storedFERS !== null;
    if (hasStoredData) return formStateFromStored(storedFERS);
    return loadFromDefaults();
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const set = (key: keyof AnnuitySocialFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const num = (s: string) => (s === '' ? 0 : Number(s));
    const optNum = (s: string) => (s === '' ? undefined : Number(s));

    const newErrors: Record<string, string> = {};

    // Validate numeric fields
    if (isNaN(Number(form.annuityReductionPct)) || Number(form.annuityReductionPct) < 0 || Number(form.annuityReductionPct) > 100) {
      newErrors.annuityReductionPct = 'Must be between 0 and 100';
    }
    if (form.ssaBenefitAt62 !== '' && (isNaN(Number(form.ssaBenefitAt62)) || Number(form.ssaBenefitAt62) < 0)) {
      newErrors.ssaBenefitAt62 = 'Must be a non-negative number';
    }
    if (form.annualEarnings !== '' && (isNaN(Number(form.annualEarnings)) || Number(form.annualEarnings) < 0)) {
      newErrors.annualEarnings = 'Must be a non-negative number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Merge annuity/social fields into FERS_ESTIMATE
    const merged = FERSEstimateSchema.parse({
      retirementAgeOption: storedFERS?.retirementAgeOption ?? 'custom',
      retirementDate: storedFERS?.retirementDate ?? '',
      gsGrade: storedFERS?.gsGrade,
      gsStep: storedFERS?.gsStep,
      localityCode: storedFERS?.localityCode ?? 'RUS',
      annualRaiseRate: storedFERS?.annualRaiseRate ?? 0.02,
      high3Override: storedFERS?.high3Override,
      sickLeaveHours: storedFERS?.sickLeaveHours ?? 0,
      annuityReductionPct: num(form.annuityReductionPct) / 100,
      ssaBenefitAt62: optNum(form.ssaBenefitAt62),
      annualEarnings: optNum(form.annualEarnings),
      currentTspBalance: storedFERS?.currentTspBalance ?? 0,
      traditionalTspBalance: storedFERS?.traditionalTspBalance,
      rothTspBalance: storedFERS?.rothTspBalance,
      traditionalContribPct: storedFERS?.traditionalContribPct ?? 0.05,
      rothContribPct: storedFERS?.rothContribPct ?? 0,
      catchUpEligible: storedFERS?.catchUpEligible ?? false,
      agencyMatchTrueUp: storedFERS?.agencyMatchTrueUp ?? false,
      tspGrowthRate: storedFERS?.tspGrowthRate ?? 0.07,
      withdrawalRate: storedFERS?.withdrawalRate ?? 0.04,
      withdrawalStartAge: storedFERS?.withdrawalStartAge ?? 62,
      oneTimeWithdrawalAmount: storedFERS?.oneTimeWithdrawalAmount,
      oneTimeWithdrawalAge: storedFERS?.oneTimeWithdrawalAge,
    });
    saveFERS(merged);
  };

  const handleClear = () => {
    if (window.confirm('Clear Annuity & Social Security data?')) {
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  const handleLoadDefaults = () => {
    const defaults = loadFromDefaults();
    setForm(defaults);
    setErrors({});
  };

  return (
    <FormSection
      title="Annuity & Social Security"
      description="Configure annuity reduction options and Social Security estimates."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Survivor Benefit Reduction (%)" htmlFor="fe-reduction" error={errors.annuityReductionPct}
          hint="Typical: 0%, 5%, or 10%">
          <Input
            id="fe-reduction"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.annuityReductionPct}
            onChange={(e) => set('annuityReductionPct', e.target.value)}
          />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="SSA Monthly Benefit at 62 ($)" htmlFor="fe-ssAt62" error={errors.ssaBenefitAt62}
          hint="From your Social Security statement">
          <Input
            id="fe-ssAt62"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 1800"
            value={form.ssaBenefitAt62}
            onChange={(e) => set('ssaBenefitAt62', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Annual Earnings ($)" htmlFor="fe-earnings" error={errors.annualEarnings}
          hint="0 if fully retired (for earnings test)">
          <Input
            id="fe-earnings"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={form.annualEarnings}
            onChange={(e) => set('annualEarnings', e.target.value)}
          />
        </FieldGroup>
      </div>
    </FormSection>
  );
}
