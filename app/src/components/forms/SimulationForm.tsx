import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  SimulationConfigSchema,
  FERSEstimateSchema,
  ExpenseProfileSchema,
  PersonalInfoSchema,
  RetirementAssumptionsFullSchema,
} from '@storage/index';
import { unifiedRetirementSimulation } from '@modules/simulation';
import type { SimulationConfig, FullSimulationResult } from '@models/simulation';
import type { FilingStatus } from '@models/tax';
import { useFERSEstimate, type FERSEstimateInput } from './useFERSEstimate';
import { ScenarioComparison } from './ScenarioComparison';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible';
import { Checkbox } from '@components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Alert, AlertDescription } from '@components/ui/alert';
import { ChevronDown, TrendingUp, Target, DollarSign, Percent, Receipt } from 'lucide-react';
import { cn } from '@lib/utils';
import type { z } from 'zod';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
};

// ── Form state (all strings for controlled inputs) ───────────────────────────

interface FormState {
  retirementAge: string;
  endAge: string;
  fersAnnuity: string;
  fersSupplement: string;
  ssMonthlyAt62: string;
  survivorBenefitOption: string;
  tspBalanceAtRetirement: string;
  traditionalPct: string;
  highRiskPct: string;
  highRiskROI: string;
  lowRiskROI: string;
  withdrawalRate: string;
  timeStepYears: string;
  baseAnnualExpenses: string;
  goGoEndAge: string;
  goGoRate: string;
  goSlowEndAge: string;
  goSlowRate: string;
  noGoRate: string;
  colaRate: string;
  inflationRate: string;
  healthcareInflationRate: string;
  healthcareAnnualExpenses: string;
  fehbPremiumAnnual: string;
  filingStatus: string;
  applyIRMAA: string;
}

const DEFAULTS: FormState = {
  retirementAge: '62',
  endAge: '95',
  fersAnnuity: '30000',
  fersSupplement: '0',
  ssMonthlyAt62: '1800',
  survivorBenefitOption: 'none',
  tspBalanceAtRetirement: '500000',
  traditionalPct: '70',
  highRiskPct: '60',
  highRiskROI: '8',
  lowRiskROI: '3',
  withdrawalRate: '4',
  timeStepYears: '2',
  baseAnnualExpenses: '60000',
  goGoEndAge: '72',
  goGoRate: '100',
  goSlowEndAge: '82',
  goSlowRate: '85',
  noGoRate: '75',
  colaRate: '2',
  inflationRate: '2.5',
  healthcareInflationRate: '5.5',
  healthcareAnnualExpenses: '8000',
  fehbPremiumAnnual: '',
  filingStatus: '',
  applyIRMAA: 'true',
};

const DRAFT_KEY = 'retire:simulation-form-draft';

function loadDraft(): FormState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function saveDraft(form: FormState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch { /* quota exceeded */ }
}

function removeDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}

// ── Convert form → SimulationConfig ──────────────────────────────────────────

function toConfig(
  f: FormState,
  birthYear: number = 1960,
  ssClaimingAge: number = 62,
): SimulationConfig {
  const n = (s: string) => (s === '' ? 0 : Number(s));
  return {
    retirementAge: Math.round(n(f.retirementAge)),
    endAge: Math.round(n(f.endAge)),
    fersAnnuity: n(f.fersAnnuity),
    fersSupplement: n(f.fersSupplement),
    ssMonthlyAt62: n(f.ssMonthlyAt62),
    tspBalanceAtRetirement: n(f.tspBalanceAtRetirement),
    traditionalPct: n(f.traditionalPct) / 100,
    highRiskPct: n(f.highRiskPct) / 100,
    highRiskROI: n(f.highRiskROI) / 100,
    lowRiskROI: n(f.lowRiskROI) / 100,
    withdrawalRate: n(f.withdrawalRate) / 100,
    timeStepYears: Math.round(n(f.timeStepYears)) as 1 | 2 | 3,
    baseAnnualExpenses: n(f.baseAnnualExpenses),
    goGoEndAge: Math.round(n(f.goGoEndAge)),
    goGoRate: n(f.goGoRate) / 100,
    goSlowEndAge: Math.round(n(f.goSlowEndAge)),
    goSlowRate: n(f.goSlowRate) / 100,
    noGoRate: n(f.noGoRate) / 100,
    colaRate: n(f.colaRate) / 100,
    inflationRate: n(f.inflationRate) / 100,
    healthcareInflationRate: n(f.healthcareInflationRate) / 100,
    healthcareAnnualExpenses: n(f.healthcareAnnualExpenses),
    fehbPremiumAnnual: f.fehbPremiumAnnual !== '' ? n(f.fehbPremiumAnnual) : undefined,
    filingStatus: f.filingStatus !== '' ? (f.filingStatus as FilingStatus) : undefined,
    applyIRMAA: f.applyIRMAA === 'true',
    birthYear,
    ssClaimingAge,
    survivorBenefitOption: f.survivorBenefitOption as 'none' | 'partial' | 'full',
  };
}

function configToFormState(config: Partial<SimulationConfig>): FormState {
  return {
    retirementAge: String(config.retirementAge ?? 62),
    endAge: String(config.endAge ?? 95),
    fersAnnuity: String(config.fersAnnuity ?? 30000),
    fersSupplement: String(config.fersSupplement ?? 0),
    ssMonthlyAt62: String(config.ssMonthlyAt62 ?? 1800),
    survivorBenefitOption: config.survivorBenefitOption ?? 'none',
    tspBalanceAtRetirement: String(config.tspBalanceAtRetirement ?? 500000),
    traditionalPct: String((config.traditionalPct ?? 0.7) * 100),
    highRiskPct: String((config.highRiskPct ?? 0.6) * 100),
    highRiskROI: String((config.highRiskROI ?? 0.08) * 100),
    lowRiskROI: String((config.lowRiskROI ?? 0.03) * 100),
    withdrawalRate: String((config.withdrawalRate ?? 0.04) * 100),
    timeStepYears: String(config.timeStepYears ?? 2),
    baseAnnualExpenses: String(config.baseAnnualExpenses ?? 60000),
    goGoEndAge: String(config.goGoEndAge ?? 72),
    goGoRate: String((config.goGoRate ?? 1.0) * 100),
    goSlowEndAge: String(config.goSlowEndAge ?? 82),
    goSlowRate: String((config.goSlowRate ?? 0.85) * 100),
    noGoRate: String((config.noGoRate ?? 0.75) * 100),
    colaRate: String((config.colaRate ?? 0.02) * 100),
    inflationRate: String((config.inflationRate ?? 0.025) * 100),
    healthcareInflationRate: String((config.healthcareInflationRate ?? 0.055) * 100),
    healthcareAnnualExpenses: String(config.healthcareAnnualExpenses ?? 8000),
    fehbPremiumAnnual: String(config.fehbPremiumAnnual ?? ''),
    filingStatus: config.filingStatus ?? '',
    applyIRMAA: String(config.applyIRMAA ?? true),
  };
}

// ── Build initial defaults from FERS Estimate + Expenses ─────────────────────

type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
type FERSEstimate = z.infer<typeof FERSEstimateSchema>;
type ExpenseProfile = z.infer<typeof ExpenseProfileSchema>;

interface FERSComputedDefaults {
  patch: Partial<FormState>;
  sourceFields: Set<keyof FormState>;
}

function buildFromSavedData(
  personal: PersonalInfo | null,
  fers: FERSEstimate | null,
  expenses: ExpenseProfile | null,
  fersEstimateResult: ReturnType<typeof useFERSEstimate>,
): FERSComputedDefaults {
  const patch: Partial<FormState> = {};
  const sourceFields = new Set<keyof FormState>();

  if (fersEstimateResult && fersEstimateResult.canCompute) {
    patch.retirementAge = String(Math.round(fersEstimateResult.ageAtRetirement));
    sourceFields.add('retirementAge');

    patch.fersAnnuity = String(Math.round(fersEstimateResult.netAnnuity));
    sourceFields.add('fersAnnuity');

    if (fersEstimateResult.supplementEligible) {
      patch.fersSupplement = String(Math.round(fersEstimateResult.supplementAnnual));
      sourceFields.add('fersSupplement');
    }

    patch.tspBalanceAtRetirement = String(Math.round(fersEstimateResult.tspFutureValue));
    sourceFields.add('tspBalanceAtRetirement');
  }

  if (fers) {
    if (fers.ssaBenefitAt62 != null) {
      patch.ssMonthlyAt62 = String(fers.ssaBenefitAt62);
      sourceFields.add('ssMonthlyAt62');
    }
    if (fers.survivorBenefitOption) {
      patch.survivorBenefitOption = fers.survivorBenefitOption;
      sourceFields.add('survivorBenefitOption');
    }
    if (fers.withdrawalRate > 0) {
      patch.withdrawalRate = String(fers.withdrawalRate * 100);
      sourceFields.add('withdrawalRate');
    }
  }

  if (expenses) {
    const total = expenses.categories.reduce((s, c) => s + c.annualAmount, 0);
    if (total > 0) {
      patch.baseAnnualExpenses = String(total);
      sourceFields.add('baseAnnualExpenses');
    }
    if (expenses.inflationRate > 0) {
      patch.inflationRate = String(expenses.inflationRate * 100);
      sourceFields.add('inflationRate');
    }
    if (expenses.healthcareInflationRate != null) {
      patch.healthcareInflationRate = String(expenses.healthcareInflationRate * 100);
      sourceFields.add('healthcareInflationRate');
    }
    const hcCat = expenses.categories.find((c) => c.name === 'healthcare');
    if (hcCat && hcCat.annualAmount > 0) {
      patch.healthcareAnnualExpenses = String(hcCat.annualAmount);
      sourceFields.add('healthcareAnnualExpenses');
    }
  }

  return { patch, sourceFields };
}

// ── Component ────────────────────────────────────────────────────────────────

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
    survivorBenefitOption: fers.survivorBenefitOption ?? 'none',
    ssaBenefitAt62: fers.ssaBenefitAt62,
    annualEarnings: fers.annualEarnings,
    currentTspBalance: fers.currentTspBalance,
    biweeklyTspContribution: fers.biweeklyTspContribution,
    tspGrowthRate: fers.tspGrowthRate,
    withdrawalRate: fers.withdrawalRate,
    withdrawalStartAge: fers.withdrawalStartAge,
    oneTimeWithdrawalAmount: fers.oneTimeWithdrawalAmount,
    oneTimeWithdrawalAge: fers.oneTimeWithdrawalAge,
  };
}

export function SimulationForm() {
  const [storedConfig, saveConfig, removeConfig] = useLocalStorage(
    STORAGE_KEYS.SIMULATION_CONFIG,
    SimulationConfigSchema,
  );
  const [, saveAssumptions] = useLocalStorage(STORAGE_KEYS.ASSUMPTIONS, RetirementAssumptionsFullSchema);
  const [storedPersonal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [storedFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [storedExpenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);

  // Compute FERS estimate from saved data to pre-populate simulation
  const fersInput = useMemo(
    () => buildFERSEstimateInput(storedPersonal, storedFERS),
    [storedPersonal, storedFERS],
  );
  const fersEstimate = useFERSEstimate(fersInput!);

  const fersDefaults = useMemo(
    () => buildFromSavedData(storedPersonal, storedFERS, storedExpenses, fersEstimate),
    [storedPersonal, storedFERS, storedExpenses, fersEstimate],
  );

  const [form, setForm] = useState<FormState>(() => {
    const draft = loadDraft();
    if (draft) return draft;
    if (storedConfig) return configToFormState(storedConfig);
    return { ...DEFAULTS, ...fersDefaults.patch };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: true,
    tsp: true,
    expenses: false,
    rates: false,
    tax: false,
  });
  const isFirstRender = useRef(true);

  // Auto-save draft on change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveDraft(form);
  }, [form]);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Derive age/SS from stored personal info ──────────────────────────────
  const birthYear = storedPersonal?.birthDate
    ? new Date(storedPersonal.birthDate).getFullYear()
    : 1960;
  const ssClaimingAge = 62; // Default to age 62 SS claiming

  // ── Live simulation ──────────────────────────────────────────────────────
  const simulation = useMemo<FullSimulationResult | null>(() => {
    try {
      const config = toConfig(form, birthYear, ssClaimingAge);
      const result = SimulationConfigSchema.safeParse(config);
      if (!result.success) return null;
      return unifiedRetirementSimulation(config);
    } catch {
      return null;
    }
  }, [form, birthYear, ssClaimingAge]);

  // ── Save / Clear ─────────────────────────────────────────────────────────
  const handleSave = () => {
    const config = toConfig(form, birthYear, ssClaimingAge);
    const result = SimulationConfigSchema.safeParse(config);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])),
      );
      return;
    }
    setErrors({});
    saveConfig(result.data);

    if (storedFERS) {
      saveAssumptions({
        proposedRetirementDate: storedFERS.retirementDate,
        tspGrowthRate: storedFERS.tspGrowthRate,
        colaRate: Number(form.colaRate) / 100,
        retirementHorizonYears: Number(form.endAge) - Number(form.retirementAge),
        ...(storedFERS.withdrawalRate != null ? { tspWithdrawalRate: storedFERS.withdrawalRate } : {}),
        ...(storedFERS.ssaBenefitAt62 != null ? { estimatedSSMonthlyAt62: storedFERS.ssaBenefitAt62 } : {}),
      });
    }

    removeDraft();
  };

  const handleClear = () => {
    if (window.confirm('Clear simulation configuration? This cannot be undone.')) {
      removeConfig();
      removeDraft();
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  const handlePullFromEstimate = () => {
    if (Object.keys(fersDefaults.patch).length === 0) {
      alert('No saved FERS Estimate or Expenses data found. Save those tabs first.');
      return;
    }
    setForm((prev) => ({ ...prev, ...fersDefaults.patch }));
  };

  return (
    <FormSection
      title="Retirement Simulation"
      description="Year-by-year post-retirement projection with dual-pot TSP, RMD compliance, and GoGo/GoSlow/NoGo expense phases. Results update live."
      onSave={handleSave}
      onClear={handleClear}
    >
      {/* Pull from other tabs */}
      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={handlePullFromEstimate}
          className="p-0"
        >
          Pull values from FERS Estimate &amp; Expenses
        </Button>
        {fersDefaults.sourceFields.size > 0 && (
          <span className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200 px-2 py-1 rounded">
            {fersDefaults.sourceFields.size} fields available
          </span>
        )}
      </div>

      {/* ── Core Parameters ─────────────────────────────── */}
      <Collapsible
        open={openSections.core}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, core: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.core ? 'rotate-180' : ''}`} />
          <Target className="w-4 h-4" />
          Core Parameters
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="Retirement Age" htmlFor="sim-retAge" error={errors.retirementAge}>
              <Input
                id="sim-retAge"
                type="number"
                min="50"
                max="90"
                step="1"
                value={form.retirementAge}
                onChange={(e) => set('retirementAge', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="End Age" htmlFor="sim-endAge" error={errors.endAge} hint="Projection endpoint (max 104)">
              <Input
                id="sim-endAge"
                type="number"
                min="70"
                max="104"
                step="1"
                value={form.endAge}
                onChange={(e) => set('endAge', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="FERS Annuity ($/yr)" htmlFor="sim-annuity" error={errors.fersAnnuity}>
              <Input
                id="sim-annuity"
                type="number"
                min="0"
                step="100"
                value={form.fersAnnuity}
                onChange={(e) => set('fersAnnuity', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="FERS Supplement ($/yr)" htmlFor="sim-supplement" error={errors.fersSupplement}
              hint="Paid until age 62; 0 if not eligible">
              <Input
                id="sim-supplement"
                type="number"
                min="0"
                step="100"
                value={form.fersSupplement}
                onChange={(e) => set('fersSupplement', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="SS Monthly at 62 ($)" htmlFor="sim-ss" error={errors.ssMonthlyAt62}>
              <Input
                id="sim-ss"
                type="number"
                min="0"
                step="50"
                value={form.ssMonthlyAt62}
                onChange={(e) => set('ssMonthlyAt62', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Survivor Benefit" htmlFor="sim-survivorBenefit" error={errors.survivorBenefitOption}
              hint="Reduces annuity; provides spouse income at death">
              <Select value={form.survivorBenefitOption}
                onValueChange={(v) => set('survivorBenefitOption', v)}>
                <SelectTrigger id="sim-survivorBenefit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (0% reduction)</SelectItem>
                  <SelectItem value="partial">Partial (5% reduction)</SelectItem>
                  <SelectItem value="full">Full (10% reduction)</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ── TSP ──────────────────────────────────────────── */}
      <Collapsible
        open={openSections.tsp}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, tsp: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.tsp ? 'rotate-180' : ''}`} />
          <DollarSign className="w-4 h-4" />
          TSP — Balances &amp; Allocation
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="TSP Balance at Retirement ($)" htmlFor="sim-tspBal" error={errors.tspBalanceAtRetirement}>
              <Input
                id="sim-tspBal"
                type="number"
                min="0"
                step="1000"
                value={form.tspBalanceAtRetirement}
                onChange={(e) => set('tspBalanceAtRetirement', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Traditional %" htmlFor="sim-tradPct" error={errors.traditionalPct}
              hint="Remainder is Roth">
              <Input
                id="sim-tradPct"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.traditionalPct}
                onChange={(e) => set('traditionalPct', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="High-Risk %" htmlFor="sim-hrPct" error={errors.highRiskPct}
              hint="C/S/I funds; remainder in G/F">
              <Input
                id="sim-hrPct"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.highRiskPct}
                onChange={(e) => set('highRiskPct', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="High-Risk ROI (%)" htmlFor="sim-hrROI" error={errors.highRiskROI}>
              <Input
                id="sim-hrROI"
                type="number"
                min="-50"
                max="50"
                step="0.5"
                value={form.highRiskROI}
                onChange={(e) => set('highRiskROI', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Low-Risk ROI (%)" htmlFor="sim-lrROI" error={errors.lowRiskROI}>
              <Input
                id="sim-lrROI"
                type="number"
                min="-50"
                max="50"
                step="0.5"
                value={form.lowRiskROI}
                onChange={(e) => set('lowRiskROI', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Withdrawal Rate (%)" htmlFor="sim-wr" error={errors.withdrawalRate}
              hint="% of initial balance per year">
              <Input
                id="sim-wr"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.withdrawalRate}
                onChange={(e) => set('withdrawalRate', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Time-Step Buffer (years)" htmlFor="sim-ts" error={errors.timeStepYears}
              hint="Low-risk pot holds this many years of withdrawals">
              <Select value={form.timeStepYears} onValueChange={(value) => set('timeStepYears', value)}>
                <SelectTrigger id="sim-ts">
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
        </CollapsibleContent>
      </Collapsible>

      {/* ── Expenses (Smile Curve) ────────────────────────── */}
      <Collapsible
        open={openSections.expenses}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, expenses: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.expenses ? 'rotate-180' : ''}`} />
          <TrendingUp className="w-4 h-4" />
          Expenses — GoGo / GoSlow / NoGo
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="Base Annual Expenses ($)" htmlFor="sim-expenses" error={errors.baseAnnualExpenses}>
              <Input
                id="sim-expenses"
                type="number"
                min="0"
                step="1000"
                value={form.baseAnnualExpenses}
                onChange={(e) => set('baseAnnualExpenses', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="GoGo Ends At Age" htmlFor="sim-gogoEnd" error={errors.goGoEndAge}>
              <Input
                id="sim-gogoEnd"
                type="number"
                min="50"
                max="104"
                step="1"
                value={form.goGoEndAge}
                onChange={(e) => set('goGoEndAge', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="GoGo Rate (%)" htmlFor="sim-gogoRate" error={errors.goGoRate}
              hint="Spending multiplier (100 = full)">
              <Input
                id="sim-gogoRate"
                type="number"
                min="0"
                max="200"
                step="1"
                value={form.goGoRate}
                onChange={(e) => set('goGoRate', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="GoSlow Ends At Age" htmlFor="sim-goslowEnd" error={errors.goSlowEndAge}>
              <Input
                id="sim-goslowEnd"
                type="number"
                min="50"
                max="104"
                step="1"
                value={form.goSlowEndAge}
                onChange={(e) => set('goSlowEndAge', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="GoSlow Rate (%)" htmlFor="sim-goslowRate" error={errors.goSlowRate}>
              <Input
                id="sim-goslowRate"
                type="number"
                min="0"
                max="200"
                step="1"
                value={form.goSlowRate}
                onChange={(e) => set('goSlowRate', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="NoGo Rate (%)" htmlFor="sim-nogoRate" error={errors.noGoRate}>
              <Input
                id="sim-nogoRate"
                type="number"
                min="0"
                max="200"
                step="1"
                value={form.noGoRate}
                onChange={(e) => set('noGoRate', e.target.value)}
              />
            </FieldGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ── Rates ──────────────────────────────────────────── */}
      <Collapsible
        open={openSections.rates}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, rates: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.rates ? 'rotate-180' : ''}`} />
          <Percent className="w-4 h-4" />
          Rates
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="COLA Rate (%)" htmlFor="sim-cola" error={errors.colaRate}
              hint="Annual cost-of-living adjustment for annuity">
              <Input
                id="sim-cola"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.colaRate}
                onChange={(e) => set('colaRate', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="General Inflation (%)" htmlFor="sim-inflation" error={errors.inflationRate}
              hint="Annual inflation for non-healthcare expenses">
              <Input
                id="sim-inflation"
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={form.inflationRate}
                onChange={(e) => set('inflationRate', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Healthcare Inflation (%)" htmlFor="sim-hcInflation" error={errors.healthcareInflationRate}
              hint="Healthcare costs typically rise ~5.5%/yr">
              <Input
                id="sim-hcInflation"
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={form.healthcareInflationRate}
                onChange={(e) => set('healthcareInflationRate', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Healthcare Expense ($/yr)" htmlFor="sim-hcExpense" error={errors.healthcareAnnualExpenses}
              hint="Out-of-pocket costs, copays, dental, vision — exclude FEHB (enter below)">
              <Input
                id="sim-hcExpense"
                type="number"
                min="0"
                step="100"
                value={form.healthcareAnnualExpenses}
                onChange={(e) => set('healthcareAnnualExpenses', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup
              label="FEHB Premium ($/yr)"
              htmlFor="sim-fehb"
              error={errors.fehbPremiumAnnual}
              hint="Your ~28% share after government subsidy. Self Only ≈ $2,400 · Self+1 ≈ $5,500 · Family ≈ $6,500"
            >
              <Input
                id="sim-fehb"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 2400"
                value={form.fehbPremiumAnnual}
                onChange={(e) => set('fehbPremiumAnnual', e.target.value)}
              />
            </FieldGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ── Tax Configuration ────────────────────────────────── */}
      <Collapsible
        open={openSections.tax}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, tax: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.tax ? 'rotate-180' : ''}`} />
          <Receipt className="w-4 h-4" />
          Tax Configuration
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Filing Status" htmlFor="sim-filingStatus" hint="Required to enable tax calculations">
              <Select value={form.filingStatus} onValueChange={(value) => set('filingStatus', value)}>
                <SelectTrigger id="sim-filingStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not configured</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married_joint">Married Filing Jointly</SelectItem>
                  <SelectItem value="married_separate">Married Filing Separately</SelectItem>
                  <SelectItem value="head_of_household">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
            {form.filingStatus !== '' && (
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sim-applyIRMAA"
                    checked={form.applyIRMAA === 'true'}
                    onCheckedChange={(checked) => set('applyIRMAA', checked ? 'true' : 'false')}
                  />
                  <label htmlFor="sim-applyIRMAA" className="text-sm font-medium cursor-pointer">
                    Apply IRMAA Surcharges
                  </label>
                </div>
              </div>
            )}
          </div>
          {form.filingStatus !== '' && (
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
              Enables annual federal income tax, Social Security taxation (IRC § 86), and Medicare IRMAA surcharges for beneficiaries age 65+.
              Results appear in the Simulation Results table below.
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* ── Live Results ───────────────────────────────────── */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-foreground mb-2">Simulation Results</h3>
        <SimulationResults result={simulation} />
      </div>

      {/* ── Scenario Comparison ────────────────────────────── */}
      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Scenario Comparison</h3>
        <ScenarioComparison
          currentConfig={toConfig(form, birthYear, ssClaimingAge)}
          birthYear={birthYear}
          ssClaimingAge={ssClaimingAge}
          survivorBenefitOption={form.survivorBenefitOption as 'none' | 'partial' | 'full'}
        />
      </div>
    </FormSection>
  );
}

// ── Results Display ──────────────────────────────────────────────────────────

function SimulationResults({ result }: { result: FullSimulationResult | null }) {
  if (!result) {
    return (
      <Alert className="bg-muted">
        <AlertDescription className="text-center">
          Enter valid parameters above to see the year-by-year retirement projection.
        </AlertDescription>
      </Alert>
    );
  }

  const taxConfigured = result.years.some((y) => y.federalTax !== undefined);
  const lifetimeTax = taxConfigured
    ? result.years.reduce((sum, y) => sum + (y.totalTax ?? 0), 0)
    : 0;
  const afterTaxNet = taxConfigured
    ? result.years.reduce((sum, y) => sum + (y.afterTaxSurplus ?? 0), 0)
    : 0;

  return (
    <div className="space-y-4">
      {/* Key Metrics Banner */}
      <div className={`grid ${taxConfigured ? 'grid-cols-2 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'} gap-4 p-4 bg-muted rounded-lg`}>
        <MetricBox
          label="TSP Depletes"
          value={result.depletionAge === null ? 'NEVER' : `Age ${result.depletionAge}`}
          good={result.depletionAge === null}
        />
        <MetricBox
          label="Balance at 85"
          value={fmtK(result.balanceAt85)}
          good={result.balanceAt85 > 0}
        />
        <MetricBox
          label="Lifetime Income"
          value={fmtK(result.totalLifetimeIncome)}
        />
        <MetricBox
          label="Lifetime Expenses"
          value={fmtK(result.totalLifetimeExpenses)}
        />
        {taxConfigured && (
          <>
            <MetricBox label="Lifetime Tax" value={fmtK(lifetimeTax)} />
            <MetricBox
              label="After-Tax Net"
              value={fmtK(afterTaxNet)}
              good={afterTaxNet > 0}
            />
          </>
        )}
      </div>

      {/* Year-by-Year Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0">
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-xs w-8">Age</TableHead>
                <TableHead className="text-xs w-10">Year</TableHead>
                <TableHead className="text-xs text-right">Annuity</TableHead>
                <TableHead className="text-xs text-right">Suppl.</TableHead>
                <TableHead className="text-xs text-right">SS</TableHead>
                <TableHead className="text-xs text-right">TSP Draw</TableHead>
                <TableHead className="text-xs text-right">Income</TableHead>
                <TableHead className="text-xs text-right">Expenses</TableHead>
                <TableHead className="text-xs text-right">Surplus</TableHead>
                {taxConfigured && (
                  <>
                    <TableHead className="text-xs text-right">Fed Tax</TableHead>
                    <TableHead className="text-xs text-right">IRMAA</TableHead>
                    <TableHead className="text-xs text-right">Total Tax</TableHead>
                    <TableHead className="text-xs text-right">After-Tax Net</TableHead>
                  </>
                )}
                <TableHead className="text-xs text-right">TSP Bal.</TableHead>
                <TableHead className="text-xs text-right">Trad.</TableHead>
                <TableHead className="text-xs text-right">Roth</TableHead>
                <TableHead className="text-xs text-right">Hi-Risk</TableHead>
                <TableHead className="text-xs text-right">Lo-Risk</TableHead>
                <TableHead className="text-xs text-center">Phase</TableHead>
                <TableHead className="text-xs text-right">RMD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.years.map((yr) => {
                const phase = yr.smileMultiplier >= 1.0
                  ? 'GoGo'
                  : yr.smileMultiplier >= (result.config.noGoRate + 0.001)
                    ? 'GoSlow'
                    : 'NoGo';
                const phaseColor = phase === 'GoGo'
                  ? 'text-green-700 dark:text-green-400'
                  : phase === 'GoSlow'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-muted-foreground';
                const depleted = yr.totalTSPBalance <= 0;
                const rowBg = depleted
                  ? 'bg-destructive/10 hover:bg-destructive/20'
                  : yr.age === 85
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : '';

                return (
                  <TableRow key={yr.age} className={rowBg}>
                    <TableCell className="text-xs font-medium">{yr.age}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{yr.year}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.annuity)}</TableCell>
                    <TableCell className="text-xs text-right">{yr.fersSupplement > 0 ? fmtK(yr.fersSupplement) : '-'}</TableCell>
                    <TableCell className="text-xs text-right">{yr.socialSecurity > 0 ? fmtK(yr.socialSecurity) : '-'}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.tspWithdrawal)}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{fmtK(yr.totalIncome)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.totalExpenses)}</TableCell>
                    <TableCell className={`text-xs text-right font-medium ${yr.surplus >= 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                      {fmtK(yr.surplus)}
                    </TableCell>
                    {taxConfigured && (
                      <>
                        <TableCell className="text-xs text-right">{yr.federalTax !== undefined ? fmtK(yr.federalTax) : '—'}</TableCell>
                        <TableCell className="text-xs text-right">{yr.irmaaSurcharge && yr.irmaaSurcharge > 0 ? fmtK(yr.irmaaSurcharge) : '—'}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{yr.totalTax !== undefined ? fmtK(yr.totalTax) : '—'}</TableCell>
                        <TableCell className={`text-xs text-right font-medium ${
                          yr.afterTaxSurplus !== undefined
                            ? yr.afterTaxSurplus >= 0
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-destructive'
                            : ''
                        }`}>
                          {yr.afterTaxSurplus !== undefined ? fmtK(yr.afterTaxSurplus) : '—'}
                        </TableCell>
                      </>
                    )}
                    <TableCell className={`text-xs text-right font-medium ${depleted ? 'text-destructive' : ''}`}>
                      {fmtK(yr.totalTSPBalance)}
                    </TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.traditionalBalance)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.rothBalance)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.highRiskBalance)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.lowRiskBalance)}</TableCell>
                    <TableCell className="text-xs text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${phaseColor} bg-background border border-border`}>
                        {phase}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {yr.rmdRequired > 0 ? (
                        <span className={yr.rmdSatisfied ? 'text-green-700 dark:text-green-400' : 'text-destructive'}>
                          {fmtK(yr.rmdRequired)}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-sm font-semibold ${
        good === true ? 'text-green-700 dark:text-green-400' : good === false ? 'text-destructive' : 'text-foreground'
      }`}>
        {value}
      </div>
    </div>
  );
}
