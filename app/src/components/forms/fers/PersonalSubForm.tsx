import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, PersonalInfoSchema, FERSEstimateSchema } from '@storage/index';
import { getMRA } from '@fedplan/simulation';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import defaultInputs from '@data/default-inputs.json';

type RetirementAgeOption = 'MRA' | '60' | '62' | 'custom';

type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
type FERSEstimate = z.infer<typeof FERSEstimateSchema>;

interface PersonalFormState {
  birthDate: string;
  scdRetirement: string;
  scdLeave: string;
  paySystem: 'GS' | 'LEO' | 'Title38';
  retirementAgeOption: RetirementAgeOption;
  retirementDate: string;
}

const DEFAULTS: PersonalFormState = {
  birthDate: '',
  scdLeave: '',
  scdRetirement: '',
  paySystem: 'GS',
  retirementAgeOption: 'custom',
  retirementDate: '',
};

function computeRetirementDate(birthDate: string, option: RetirementAgeOption): string {
  if (!birthDate || option === 'custom') return '';
  const d = new Date(birthDate + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const birthYear = d.getFullYear();
  if (option === 'MRA') {
    const mra = getMRA(birthYear);
    d.setFullYear(d.getFullYear() + mra.years);
    d.setMonth(d.getMonth() + mra.months);
  } else {
    d.setFullYear(d.getFullYear() + Number(option));
  }
  return d.toISOString().slice(0, 10);
}

function formStateFromStored(personal: PersonalInfo | null, fers: FERSEstimate | null): PersonalFormState {
  return {
    birthDate: personal?.birthDate ?? '',
    scdLeave: personal?.scdLeave ?? '',
    scdRetirement: personal?.scdRetirement ?? '',
    paySystem: personal?.paySystem ?? 'GS',
    retirementAgeOption: (fers?.retirementAgeOption as RetirementAgeOption) ?? 'custom',
    retirementDate: fers?.retirementDate ?? '',
  };
}

function loadFromDefaults(): PersonalFormState {
  const d = { ...DEFAULTS, ...(defaultInputs as Partial<PersonalFormState>) };
  // Compute retirement date if age option + birthDate are set
  if (d.retirementAgeOption !== 'custom' && d.birthDate) {
    d.retirementDate = computeRetirementDate(d.birthDate, d.retirementAgeOption);
  }
  // Sync scdLeave to scdRetirement if not set
  if (d.scdRetirement && !d.scdLeave) {
    d.scdLeave = d.scdRetirement;
  }
  return d;
}

export function PersonalSubForm() {
  const [storedPersonal, savePersonal, removePersonal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [storedFERS, saveFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [form, setForm] = useState<PersonalFormState>(() => {
    const hasStoredData = storedPersonal !== null || storedFERS !== null;
    if (hasStoredData) return formStateFromStored(storedPersonal, storedFERS);
    return loadFromDefaults();
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  // Prevent unnecessary form state updates on mount
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const set = (key: keyof PersonalFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleBirthDateChange = useCallback((value: string) => {
    setForm((prev) => {
      const next = { ...prev, birthDate: value };
      if (prev.retirementAgeOption !== 'custom' && value) {
        next.retirementDate = computeRetirementDate(value, prev.retirementAgeOption);
      }
      return next;
    });
  }, []);

  const handleRetirementAgeChange = useCallback((option: string) => {
    setForm((prev) => {
      const next = { ...prev, retirementAgeOption: option as RetirementAgeOption };
      if (option !== 'custom' && prev.birthDate) {
        next.retirementDate = computeRetirementDate(prev.birthDate, option as RetirementAgeOption);
      }
      return next;
    });
  }, []);

  const handleScdRetirementChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      scdRetirement: value,
      scdLeave: value,
    }));
  }, []);

  const handleSave = () => {
    const personalData: PersonalInfo = {
      birthDate: form.birthDate,
      scdLeave: form.scdLeave,
      scdRetirement: form.scdRetirement,
      paySystem: form.paySystem,
    };

    const pResult = PersonalInfoSchema.safeParse(personalData);
    const newErrors: Record<string, string> = {};

    if (!pResult.success) {
      const flat = pResult.error.flatten().fieldErrors;
      for (const [k, v] of Object.entries(flat)) {
        if (v?.[0]) newErrors[k] = v[0];
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    savePersonal(pResult.data!);

    // Merge retirement date and age option into FERS_ESTIMATE
    const merged = FERSEstimateSchema.parse({
      retirementAgeOption: form.retirementAgeOption,
      retirementDate: form.retirementDate,
      gsGrade: storedFERS?.gsGrade,
      gsStep: storedFERS?.gsStep,
      localityCode: storedFERS?.localityCode ?? 'RUS',
      annualRaiseRate: storedFERS?.annualRaiseRate ?? 0.02,
      high3Override: storedFERS?.high3Override,
      sickLeaveHours: storedFERS?.sickLeaveHours ?? 0,
      annuityReductionPct: storedFERS?.annuityReductionPct ?? 0,
      ssaBenefitAt62: storedFERS?.ssaBenefitAt62,
      annualEarnings: storedFERS?.annualEarnings,
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
    if (window.confirm('Clear Personal & Service data?')) {
      removePersonal();
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
      title="Personal & Service"
      description="Enter your birth date, service dates, and retirement preferences."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Date of Birth" htmlFor="fe-birthDate" error={errors.birthDate}>
          <Input
            id="fe-birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => handleBirthDateChange(e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="SCD — Retirement" htmlFor="fe-scdRetirement" error={errors.scdRetirement}
          hint="Service Computation Date for retirement">
          <Input
            id="fe-scdRetirement"
            type="date"
            value={form.scdRetirement}
            onChange={(e) => handleScdRetirementChange(e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="SCD — Leave" htmlFor="fe-scdLeave" error={errors.scdLeave}
          hint="Defaults to SCD Retirement">
          <Input
            id="fe-scdLeave"
            type="date"
            value={form.scdLeave}
            onChange={(e) => set('scdLeave', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Pay System" htmlFor="fe-paySystem" error={errors.paySystem}>
          <Select value={form.paySystem} onValueChange={(value) => set('paySystem', value as any)}>
            <SelectTrigger id="fe-paySystem">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GS">GS — General Schedule</SelectItem>
              <SelectItem value="LEO">LEO — Law Enforcement Officer</SelectItem>
              <SelectItem value="Title38">Title 38 — VA Health</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="Retire At" htmlFor="fe-retireAge" error={errors.retirementAgeOption}
          hint="Select age or choose custom date">
          <Select value={form.retirementAgeOption} onValueChange={(value) => handleRetirementAgeChange(value)}>
            <SelectTrigger id="fe-retireAge">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MRA">MRA (Minimum Retirement Age)</SelectItem>
              <SelectItem value="60">Age 60</SelectItem>
              <SelectItem value="62">Age 62</SelectItem>
              <SelectItem value="custom">Custom date</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="Planned Retirement Date" htmlFor="fe-retirementDate" error={errors.retirementDate}
          hint={form.retirementAgeOption !== 'custom' ? 'Computed from DOB + age' : undefined}>
          <Input
            id="fe-retirementDate"
            type="date"
            value={form.retirementDate}
            onChange={(e) => set('retirementDate', e.target.value)}
            disabled={form.retirementAgeOption !== 'custom'}
          />
        </FieldGroup>
      </div>
    </FormSection>
  );
}
