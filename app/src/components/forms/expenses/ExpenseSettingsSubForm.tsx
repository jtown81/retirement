import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, ExpenseProfileSchema } from '@storage/index';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Info } from 'lucide-react';
import type { ExpenseProfile } from '@fedplan/models';

type ExpenseProfileModel = z.infer<typeof ExpenseProfileSchema>;

const CURRENT_YEAR = new Date().getFullYear();

interface ExpenseSettingsFormState {
  baseYear: string;
  inflationRate: string;
  healthcareInflationRate: string;
  smileCurveEnabled: boolean;
}

const DEFAULTS: ExpenseSettingsFormState = {
  baseYear: String(CURRENT_YEAR),
  inflationRate: '2.5',
  healthcareInflationRate: '5.5',
  smileCurveEnabled: true,
};

function formStateFromStored(config: ExpenseProfileModel | null): ExpenseSettingsFormState {
  if (!config) return DEFAULTS;
  return {
    baseYear: String(config.baseYear ?? CURRENT_YEAR),
    inflationRate: String((config.inflationRate ?? 0.025) * 100),
    healthcareInflationRate: String(((config.healthcareInflationRate ?? 0.055) * 100)),
    smileCurveEnabled: config.smileCurveEnabled ?? true,
  };
}

const EXPENSE_DEFAULTS: Partial<ExpenseProfileModel> = {
  baseYear: CURRENT_YEAR,
  inflationRate: 0.025,
  healthcareInflationRate: 0.055,
  smileCurveEnabled: true,
};

export function ExpenseSettingsSubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);

  const [form, setForm] = useState<ExpenseSettingsFormState>(() => formStateFromStored(storedConfig));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const handleSave = () => {
    const saved = storedConfig ?? ({} as Partial<ExpenseProfileModel>);
    const merged = {
      ...EXPENSE_DEFAULTS,
      ...saved,
      baseYear: Number(form.baseYear),
      inflationRate: Number(form.inflationRate) / 100,
      healthcareInflationRate: Number(form.healthcareInflationRate) / 100,
      smileCurveEnabled: form.smileCurveEnabled,
      id: saved.id || (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    };

    const result = ExpenseProfileSchema.safeParse(merged);
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
    if (window.confirm('Reset expense settings to defaults? This cannot be undone.')) {
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  const handleLoadDefaults = () => {
    setForm(DEFAULTS);
    setErrors({});
  };

  return (
    <FormSection
      title="Expense Settings"
      description="Configure inflation rates and expense smile curve behavior."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      {/* ── Base Year ──────────────────────────────────────────────────── */}
      <FieldGroup label="Base Year" htmlFor="baseYear" error={errors.baseYear}
        hint="The year that your category amounts are specified in. Used for inflation projection.">
        <Input
          id="baseYear"
          type="number"
          min="2000"
          max="2100"
          value={form.baseYear}
          onChange={(e) => setForm((prev) => ({ ...prev, baseYear: e.target.value }))}
        />
      </FieldGroup>

      {/* ── Inflation Rates ────────────────────────────────────────────── */}
      <FieldGroup label="General Inflation Rate (%)" htmlFor="inflRate" error={errors.inflationRate}
        hint="Annual inflation applied to non-healthcare expenses">
        <Input
          id="inflRate"
          type="number"
          min="0"
          max="20"
          step="0.1"
          value={form.inflationRate}
          onChange={(e) => setForm((prev) => ({ ...prev, inflationRate: e.target.value }))}
        />
      </FieldGroup>

      <FieldGroup label="Healthcare Inflation Rate (%)" htmlFor="hcInflRate" error={errors.healthcareInflationRate}
        hint="Healthcare costs typically rise faster than general inflation (~5.5%)">
        <Input
          id="hcInflRate"
          type="number"
          min="0"
          max="20"
          step="0.1"
          value={form.healthcareInflationRate}
          onChange={(e) => setForm((prev) => ({ ...prev, healthcareInflationRate: e.target.value }))}
        />
      </FieldGroup>

      {/* ── Smile Curve ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Checkbox
            id="smile-curve"
            checked={form.smileCurveEnabled}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, smileCurveEnabled: !!checked }))}
          />
          <label htmlFor="smile-curve" className="text-sm font-medium cursor-pointer">
            Enable expense smile curve (Blanchett 2014)
          </label>
        </div>

        {form.smileCurveEnabled && (
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 mb-3">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">Smile Curve Enabled</AlertTitle>
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Spending patterns change across retirement: high early (travel/activities), lower mid-retirement, then higher again (healthcare).
            </AlertDescription>
          </Alert>
        )}

        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">What is the Smile Curve?</AlertTitle>
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-2">
            <p>
              Research by Ameriprise (Blanchett 2014) shows retiree spending follows a predictable pattern:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>GoGo (early years)</strong> — High spending on travel and leisure activities</li>
              <li><strong>GoSlow (mid years)</strong> — Reduced spending as mobility declines</li>
              <li><strong>NoGo (late years)</strong> — Rising healthcare costs, reduced discretionary spending</li>
            </ul>
            <p>
              When enabled, your spending projection automatically adjusts by phase. When disabled, constant annual expenses are assumed.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </FormSection>
  );
}
