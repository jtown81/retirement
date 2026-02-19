import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  SimulationConfigSchema,
  ExpenseProfileSchema,
  FERSEstimateSchema,
  PersonalInfoSchema,
} from '@storage/index';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';

type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
type ExpenseProfile = z.infer<typeof ExpenseProfileSchema>;
type FERSEstimate = z.infer<typeof FERSEstimateSchema>;

interface ExpensesSimulationFormState {
  baseAnnualExpenses: string;
  goGoEndAge: string;
  goGoRate: string;
  goSlowEndAge: string;
  goSlowRate: string;
  noGoRate: string;
}

const DEFAULTS: ExpensesSimulationFormState = {
  baseAnnualExpenses: '60000',
  goGoEndAge: '72',
  goGoRate: '100',
  goSlowEndAge: '82',
  goSlowRate: '85',
  noGoRate: '75',
};

function formStateFromStored(config: SimulationConfig | null): ExpensesSimulationFormState {
  if (!config) return DEFAULTS;
  return {
    baseAnnualExpenses: String(config.baseAnnualExpenses ?? 60000),
    goGoEndAge: String(config.goGoEndAge ?? 72),
    goGoRate: String((config.goGoRate ?? 1.0) * 100),
    goSlowEndAge: String(config.goSlowEndAge ?? 82),
    goSlowRate: String((config.goSlowRate ?? 0.85) * 100),
    noGoRate: String((config.noGoRate ?? 0.75) * 100),
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

export function ExpensesSimulationSubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.SIMULATION_CONFIG, SimulationConfigSchema);
  const [storedExpenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);

  const [form, setForm] = useState<ExpensesSimulationFormState>(() => {
    // Prefer stored config, but if not available, derive from expense profile
    if (storedConfig) {
      return formStateFromStored(storedConfig as SimulationConfig);
    }
    if (storedExpenses) {
      const total = storedExpenses.categories.reduce((s, c) => s + c.annualAmount, 0);
      return {
        ...DEFAULTS,
        baseAnnualExpenses: String(total > 0 ? total : 60000),
      };
    }
    return DEFAULTS;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Auto-populate from expense profile on mount if no stored config
      if (!storedConfig && storedExpenses) {
        const total = storedExpenses.categories.reduce((s, c) => s + c.annualAmount, 0);
        if (total > 0) {
          setForm((prev) => ({
            ...prev,
            baseAnnualExpenses: String(total),
          }));
        }
      }
    }
  }, [storedConfig, storedExpenses]);

  const set = (key: keyof ExpensesSimulationFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const n = (s: string) => (s === '' ? 0 : Number(s));

    const saved = storedConfig ?? {};
    const merged = {
      ...SIM_CONFIG_DEFAULTS,
      ...saved,
      baseAnnualExpenses: n(form.baseAnnualExpenses),
      goGoEndAge: Math.round(n(form.goGoEndAge)),
      goGoRate: n(form.goGoRate) / 100,
      goSlowEndAge: Math.round(n(form.goSlowEndAge)),
      goSlowRate: n(form.goSlowRate) / 100,
      noGoRate: n(form.noGoRate) / 100,
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
    if (window.confirm('Clear expense smile curve? This cannot be undone.')) {
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  const handleLoadDefaults = () => {
    setForm(DEFAULTS);
  };

  return (
    <FormSection
      title="Expenses — GoGo / GoSlow / NoGo"
      description="Base annual expenses and the smile curve that models changing spending patterns across retirement phases."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="Base Annual Expenses ($)" htmlFor="exp-base" error={errors.baseAnnualExpenses}>
          <Input
            id="exp-base"
            type="number"
            min="0"
            step="1000"
            value={form.baseAnnualExpenses}
            onChange={(e) => set('baseAnnualExpenses', e.target.value)}
          />
          {storedExpenses && (
            <p className="text-xs text-muted-foreground mt-1">
              Sum of Expenses profile: ${storedExpenses.categories.reduce((s, c) => s + c.annualAmount, 0).toLocaleString()}
            </p>
          )}
        </FieldGroup>
        <FieldGroup label="GoGo Ends At Age" htmlFor="exp-gogoEnd" error={errors.goGoEndAge}>
          <Input
            id="exp-gogoEnd"
            type="number"
            min="50"
            max="104"
            step="1"
            value={form.goGoEndAge}
            onChange={(e) => set('goGoEndAge', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="GoGo Rate (%)" htmlFor="exp-gogoRate" error={errors.goGoRate}
          hint="Spending multiplier (100 = full)">
          <Input
            id="exp-gogoRate"
            type="number"
            min="0"
            max="200"
            step="1"
            value={form.goGoRate}
            onChange={(e) => set('goGoRate', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="GoSlow Ends At Age" htmlFor="exp-goslowEnd" error={errors.goSlowEndAge}>
          <Input
            id="exp-goslowEnd"
            type="number"
            min="50"
            max="104"
            step="1"
            value={form.goSlowEndAge}
            onChange={(e) => set('goSlowEndAge', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="GoSlow Rate (%)" htmlFor="exp-goslowRate" error={errors.goSlowRate}>
          <Input
            id="exp-goslowRate"
            type="number"
            min="0"
            max="200"
            step="1"
            value={form.goSlowRate}
            onChange={(e) => set('goSlowRate', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="NoGo Rate (%)" htmlFor="exp-nogoRate" error={errors.noGoRate}>
          <Input
            id="exp-nogoRate"
            type="number"
            min="0"
            max="200"
            step="1"
            value={form.noGoRate}
            onChange={(e) => set('noGoRate', e.target.value)}
          />
        </FieldGroup>
      </div>

      <div className="mt-4 p-3 bg-muted rounded text-sm text-muted-foreground">
        <p>
          <strong>Smile Curve Phases:</strong> Spending patterns typically follow three phases across retirement:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>GoGo</strong> (age {form.goGoEndAge} and younger): Active travel and hobbies at full or increased spending ({form.goGoRate}%)</li>
          <li><strong>GoSlow</strong> (age {form.goGoEndAge}-{form.goSlowEndAge}): Reduced activity, lower spending ({form.goSlowRate}%)</li>
          <li><strong>NoGo</strong> (age {form.goSlowEndAge}+): Health-related expenses, limited travel ({form.noGoRate}%)</li>
        </ul>
      </div>
    </FormSection>
  );
}
