import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  SimulationConfigSchema,
  FERSEstimateSchema,
  ExpenseProfileSchema,
  PersonalInfoSchema,
} from '@storage/index';
import { projectRetirementSimulation } from '@modules/simulation/retirement-simulation';
import type { SimulationConfig, FullSimulationResult } from '@models/simulation';
import { useFERSEstimate, type FERSEstimateInput } from './useFERSEstimate';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import type { z } from 'zod';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
};

const INPUT_CLS = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

// ── Form state (all strings for controlled inputs) ───────────────────────────

interface FormState {
  retirementAge: string;
  endAge: string;
  fersAnnuity: string;
  fersSupplement: string;
  ssMonthlyAt62: string;
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
}

const DEFAULTS: FormState = {
  retirementAge: '62',
  endAge: '95',
  fersAnnuity: '30000',
  fersSupplement: '0',
  ssMonthlyAt62: '1800',
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

function toConfig(f: FormState): SimulationConfig {
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
  };
}

function configToFormState(config: SimulationConfig): FormState {
  return {
    retirementAge: String(config.retirementAge),
    endAge: String(config.endAge),
    fersAnnuity: String(config.fersAnnuity),
    fersSupplement: String(config.fersSupplement),
    ssMonthlyAt62: String(config.ssMonthlyAt62),
    tspBalanceAtRetirement: String(config.tspBalanceAtRetirement),
    traditionalPct: String(config.traditionalPct * 100),
    highRiskPct: String(config.highRiskPct * 100),
    highRiskROI: String(config.highRiskROI * 100),
    lowRiskROI: String(config.lowRiskROI * 100),
    withdrawalRate: String(config.withdrawalRate * 100),
    timeStepYears: String(config.timeStepYears),
    baseAnnualExpenses: String(config.baseAnnualExpenses),
    goGoEndAge: String(config.goGoEndAge),
    goGoRate: String(config.goGoRate * 100),
    goSlowEndAge: String(config.goSlowEndAge),
    goSlowRate: String(config.goSlowRate * 100),
    noGoRate: String(config.noGoRate * 100),
    colaRate: String(config.colaRate * 100),
    inflationRate: String(config.inflationRate * 100),
    healthcareInflationRate: String((config.healthcareInflationRate ?? 0.055) * 100),
    healthcareAnnualExpenses: String(config.healthcareAnnualExpenses ?? 8000),
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
    annuityReductionPct: fers.annuityReductionPct,
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

  // ── Live simulation ──────────────────────────────────────────────────────
  const simulation = useMemo<FullSimulationResult | null>(() => {
    try {
      const config = toConfig(form);
      const result = SimulationConfigSchema.safeParse(config);
      if (!result.success) return null;
      return projectRetirementSimulation(config);
    } catch {
      return null;
    }
  }, [form]);

  // ── Save / Clear ─────────────────────────────────────────────────────────
  const handleSave = () => {
    const config = toConfig(form);
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
      <div className="flex gap-3 mb-2 items-center">
        <button
          type="button"
          onClick={handlePullFromEstimate}
          className="text-xs text-blue-700 hover:text-blue-900 underline"
        >
          Pull values from FERS Estimate &amp; Expenses
        </button>
        {fersDefaults.sourceFields.size > 0 && (
          <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded">
            {fersDefaults.sourceFields.size} fields available from FERS Estimate
          </span>
        )}
      </div>

      {/* ── Core Parameters ─────────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-2">Core Parameters</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldGroup label="Retirement Age" htmlFor="sim-retAge" error={errors.retirementAge}>
            <input id="sim-retAge" type="number" min="50" max="90" step="1"
              value={form.retirementAge} onChange={(e) => set('retirementAge', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="End Age" htmlFor="sim-endAge" error={errors.endAge} hint="Projection endpoint (max 104)">
            <input id="sim-endAge" type="number" min="70" max="104" step="1"
              value={form.endAge} onChange={(e) => set('endAge', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="FERS Annuity ($/yr)" htmlFor="sim-annuity" error={errors.fersAnnuity}>
            <input id="sim-annuity" type="number" min="0" step="100"
              value={form.fersAnnuity} onChange={(e) => set('fersAnnuity', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="FERS Supplement ($/yr)" htmlFor="sim-supplement" error={errors.fersSupplement}
            hint="Paid until age 62; 0 if not eligible">
            <input id="sim-supplement" type="number" min="0" step="100"
              value={form.fersSupplement} onChange={(e) => set('fersSupplement', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="SS Monthly at 62 ($)" htmlFor="sim-ss" error={errors.ssMonthlyAt62}>
            <input id="sim-ss" type="number" min="0" step="50"
              value={form.ssMonthlyAt62} onChange={(e) => set('ssMonthlyAt62', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
        </div>
      </fieldset>

      {/* ── TSP ──────────────────────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-2">TSP — Balances &amp; Allocation</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldGroup label="TSP Balance at Retirement ($)" htmlFor="sim-tspBal" error={errors.tspBalanceAtRetirement}>
            <input id="sim-tspBal" type="number" min="0" step="1000"
              value={form.tspBalanceAtRetirement} onChange={(e) => set('tspBalanceAtRetirement', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="Traditional %" htmlFor="sim-tradPct" error={errors.traditionalPct}
            hint="Remainder is Roth">
            <input id="sim-tradPct" type="number" min="0" max="100" step="1"
              value={form.traditionalPct} onChange={(e) => set('traditionalPct', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="High-Risk %" htmlFor="sim-hrPct" error={errors.highRiskPct}
            hint="C/S/I funds; remainder in G/F">
            <input id="sim-hrPct" type="number" min="0" max="100" step="1"
              value={form.highRiskPct} onChange={(e) => set('highRiskPct', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="High-Risk ROI (%)" htmlFor="sim-hrROI" error={errors.highRiskROI}>
            <input id="sim-hrROI" type="number" min="-50" max="50" step="0.5"
              value={form.highRiskROI} onChange={(e) => set('highRiskROI', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="Low-Risk ROI (%)" htmlFor="sim-lrROI" error={errors.lowRiskROI}>
            <input id="sim-lrROI" type="number" min="-50" max="50" step="0.5"
              value={form.lowRiskROI} onChange={(e) => set('lowRiskROI', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="Withdrawal Rate (%)" htmlFor="sim-wr" error={errors.withdrawalRate}
            hint="% of initial balance per year">
            <input id="sim-wr" type="number" min="0" max="100" step="0.5"
              value={form.withdrawalRate} onChange={(e) => set('withdrawalRate', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="Time-Step Buffer (years)" htmlFor="sim-ts" error={errors.timeStepYears}
            hint="Low-risk pot holds this many years of withdrawals">
            <select id="sim-ts" value={form.timeStepYears}
              onChange={(e) => set('timeStepYears', e.target.value)} className={INPUT_CLS}>
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
            </select>
          </FieldGroup>
        </div>
      </fieldset>

      {/* ── Expenses (Smile Curve) ────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-2">Expenses — GoGo / GoSlow / NoGo</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldGroup label="Base Annual Expenses ($)" htmlFor="sim-expenses" error={errors.baseAnnualExpenses}>
            <input id="sim-expenses" type="number" min="0" step="1000"
              value={form.baseAnnualExpenses} onChange={(e) => set('baseAnnualExpenses', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="GoGo Ends At Age" htmlFor="sim-gogoEnd" error={errors.goGoEndAge}>
            <input id="sim-gogoEnd" type="number" min="50" max="104" step="1"
              value={form.goGoEndAge} onChange={(e) => set('goGoEndAge', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="GoGo Rate (%)" htmlFor="sim-gogoRate" error={errors.goGoRate}
            hint="Spending multiplier (100 = full)">
            <input id="sim-gogoRate" type="number" min="0" max="200" step="1"
              value={form.goGoRate} onChange={(e) => set('goGoRate', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="GoSlow Ends At Age" htmlFor="sim-goslowEnd" error={errors.goSlowEndAge}>
            <input id="sim-goslowEnd" type="number" min="50" max="104" step="1"
              value={form.goSlowEndAge} onChange={(e) => set('goSlowEndAge', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="GoSlow Rate (%)" htmlFor="sim-goslowRate" error={errors.goSlowRate}>
            <input id="sim-goslowRate" type="number" min="0" max="200" step="1"
              value={form.goSlowRate} onChange={(e) => set('goSlowRate', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="NoGo Rate (%)" htmlFor="sim-nogoRate" error={errors.noGoRate}>
            <input id="sim-nogoRate" type="number" min="0" max="200" step="1"
              value={form.noGoRate} onChange={(e) => set('noGoRate', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
        </div>
      </fieldset>

      {/* ── Rates ──────────────────────────────────────────── */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-800 mb-2">Rates</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="COLA Rate (%)" htmlFor="sim-cola" error={errors.colaRate}
            hint="Annual cost-of-living adjustment for annuity">
            <input id="sim-cola" type="number" min="0" max="10" step="0.1"
              value={form.colaRate} onChange={(e) => set('colaRate', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="General Inflation (%)" htmlFor="sim-inflation" error={errors.inflationRate}
            hint="Annual inflation for non-healthcare expenses">
            <input id="sim-inflation" type="number" min="0" max="20" step="0.1"
              value={form.inflationRate} onChange={(e) => set('inflationRate', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="Healthcare Inflation (%)" htmlFor="sim-hcInflation" error={errors.healthcareInflationRate}
            hint="Healthcare costs typically rise ~5.5%/yr">
            <input id="sim-hcInflation" type="number" min="0" max="20" step="0.1"
              value={form.healthcareInflationRate} onChange={(e) => set('healthcareInflationRate', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
          <FieldGroup label="Healthcare Expense ($/yr)" htmlFor="sim-hcExpense" error={errors.healthcareAnnualExpenses}
            hint="Portion of base expenses that is healthcare">
            <input id="sim-hcExpense" type="number" min="0" step="100"
              value={form.healthcareAnnualExpenses} onChange={(e) => set('healthcareAnnualExpenses', e.target.value)} className={INPUT_CLS} />
          </FieldGroup>
        </div>
      </fieldset>

      {/* ── Live Results ───────────────────────────────────── */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Simulation Results</h3>
        <SimulationResults result={simulation} />
      </div>
    </FormSection>
  );
}

// ── Results Display ──────────────────────────────────────────────────────────

function SimulationResults({ result }: { result: FullSimulationResult | null }) {
  if (!result) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
        Enter valid parameters above to see the year-by-year retirement projection.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
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
        </div>
      </div>

      {/* Year-by-Year Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-600">Age</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">Year</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Annuity</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Suppl.</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">SS</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">TSP Draw</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Income</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Expenses</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Surplus</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">TSP Bal.</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Trad.</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Roth</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Hi-Risk</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">Lo-Risk</th>
                <th className="px-2 py-2 text-center font-medium text-gray-600">Phase</th>
                <th className="px-2 py-2 text-right font-medium text-gray-600">RMD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.years.map((yr) => {
                const phase = yr.smileMultiplier >= 1.0
                  ? 'GoGo'
                  : yr.smileMultiplier >= (result.config.noGoRate + 0.001)
                    ? 'GoSlow'
                    : 'NoGo';
                const phaseColor = phase === 'GoGo'
                  ? 'text-green-700 bg-green-50'
                  : phase === 'GoSlow'
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-gray-600 bg-gray-100';
                const depleted = yr.totalTSPBalance <= 0;
                const rowBg = depleted
                  ? 'bg-red-50'
                  : yr.age === 85
                    ? 'bg-blue-50'
                    : '';

                return (
                  <tr key={yr.age} className={rowBg}>
                    <td className="px-2 py-1 font-medium text-gray-900">{yr.age}</td>
                    <td className="px-2 py-1 text-gray-500">{yr.year}</td>
                    <td className="px-2 py-1 text-right">{fmtK(yr.annuity)}</td>
                    <td className="px-2 py-1 text-right">{yr.fersSupplement > 0 ? fmtK(yr.fersSupplement) : '-'}</td>
                    <td className="px-2 py-1 text-right">{yr.socialSecurity > 0 ? fmtK(yr.socialSecurity) : '-'}</td>
                    <td className="px-2 py-1 text-right">{fmtK(yr.tspWithdrawal)}</td>
                    <td className="px-2 py-1 text-right font-medium">{fmtK(yr.totalIncome)}</td>
                    <td className="px-2 py-1 text-right">{fmtK(yr.totalExpenses)}</td>
                    <td className={`px-2 py-1 text-right font-medium ${yr.surplus >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {fmtK(yr.surplus)}
                    </td>
                    <td className={`px-2 py-1 text-right font-medium ${depleted ? 'text-red-700' : ''}`}>
                      {fmtK(yr.totalTSPBalance)}
                    </td>
                    <td className="px-2 py-1 text-right">{fmtK(yr.traditionalBalance)}</td>
                    <td className="px-2 py-1 text-right">{fmtK(yr.rothBalance)}</td>
                    <td className="px-2 py-1 text-right">{fmtK(yr.highRiskBalance)}</td>
                    <td className="px-2 py-1 text-right">{fmtK(yr.lowRiskBalance)}</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${phaseColor}`}>
                        {phase}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      {yr.rmdRequired > 0 ? (
                        <span className={yr.rmdSatisfied ? 'text-green-700' : 'text-red-700'}>
                          {fmtK(yr.rmdRequired)}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-sm font-semibold ${
        good === true ? 'text-green-700' : good === false ? 'text-red-700' : 'text-gray-900'
      }`}>
        {value}
      </div>
    </div>
  );
}
