import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  SimulationConfigSchema,
  PersonalInfoSchema,
  FERSEstimateSchema,
} from '@storage/index';
import { useFERSEstimate, type FERSEstimateInput } from '../useFERSEstimate';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
type FERSEstimate = z.infer<typeof FERSEstimateSchema>;

interface CoreParametersFormState {
  retirementAge: string;
  endAge: string;
  birthYear: string;
  ssClaimingAge: string;
  fersAnnuity: string;
  fersSupplement: string;
  ssMonthlyAt62: string;
}

const DEFAULTS: CoreParametersFormState = {
  retirementAge: '62',
  endAge: '95',
  birthYear: '1962',
  ssClaimingAge: '62',
  fersAnnuity: '30000',
  fersSupplement: '0',
  ssMonthlyAt62: '1800',
};

function formStateFromStored(config: SimulationConfig | null): CoreParametersFormState {
  if (!config) return DEFAULTS;
  return {
    retirementAge: String(config.retirementAge ?? 62),
    endAge: String(config.endAge ?? 95),
    birthYear: String(config.birthYear ?? 1962),
    ssClaimingAge: String(config.ssClaimingAge ?? 62),
    fersAnnuity: String(config.fersAnnuity ?? 30000),
    fersSupplement: String(config.fersSupplement ?? 0),
    ssMonthlyAt62: String(config.ssMonthlyAt62 ?? 1800),
  };
}

function buildFERSEstimateInput(personal: PersonalInfo | null, fers: FERSEstimate | null): FERSEstimateInput | null {
  if (!personal || !fers) return null;
  return {
    birthDate: personal.birthDate,
    scdRetirement: personal.scdRetirement,
    retirementDate: fers.retirementDate,
    gsGrade: fers.gsGrade,
    gsStep: fers.gsStep,
    localityCode: fers.localityCode ?? 'RUS',
    annualRaiseRate: fers.annualRaiseRate,
    high3Override: fers.high3Override,
    sickLeaveHours: fers.sickLeaveHours,
    annuityReductionPct: fers.annuityReductionPct,
    ssaBenefitAt62: fers.ssaBenefitAt62,
    annualEarnings: fers.annualEarnings,
    currentTspBalance: fers.currentTspBalance,
    employeeTotalContribPct: fers.traditionalContribPct + fers.rothContribPct,
    tspGrowthRate: fers.tspGrowthRate,
    withdrawalRate: fers.withdrawalRate,
    withdrawalStartAge: fers.withdrawalStartAge,
    oneTimeWithdrawalAmount: fers.oneTimeWithdrawalAmount,
    oneTimeWithdrawalAge: fers.oneTimeWithdrawalAge,
  };
}

const SIM_CONFIG_DEFAULTS: Partial<SimulationConfig> = {
  retirementAge: 62,
  endAge: 95,
  birthYear: 1962,
  ssClaimingAge: 62,
  fersAnnuity: 30000,
  fersSupplement: 0,
  ssMonthlyAt62: 1800,
  tspBalanceAtRetirement: 500000,
  traditionalPct: 0.70,
  highRiskPct: 0.60,
  highRiskROI: 0.08,
  lowRiskROI: 0.03,
  withdrawalRate: 0.04,
  timeStepYears: 2,
  withdrawalStrategy: 'proportional',
  baseAnnualExpenses: 60000,
  goGoEndAge: 72,
  goGoRate: 1.0,
  goSlowEndAge: 82,
  goSlowRate: 0.85,
  noGoRate: 0.75,
  colaRate: 0.02,
  inflationRate: 0.025,
  healthcareInflationRate: 0.055,
  healthcareAnnualExpenses: 8000,
  proposedRetirementDate: new Date().toISOString().slice(0, 10),
  tspGrowthRate: 0.07,
};

export function CoreParametersSubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.SIMULATION_CONFIG, SimulationConfigSchema);
  const [storedPersonal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [storedFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);

  const fersInput = buildFERSEstimateInput(storedPersonal, storedFERS);
  const fersEstimate = useFERSEstimate(fersInput!);

  const [form, setForm] = useState<CoreParametersFormState>(() => formStateFromStored(storedConfig as SimulationConfig | null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Auto-populate from FERS estimate on mount
      if (fersEstimate && fersEstimate.canCompute) {
        setForm((prev) => ({
          ...prev,
          retirementAge: String(Math.round(fersEstimate.ageAtRetirement)),
          fersAnnuity: String(Math.round(fersEstimate.netAnnuity)),
          fersSupplement: String(Math.round(fersEstimate.supplementAnnual)),
          ssMonthlyAt62: String(storedFERS?.ssaBenefitAt62 ?? 1800),
        }));
      }
      // Auto-populate birthYear from personal data
      if (storedPersonal?.birthDate) {
        setForm((prev) => ({
          ...prev,
          birthYear: String(new Date(storedPersonal.birthDate).getFullYear()),
        }));
      }
    }
  }, [fersEstimate, storedPersonal, storedFERS]);

  const set = (key: keyof CoreParametersFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const n = (s: string) => (s === '' ? 0 : Number(s));
    const ssClaimingAge = (Number(form.ssClaimingAge) as 62 | 67 | 70) || 62;

    // Derive proposedRetirementDate from FERS estimate or birth date + retirement age
    let proposedRetirementDate: string | null = storedFERS?.retirementDate ?? null;
    if (!proposedRetirementDate && storedPersonal?.birthDate) {
      const birth = new Date(storedPersonal.birthDate);
      const retYear = birth.getFullYear() + Number(form.retirementAge);
      proposedRetirementDate = `${retYear}-${String(birth.getMonth() + 1).padStart(2, '0')}-${String(birth.getDate()).padStart(2, '0')}`;
    }
    if (!proposedRetirementDate) {
      const now = new Date();
      proposedRetirementDate = `${now.getFullYear() + Number(form.retirementAge) - 62}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    // Compute tspGrowthRate from FERS estimate or derive from TSP allocation
    const tspGrowthRate = storedFERS?.tspGrowthRate ?? 0.07;

    const saved = storedConfig ?? {};
    const merged = {
      ...SIM_CONFIG_DEFAULTS,
      ...saved,
      retirementAge: Math.round(n(form.retirementAge)),
      endAge: Math.round(n(form.endAge)),
      birthYear: n(form.birthYear) > 0 ? Math.round(n(form.birthYear)) : 1962,
      ssClaimingAge,
      fersAnnuity: n(form.fersAnnuity),
      fersSupplement: n(form.fersSupplement),
      ssMonthlyAt62: n(form.ssMonthlyAt62),
      proposedRetirementDate,
      tspGrowthRate,
      retirementHorizonYears: Math.round(n(form.endAge)) - Math.round(n(form.retirementAge)),
    };

    const result = SimulationConfigSchema.safeParse(merged);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])),
      );
      return;
    }

    setErrors({});
    saveConfig(result.data);
  };

  const handleClear = () => {
    if (window.confirm('Clear core parameters? This cannot be undone.')) {
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  const handleLoadDefaults = () => {
    setForm(DEFAULTS);
  };

  return (
    <FormSection
      title="Core Parameters"
      description="Retirement age, projection horizon, annuity, and Social Security."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="Retirement Age" htmlFor="core-retAge" error={errors.retirementAge}>
          <Input
            id="core-retAge"
            type="number"
            min="50"
            max="90"
            step="1"
            value={form.retirementAge}
            onChange={(e) => set('retirementAge', e.target.value)}
          />
          {fersEstimate?.canCompute && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-filled from FERS Estimate: {Math.round(fersEstimate.ageAtRetirement)}
            </p>
          )}
        </FieldGroup>
        <FieldGroup label="End Age" htmlFor="core-endAge" error={errors.endAge} hint="Projection endpoint (max 104)">
          <Input
            id="core-endAge"
            type="number"
            min="70"
            max="104"
            step="1"
            value={form.endAge}
            onChange={(e) => set('endAge', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Birth Year (Phase D)" htmlFor="core-birthYear" error={errors.birthYear}
          hint="For RMD age calculation (73 vs 75)">
          <Input
            id="core-birthYear"
            type="number"
            min="1900"
            max="2010"
            step="1"
            value={form.birthYear}
            onChange={(e) => set('birthYear', e.target.value)}
          />
          {storedPersonal?.birthDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-filled from birthDate: {new Date(storedPersonal.birthDate).getFullYear()}
            </p>
          )}
        </FieldGroup>
        <FieldGroup label="FERS Annuity ($/yr)" htmlFor="core-annuity" error={errors.fersAnnuity}>
          <Input
            id="core-annuity"
            type="number"
            min="0"
            step="100"
            value={form.fersAnnuity}
            onChange={(e) => set('fersAnnuity', e.target.value)}
          />
          {fersEstimate?.canCompute && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-filled from FERS Estimate: ${Math.round(fersEstimate.netAnnuity).toLocaleString()}
            </p>
          )}
        </FieldGroup>
        <FieldGroup label="FERS Supplement ($/yr)" htmlFor="core-supplement" error={errors.fersSupplement}
          hint="Paid until age 62; 0 if not eligible">
          <Input
            id="core-supplement"
            type="number"
            min="0"
            step="100"
            value={form.fersSupplement}
            onChange={(e) => set('fersSupplement', e.target.value)}
          />
          {fersEstimate?.supplementEligible && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-filled from FERS Estimate: ${Math.round(fersEstimate.supplementAnnual).toLocaleString()}
            </p>
          )}
        </FieldGroup>
        <FieldGroup label="SS Monthly at 62 ($)" htmlFor="core-ss" error={errors.ssMonthlyAt62}>
          <Input
            id="core-ss"
            type="number"
            min="0"
            step="50"
            value={form.ssMonthlyAt62}
            onChange={(e) => set('ssMonthlyAt62', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="SS Claiming Age (Phase D)" htmlFor="core-ssClaimAge" error={errors.ssClaimingAge}
          hint="When to start receiving Social Security">
          <Select value={form.ssClaimingAge} onValueChange={(value) => set('ssClaimingAge', value)}>
            <SelectTrigger id="core-ssClaimAge">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="62">Age 62 (earliest)</SelectItem>
              <SelectItem value="67">Age 67 (full retirement age)</SelectItem>
              <SelectItem value="70">Age 70 (delayed)</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>
      </div>
    </FormSection>
  );
}
