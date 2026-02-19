import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, TaxProfileSchema } from '@storage/index';
import { getStandardDeduction } from '@modules/tax';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Alert, AlertDescription } from '@components/ui/alert';
import type { TaxProfile, FilingStatus } from '@models/tax';

type TaxProfileModel = z.infer<typeof TaxProfileSchema>;

const CURRENT_YEAR = new Date().getFullYear();

const FILING_STATUS_OPTIONS: { label: string; value: FilingStatus }[] = [
  { label: 'Single', value: 'single' },
  { label: 'Married Filing Jointly', value: 'married-joint' },
  { label: 'Married Filing Separately', value: 'married-separate' },
  { label: 'Head of Household', value: 'head-of-household' },
];

interface FederalDeductionsFormState {
  filingStatus: string;
  deductionStrategy: string; // 'standard' or numeric string (itemized amount)
}

const DEFAULTS: FederalDeductionsFormState = {
  filingStatus: 'single',
  deductionStrategy: 'standard',
};

function formStateFromStored(config: TaxProfileModel | null): FederalDeductionsFormState {
  if (!config) return DEFAULTS;
  const strategy = typeof config.deductionStrategy === 'number'
    ? String(config.deductionStrategy)
    : 'standard';
  return {
    filingStatus: config.filingStatus ?? 'single',
    deductionStrategy: strategy,
  };
}

function getStandardDeductionAmount(filingStatus: FilingStatus, year: number): number {
  try {
    return getStandardDeduction(year, filingStatus);
  } catch {
    return 0;
  }
}

function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const TAX_DEFAULTS: Partial<TaxProfileModel> = {
  filingStatus: 'single',
  stateCode: null,
  stateResidencyYear: CURRENT_YEAR,
  deductionStrategy: 'standard',
  modelIrmaa: false,
};

export function FederalDeductionsSubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.TAX_PROFILE, TaxProfileSchema);

  const [form, setForm] = useState<FederalDeductionsFormState>(() => formStateFromStored(storedConfig));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const standardDeductionAmount = getStandardDeductionAmount(form.filingStatus as FilingStatus, CURRENT_YEAR);
  const isItemized = form.deductionStrategy !== 'standard';
  const itemizedAmount = isItemized ? Number(form.deductionStrategy) : 0;

  const handleSave = () => {
    const saved = storedConfig ?? {};
    const deductionValue = form.deductionStrategy === 'standard' ? 'standard' : Number(form.deductionStrategy);
    const merged = {
      ...TAX_DEFAULTS,
      ...saved,
      filingStatus: form.filingStatus as FilingStatus,
      deductionStrategy: deductionValue,
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
    if (window.confirm('Clear federal deduction settings? This cannot be undone.')) {
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
      title="Federal Deductions"
      description="Configure your filing status and federal deduction strategy (standard or itemized)."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      {/* ── Filing Status ──────────────────────────────────────────── */}
      <FieldGroup label="Filing Status" htmlFor="fed-filingStatus" error={errors.filingStatus}>
        <Select value={form.filingStatus} onValueChange={(value) => {
          setForm((prev) => ({ ...prev, filingStatus: value }));
        }}>
          <SelectTrigger id="fed-filingStatus">
            <SelectValue placeholder="Select filing status" />
          </SelectTrigger>
          <SelectContent>
            {FILING_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {/* ── Standard Deduction Display ────────────────────────────── */}
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
        <p className="text-sm font-medium text-foreground">
          Standard Deduction {CURRENT_YEAR}
        </p>
        <p className="text-lg font-bold text-primary">
          {formatUSD(standardDeductionAmount)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Based on "{FILING_STATUS_OPTIONS.find(o => o.value === form.filingStatus)?.label}" filing status
        </p>
      </div>

      {/* ── Deduction Strategy ───────────────────────────────────────── */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Deduction Strategy
        </label>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={!isItemized ? 'default' : 'outline'}
            onClick={() => setForm((prev) => ({ ...prev, deductionStrategy: 'standard' }))}
            className="text-sm"
          >
            Standard ({formatUSD(standardDeductionAmount)})
          </Button>
          <Button
            variant={isItemized ? 'default' : 'outline'}
            onClick={() => setForm((prev) => ({ ...prev, deductionStrategy: String(standardDeductionAmount) }))}
            className="text-sm"
          >
            Itemized (custom amount)
          </Button>
        </div>

        {isItemized && (
          <div className="mt-3">
            <FieldGroup label="Itemized Deduction Amount ($)" htmlFor="fed-itemizedAmount" error={errors.deductionStrategy}>
              <Input
                id="fed-itemizedAmount"
                type="number"
                min="0"
                step="100"
                value={itemizedAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, deductionStrategy: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your total itemized deductions. Using {formatUSD(itemizedAmount)} instead of {formatUSD(standardDeductionAmount)} standard deduction.
              </p>
            </FieldGroup>
          </div>
        )}
      </div>

      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          The higher of standard or itemized deduction reduces your taxable income, lowering federal income tax liability.
        </AlertDescription>
      </Alert>
    </FormSection>
  );
}
