import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  SimulationConfigSchema,
  ExpenseProfileSchema,
} from '@storage/index';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';

type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
type ExpenseProfile = z.infer<typeof ExpenseProfileSchema>;

interface RatesFormState {
  colaRate: string;
  inflationRate: string;
  healthcareInflationRate: string;
  healthcareAnnualExpenses: string;
}

const DEFAULTS: RatesFormState = {
  colaRate: '2',
  inflationRate: '2.5',
  healthcareInflationRate: '5.5',
  healthcareAnnualExpenses: '8000',
};

function formStateFromStored(config: SimulationConfig | null): RatesFormState {
  if (!config) return DEFAULTS;
  return {
    colaRate: String((config.colaRate ?? 0.02) * 100),
    inflationRate: String((config.inflationRate ?? 0.025) * 100),
    healthcareInflationRate: String((config.healthcareInflationRate ?? 0.055) * 100),
    healthcareAnnualExpenses: String(config.healthcareAnnualExpenses ?? 8000),
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

export function RatesSubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.SIMULATION_CONFIG, SimulationConfigSchema);
  const [storedExpenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);

  const [form, setForm] = useState<RatesFormState>(() => {
    // Prefer stored config, but if not available, derive from expense profile
    if (storedConfig) {
      return formStateFromStored(storedConfig as SimulationConfig);
    }
    if (storedExpenses) {
      const hcCat = storedExpenses.categories.find((c) => c.name === 'healthcare');
      return {
        ...DEFAULTS,
        inflationRate: String(storedExpenses.inflationRate * 100),
        healthcareInflationRate: String((storedExpenses.healthcareInflationRate ?? 0.055) * 100),
        healthcareAnnualExpenses: String(hcCat?.annualAmount ?? 8000),
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
        setForm((prev) => {
          const hcCat = storedExpenses.categories.find((c) => c.name === 'healthcare');
          return {
            ...prev,
            inflationRate: String(storedExpenses.inflationRate * 100),
            healthcareInflationRate: String((storedExpenses.healthcareInflationRate ?? 0.055) * 100),
            healthcareAnnualExpenses: String(hcCat?.annualAmount ?? 8000),
          };
        });
      }
    }
  }, [storedConfig, storedExpenses]);

  const set = (key: keyof RatesFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const n = (s: string) => (s === '' ? 0 : Number(s));

    const saved = storedConfig ?? {};
    const merged = {
      ...SIM_CONFIG_DEFAULTS,
      ...saved,
      colaRate: n(form.colaRate) / 100,
      inflationRate: n(form.inflationRate) / 100,
      healthcareInflationRate: n(form.healthcareInflationRate) / 100,
      healthcareAnnualExpenses: n(form.healthcareAnnualExpenses),
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
    if (window.confirm('Clear rates? This cannot be undone.')) {
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  const handleLoadDefaults = () => {
    setForm(DEFAULTS);
  };

  return (
    <FormSection
      title="Rates"
      description="Inflation assumptions for annuity COLA, general expenses, and healthcare costs."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="COLA Rate (%)" htmlFor="rates-cola" error={errors.colaRate}
          hint="Annual cost-of-living adjustment for annuity">
          <Input
            id="rates-cola"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={form.colaRate}
            onChange={(e) => set('colaRate', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="General Inflation (%)" htmlFor="rates-inflation" error={errors.inflationRate}
          hint="Annual inflation for non-healthcare expenses">
          <Input
            id="rates-inflation"
            type="number"
            min="0"
            max="20"
            step="0.1"
            value={form.inflationRate}
            onChange={(e) => set('inflationRate', e.target.value)}
          />
          {storedExpenses && (
            <p className="text-xs text-muted-foreground mt-1">
              From Expenses profile: {(storedExpenses.inflationRate * 100).toFixed(2)}%
            </p>
          )}
        </FieldGroup>
        <FieldGroup label="Healthcare Inflation (%)" htmlFor="rates-hcInflation" error={errors.healthcareInflationRate}
          hint="Healthcare costs typically rise ~5.5%/yr">
          <Input
            id="rates-hcInflation"
            type="number"
            min="0"
            max="20"
            step="0.1"
            value={form.healthcareInflationRate}
            onChange={(e) => set('healthcareInflationRate', e.target.value)}
          />
          {storedExpenses && (
            <p className="text-xs text-muted-foreground mt-1">
              From Expenses profile: {((storedExpenses.healthcareInflationRate ?? 0.055) * 100).toFixed(2)}%
            </p>
          )}
        </FieldGroup>
        <FieldGroup label="Healthcare Expense ($/yr)" htmlFor="rates-hcExpense" error={errors.healthcareAnnualExpenses}
          hint="Portion of base expenses that is healthcare">
          <Input
            id="rates-hcExpense"
            type="number"
            min="0"
            step="100"
            value={form.healthcareAnnualExpenses}
            onChange={(e) => set('healthcareAnnualExpenses', e.target.value)}
          />
          {storedExpenses && (
            <p className="text-xs text-muted-foreground mt-1">
              From Expenses profile: ${(storedExpenses.categories.find((c) => c.name === 'healthcare')?.annualAmount ?? 0).toLocaleString()}
            </p>
          )}
        </FieldGroup>
      </div>
    </FormSection>
  );
}
