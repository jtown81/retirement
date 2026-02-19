import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, FERSEstimateSchema, LeaveBalanceSchema, CareerProfileSchema } from '@storage/index';
import { getAvailableLocalityCodes } from '@data/locality-rates';
import { buildSalaryHistory, computeHigh3Salary } from '@modules/career';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import defaultInputs from '@data/default-inputs.json';

type FERSEstimate = z.infer<typeof FERSEstimateSchema>;
type LeaveBalance = z.infer<typeof LeaveBalanceSchema>;

interface SalaryFormState {
  gsGrade: string;
  gsStep: string;
  localityCode: string;
  annualRaiseRate: string;
  high3Override: string;
  sickLeaveHours: string;
  averageAnnualSickLeaveUsage: string;
  computedHigh3?: number;
  high3Source?: 'computed' | 'override';
}

const LOCALITY_CODES = getAvailableLocalityCodes(new Date().getFullYear());
const GS_GRADES = Array.from({ length: 15 }, (_, i) => i + 1);
const GS_STEPS = Array.from({ length: 10 }, (_, i) => i + 1);

const DEFAULTS: SalaryFormState = {
  gsGrade: '',
  gsStep: '',
  localityCode: 'RUS',
  annualRaiseRate: '2',
  high3Override: '',
  sickLeaveHours: '0',
  averageAnnualSickLeaveUsage: '0',
};

function formStateFromStored(fers: FERSEstimate | null, leaveBalance: LeaveBalance | null = null): SalaryFormState {
  return {
    gsGrade: fers?.gsGrade != null ? String(fers.gsGrade) : '',
    gsStep: fers?.gsStep != null ? String(fers.gsStep) : '',
    localityCode: fers?.localityCode ?? 'RUS',
    annualRaiseRate: fers?.annualRaiseRate != null ? String(fers.annualRaiseRate * 100) : '2',
    high3Override: fers?.high3Override != null ? String(fers.high3Override) : '',
    sickLeaveHours: fers ? String(fers.sickLeaveHours) : '0',
    averageAnnualSickLeaveUsage: leaveBalance?.averageAnnualSickLeaveUsage != null ? String(leaveBalance.averageAnnualSickLeaveUsage) : '0',
  };
}

function loadFromDefaults(): SalaryFormState {
  return { ...DEFAULTS, ...(defaultInputs as Partial<SalaryFormState>) };
}

export function SalarySubForm() {
  const [storedFERS, saveFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [storedLeaveBalance, saveLeaveBalance] = useLocalStorage(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
  const [storedCareer] = useLocalStorage(STORAGE_KEYS.CAREER_PROFILE, CareerProfileSchema);
  const [form, setForm] = useState<SalaryFormState>(() => {
    const hasStoredData = storedFERS !== null;
    if (hasStoredData) return formStateFromStored(storedFERS, storedLeaveBalance);
    return loadFromDefaults();
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Auto-compute High-3 from career events if available and no manual override
      if (storedCareer && storedCareer.events && storedCareer.events.length > 0 && !form.high3Override) {
        try {
          const history = buildSalaryHistory(storedCareer as any, new Date().getFullYear());
          if (history.length > 0) {
            const computed = computeHigh3Salary(history);
            setForm((prev) => ({
              ...prev,
              computedHigh3: computed,
              high3Source: 'computed',
            }));
          }
        } catch {
          // Silently fail if career data invalid; user can enter manual override
        }
      }
    }
  }, [storedCareer, form.high3Override]);

  const set = (key: keyof SalaryFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const num = (s: string) => (s === '' ? 0 : Number(s));
    const optNum = (s: string) => (s === '' ? undefined : Number(s));

    const newErrors: Record<string, string> = {};

    // Validate numeric fields
    if (form.annualRaiseRate !== '' && (isNaN(Number(form.annualRaiseRate)) || Number(form.annualRaiseRate) < 0)) {
      newErrors.annualRaiseRate = 'Must be a non-negative number';
    }
    if (form.high3Override !== '' && (isNaN(Number(form.high3Override)) || Number(form.high3Override) < 0)) {
      newErrors.high3Override = 'Must be a non-negative number';
    }
    if (isNaN(Number(form.sickLeaveHours)) || Number(form.sickLeaveHours) < 0) {
      newErrors.sickLeaveHours = 'Must be a non-negative number';
    }
    if (isNaN(Number(form.averageAnnualSickLeaveUsage)) || Number(form.averageAnnualSickLeaveUsage) < 0) {
      newErrors.averageAnnualSickLeaveUsage = 'Must be a non-negative number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Merge salary fields into FERS_ESTIMATE
    const merged = FERSEstimateSchema.parse({
      retirementAgeOption: storedFERS?.retirementAgeOption ?? 'custom',
      retirementDate: storedFERS?.retirementDate ?? '',
      gsGrade: optNum(form.gsGrade),
      gsStep: optNum(form.gsStep),
      localityCode: form.localityCode || 'RUS',
      annualRaiseRate: num(form.annualRaiseRate) / 100,
      high3Override: optNum(form.high3Override),
      sickLeaveHours: num(form.sickLeaveHours),
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

    // Save leave balance with averageAnnualSickLeaveUsage
    const leaveBalance = storedLeaveBalance ?? {
      asOf: new Date().toISOString().slice(0, 10),
      annualLeaveHours: 0,
      sickLeaveHours: num(form.sickLeaveHours),
      familyCareUsedCurrentYear: 0,
    };
    saveLeaveBalance({
      ...leaveBalance,
      sickLeaveHours: num(form.sickLeaveHours),
      averageAnnualSickLeaveUsage: num(form.averageAnnualSickLeaveUsage),
    });
  };

  const handleClear = () => {
    if (window.confirm('Clear Salary data?')) {
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
      title="Salary"
      description="Enter your grade, step, locality, and salary projection details."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="GS Grade" htmlFor="fe-gsGrade" error={errors.gsGrade}>
          <Select value={form.gsGrade} onValueChange={(value) => set('gsGrade', value)}>
            <SelectTrigger id="fe-gsGrade">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {GS_GRADES.map((g) => (
                <SelectItem key={g} value={String(g)}>GS-{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="GS Step" htmlFor="fe-gsStep" error={errors.gsStep}>
          <Select value={form.gsStep} onValueChange={(value) => set('gsStep', value)}>
            <SelectTrigger id="fe-gsStep">
              <SelectValue placeholder="Select step" />
            </SelectTrigger>
            <SelectContent>
              {GS_STEPS.map((s) => (
                <SelectItem key={s} value={String(s)}>Step {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>
        <FieldGroup label="Locality Area" htmlFor="fe-locality" error={errors.localityCode}>
          <Select value={form.localityCode} onValueChange={(value) => set('localityCode', value)}>
            <SelectTrigger id="fe-locality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALITY_CODES.map((code) => (
                <SelectItem key={code} value={code}>{code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="Annual Raise (%)" htmlFor="fe-raiseRate" error={errors.annualRaiseRate}
          hint="0 = no raises assumed">
          <Input
            id="fe-raiseRate"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={form.annualRaiseRate}
            onChange={(e) => set('annualRaiseRate', e.target.value)}
          />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup
          label="High-3 Override ($)"
          htmlFor="fe-high3"
          error={errors.high3Override}
          hint={
            form.computedHigh3 && !form.high3Override
              ? `Computed from career: $${form.computedHigh3.toLocaleString()}`
              : 'Leave blank to use career events'
          }
        >
          <div className="space-y-2">
            <Input
              id="fe-high3"
              type="number"
              min="0"
              step="1"
              placeholder={form.computedHigh3 ? `$${form.computedHigh3.toLocaleString()}` : 'Auto from career'}
              value={form.high3Override}
              onChange={(e) => set('high3Override', e.target.value)}
            />
            {form.computedHigh3 && !form.high3Override && storedCareer?.events && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Based on {buildSalaryHistory(storedCareer as any, new Date().getFullYear()).length} years of salary history
              </p>
            )}
          </div>
        </FieldGroup>
        <FieldGroup label="Sick Leave Hours" htmlFor="fe-sickHours" error={errors.sickLeaveHours}>
          <Input
            id="fe-sickHours"
            type="number"
            min="0"
            step="1"
            value={form.sickLeaveHours}
            onChange={(e) => set('sickLeaveHours', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup
          label="Average Annual Sick Leave Used (hrs)"
          htmlFor="fe-avgSickUsage"
          error={errors.averageAnnualSickLeaveUsage}
          hint="e.g., 40 hours/year for projection modeling"
        >
          <Input
            id="fe-avgSickUsage"
            type="number"
            min="0"
            step="1"
            value={form.averageAnnualSickLeaveUsage}
            onChange={(e) => set('averageAnnualSickLeaveUsage', e.target.value)}
          />
        </FieldGroup>
      </div>
    </FormSection>
  );
}
