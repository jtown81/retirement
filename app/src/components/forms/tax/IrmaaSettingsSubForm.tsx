import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, TaxProfileSchema } from '@storage/index';
import type { z } from 'zod';
import { FormSection } from '../FormSection';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Checkbox } from '@components/ui/checkbox';
import { AlertCircle, Info } from 'lucide-react';

type TaxProfileModel = z.infer<typeof TaxProfileSchema>;

const CURRENT_YEAR = new Date().getFullYear();

interface IrmaaSettingsFormState {
  modelIrmaa: boolean;
}

const DEFAULTS: IrmaaSettingsFormState = {
  modelIrmaa: false,
};

function formStateFromStored(config: TaxProfileModel | null): IrmaaSettingsFormState {
  if (!config) return DEFAULTS;
  return {
    modelIrmaa: config.modelIrmaa ?? false,
  };
}

const TAX_DEFAULTS: Partial<TaxProfileModel> = {
  filingStatus: 'single',
  stateCode: null,
  stateResidencyYear: CURRENT_YEAR,
  deductionStrategy: 'standard',
  modelIrmaa: false,
};

export function IrmaaSettingsSubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.TAX_PROFILE, TaxProfileSchema);

  const [form, setForm] = useState<IrmaaSettingsFormState>(() => formStateFromStored(storedConfig));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const handleSave = () => {
    const saved = storedConfig ?? {};
    const merged = {
      ...TAX_DEFAULTS,
      ...saved,
      modelIrmaa: form.modelIrmaa,
    };

    const result = TaxProfileSchema.safeParse(merged);
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
    if (window.confirm('Reset IRMAA modeling to disabled? This cannot be undone.')) {
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
      title="Medicare IRMAA Modeling"
      description="Configure Income-Related Monthly Adjustment Amounts (IRMAA) surcharge estimation."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      {/* ── IRMAA Modeling Toggle ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Checkbox
            id="irmaa-toggle"
            checked={form.modelIrmaa}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, modelIrmaa: !!checked }))}
          />
          <label htmlFor="irmaa-toggle" className="text-sm font-medium cursor-pointer">
            Model Medicare IRMAA surcharges (age 65+)
          </label>
        </div>

        {form.modelIrmaa && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">IRMAA Enabled</AlertTitle>
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              When enabled, your projected income at age 65+ will be evaluated against IRMAA thresholds.
              Medicare Part B and Part D premiums will be adjusted upward if your Modified Adjusted Gross
              Income (MAGI) exceeds the threshold for your filing status. IRMAA surcharges can significantly
              increase healthcare costs in retirement.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* ── Info Panel ───────────────────────────────────────────────────────── */}
      <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">What is IRMAA?</AlertTitle>
        <AlertDescription className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-2">
          <p>
            <strong>IRMAA</strong> (Income-Related Monthly Adjustment Amount) is an additional premium for
            Medicare Part B (medical insurance) and Part D (prescription drug coverage) charged to higher-income
            beneficiaries age 65+.
          </p>
          <p>
            <strong>Key points:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>MAGI calculated 2 years prior (e.g., 2025 premiums use 2023 income)</li>
            <li>Filing status affects thresholds (single vs. married jointly, etc.)</li>
            <li>Thresholds indexed annually for inflation</li>
            <li>Surcharges range from $17.20 to $594.30/month (2024, subject to change)</li>
            <li>Social Security, TSP withdrawals, annuities count toward MAGI</li>
          </ul>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
            Note: This model uses 2024 thresholds and will require annual updates as IRMAA rules change.
          </p>
        </AlertDescription>
      </Alert>

      {errors.modelIrmaa && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{errors.modelIrmaa}</AlertDescription>
        </Alert>
      )}
    </FormSection>
  );
}
