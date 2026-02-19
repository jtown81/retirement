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

interface TSPSimulationFormState {
  tspBalanceAtRetirement: string;
  traditionalPct: string;
  highRiskPct: string;
  highRiskROI: string;
  lowRiskROI: string;
  withdrawalRate: string;
  timeStepYears: string;
  withdrawalStrategy: string;
  customTradPct: string;
  customRothPct: string;
}

const DEFAULTS: TSPSimulationFormState = {
  tspBalanceAtRetirement: '500000',
  traditionalPct: '70',
  highRiskPct: '60',
  highRiskROI: '8',
  lowRiskROI: '3',
  withdrawalRate: '4',
  timeStepYears: '2',
  withdrawalStrategy: 'proportional',
  customTradPct: '50',
  customRothPct: '50',
};

function formStateFromStored(config: SimulationConfig | null): TSPSimulationFormState {
  if (!config) return DEFAULTS;
  return {
    tspBalanceAtRetirement: String(config.tspBalanceAtRetirement ?? 500000),
    traditionalPct: String((config.traditionalPct ?? 0.7) * 100),
    highRiskPct: String((config.highRiskPct ?? 0.6) * 100),
    highRiskROI: String((config.highRiskROI ?? 0.08) * 100),
    lowRiskROI: String((config.lowRiskROI ?? 0.03) * 100),
    withdrawalRate: String((config.withdrawalRate ?? 0.04) * 100),
    timeStepYears: String(config.timeStepYears ?? 2),
    withdrawalStrategy: config.withdrawalStrategy || 'proportional',
    customTradPct: String((config.customWithdrawalSplit?.traditionalPct ?? 0.5) * 100),
    customRothPct: String((config.customWithdrawalSplit?.rothPct ?? 0.5) * 100),
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

export function TSPSimulationSubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.SIMULATION_CONFIG, SimulationConfigSchema);
  const [storedPersonal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [storedFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);

  const fersInput = buildFERSEstimateInput(storedPersonal, storedFERS);
  const fersEstimate = useFERSEstimate(fersInput!);

  const [form, setForm] = useState<TSPSimulationFormState>(() => formStateFromStored(storedConfig as SimulationConfig | null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Auto-populate from FERS estimate on mount
      if (fersEstimate && fersEstimate.canCompute) {
        // Derive Traditional % from FERS balances if available
        const trad = storedFERS?.traditionalTspBalance ?? 0;
        const roth = storedFERS?.rothTspBalance ?? 0;
        const total = storedFERS?.currentTspBalance ?? (trad + roth);
        const derivedTradPct = total > 0 ? Math.round((trad / total) * 100) : 70;

        setForm((prev) => ({
          ...prev,
          tspBalanceAtRetirement: String(Math.round(fersEstimate.tspFutureValue)),
          withdrawalRate: String(((storedFERS?.withdrawalRate ?? 0.04) * 100).toFixed(1)),
          traditionalPct: String(derivedTradPct),
        }));
      }
    }
  }, [fersEstimate, storedFERS]);

  const set = (key: keyof TSPSimulationFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const n = (s: string) => (s === '' ? 0 : Number(s));
    const strategy = (form.withdrawalStrategy || 'proportional') as 'proportional' | 'traditional-first' | 'roth-first' | 'custom' | 'tax-bracket-fill';
    const customTrad = n(form.customTradPct) / 100;
    const customRoth = n(form.customRothPct) / 100;

    const saved = storedConfig ?? {};
    const merged: Partial<SimulationConfig> = {
      ...SIM_CONFIG_DEFAULTS,
      ...saved,
      tspBalanceAtRetirement: n(form.tspBalanceAtRetirement),
      traditionalPct: n(form.traditionalPct) / 100,
      highRiskPct: n(form.highRiskPct) / 100,
      highRiskROI: n(form.highRiskROI) / 100,
      lowRiskROI: n(form.lowRiskROI) / 100,
      withdrawalRate: n(form.withdrawalRate) / 100,
      timeStepYears: Math.round(n(form.timeStepYears)) as 1 | 2 | 3,
      withdrawalStrategy: strategy,
    };

    if (strategy === 'custom') {
      merged.customWithdrawalSplit = { traditionalPct: customTrad, rothPct: customRoth };
    }

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
    if (window.confirm('Clear TSP configuration? This cannot be undone.')) {
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  const handleLoadDefaults = () => {
    setForm(DEFAULTS);
  };

  return (
    <FormSection
      title="TSP — Balances & Allocation"
      description="Initial TSP balance, asset allocation, and withdrawal strategy."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="TSP Balance at Retirement ($)" htmlFor="tsp-balance" error={errors.tspBalanceAtRetirement}>
          <Input
            id="tsp-balance"
            type="number"
            min="0"
            step="1000"
            value={form.tspBalanceAtRetirement}
            onChange={(e) => set('tspBalanceAtRetirement', e.target.value)}
          />
          {fersEstimate?.canCompute && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-filled from FERS Estimate: ${Math.round(fersEstimate.tspFutureValue).toLocaleString()}
            </p>
          )}
        </FieldGroup>
        <FieldGroup label="Traditional %" htmlFor="tsp-tradPct" error={errors.traditionalPct}
          hint="Remainder is Roth">
          <Input
            id="tsp-tradPct"
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.traditionalPct}
            onChange={(e) => set('traditionalPct', e.target.value)}
          />
        </FieldGroup>
        {/* Derived balance display */}
        <div className="p-3 bg-muted rounded border border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Projected at Retirement</div>
          {(() => {
            const total = Number(form.tspBalanceAtRetirement) || 0;
            const tradPct = Number(form.traditionalPct) || 0;
            const tradBal = Math.round(total * tradPct / 100);
            const rothBal = Math.round(total - tradBal);
            return (
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Traditional:</span>{' '}
                  <span className="font-semibold">${tradBal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Roth:</span>{' '}
                  <span className="font-semibold">${rothBal.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}
        </div>
        <FieldGroup label="High-Risk %" htmlFor="tsp-hrPct" error={errors.highRiskPct}
          hint="C/S/I funds; remainder in G/F">
          <Input
            id="tsp-hrPct"
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.highRiskPct}
            onChange={(e) => set('highRiskPct', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="High-Risk ROI (%)" htmlFor="tsp-hrROI" error={errors.highRiskROI}>
          <Input
            id="tsp-hrROI"
            type="number"
            min="-50"
            max="50"
            step="0.5"
            value={form.highRiskROI}
            onChange={(e) => set('highRiskROI', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Low-Risk ROI (%)" htmlFor="tsp-lrROI" error={errors.lowRiskROI}>
          <Input
            id="tsp-lrROI"
            type="number"
            min="-50"
            max="50"
            step="0.5"
            value={form.lowRiskROI}
            onChange={(e) => set('lowRiskROI', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Withdrawal Rate (%)" htmlFor="tsp-wr" error={errors.withdrawalRate}
          hint="% of initial balance per year">
          <Input
            id="tsp-wr"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={form.withdrawalRate}
            onChange={(e) => set('withdrawalRate', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Time-Step Buffer (years)" htmlFor="tsp-ts" error={errors.timeStepYears}
          hint="Low-risk pot holds this many years of withdrawals">
          <Select value={form.timeStepYears} onValueChange={(value) => set('timeStepYears', value)}>
            <SelectTrigger id="tsp-ts">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 year</SelectItem>
              <SelectItem value="2">2 years</SelectItem>
              <SelectItem value="3">3 years</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>
      </div>

      {/* Withdrawal Strategy */}
      <div className="mt-4 pt-4 border-t border-border">
        <FieldGroup label="Withdrawal Strategy" htmlFor="tsp-strategy" error={errors.withdrawalStrategy}
          hint="How to split TSP withdrawals between Traditional and Roth">
          <Select value={form.withdrawalStrategy} onValueChange={(value) => set('withdrawalStrategy', value)}>
            <SelectTrigger id="tsp-strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proportional">Proportional (by balance ratio)</SelectItem>
              <SelectItem value="traditional-first">Traditional First</SelectItem>
              <SelectItem value="roth-first">Roth First</SelectItem>
              <SelectItem value="tax-bracket-fill">Tax-Bracket Fill (Roth-last)</SelectItem>
              <SelectItem value="custom">Custom %</SelectItem>
            </SelectContent>
          </Select>
        </FieldGroup>

        {form.withdrawalStrategy === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-3 bg-muted rounded">
            <FieldGroup label="Traditional %" htmlFor="tsp-customTrad" error={errors.customTradPct}>
              <Input
                id="tsp-customTrad"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.customTradPct}
                onChange={(e) => set('customTradPct', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Roth %" htmlFor="tsp-customRoth" error={errors.customRothPct}>
              <Input
                id="tsp-customRoth"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.customRothPct}
                onChange={(e) => set('customRothPct', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Note: Traditional + Roth must equal 100%
              </p>
            </FieldGroup>
          </div>
        )}
      </div>
    </FormSection>
  );
}
