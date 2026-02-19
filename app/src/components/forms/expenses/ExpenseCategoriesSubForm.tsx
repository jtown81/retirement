import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, ExpenseProfileSchema } from '@storage/index';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';
import { Alert, AlertDescription } from '@components/ui/alert';
import type { ExpenseProfile, ExpenseCategoryName } from '@models/expenses';

type ExpenseProfileModel = z.infer<typeof ExpenseProfileSchema>;

const CATEGORY_LABELS: Record<ExpenseCategoryName, string> = {
  'housing': 'Housing',
  'transportation': 'Transportation',
  'food': 'Food',
  'healthcare': 'Healthcare',
  'insurance': 'Insurance',
  'travel-leisure': 'Travel & Leisure',
  'utilities': 'Utilities',
  'personal-care': 'Personal Care',
  'gifts-charitable': 'Gifts & Charitable',
  'other': 'Other',
};

const ALL_CATEGORIES: ExpenseCategoryName[] = [
  'housing', 'transportation', 'food', 'healthcare', 'insurance',
  'travel-leisure', 'utilities', 'personal-care', 'gifts-charitable', 'other',
];

const DEFAULT_AMOUNTS: Record<ExpenseCategoryName, number> = {
  'housing': 18000,
  'transportation': 8000,
  'food': 7200,
  'healthcare': 8000,
  'insurance': 3000,
  'travel-leisure': 5000,
  'utilities': 4800,
  'personal-care': 2400,
  'gifts-charitable': 2400,
  'other': 2400,
};

interface ExpenseCategoriesFormState {
  categoryAmounts: Record<ExpenseCategoryName, string>;
}

const DEFAULTS: ExpenseCategoriesFormState = {
  categoryAmounts: Object.fromEntries(
    ALL_CATEGORIES.map((name) => [name, String(DEFAULT_AMOUNTS[name])])
  ) as Record<ExpenseCategoryName, string>,
};

function formStateFromStored(config: ExpenseProfileModel | null): ExpenseCategoriesFormState {
  if (!config) return DEFAULTS;
  return {
    categoryAmounts: Object.fromEntries(
      ALL_CATEGORIES.map((name) => {
        const cat = config.categories?.find((c) => c.name === name);
        return [name, String(cat?.annualAmount ?? DEFAULT_AMOUNTS[name])];
      })
    ) as Record<ExpenseCategoryName, string>,
  };
}

const EXPENSE_DEFAULTS: Partial<ExpenseProfileModel> = {
  baseYear: new Date().getFullYear(),
  inflationRate: 0.025,
  healthcareInflationRate: 0.055,
  smileCurveEnabled: true,
};

function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function ExpenseCategoriesSubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);

  const [form, setForm] = useState<ExpenseCategoriesFormState>(() => formStateFromStored(storedConfig));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const handleSave = () => {
    const saved = storedConfig ?? {};
    const categories = ALL_CATEGORIES.map((name) => ({
      name,
      annualAmount: Number(form.categoryAmounts[name]) || 0,
    }));
    const merged = {
      ...EXPENSE_DEFAULTS,
      ...saved,
      categories,
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
    if (window.confirm('Clear all expense categories to defaults? This cannot be undone.')) {
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
      title="Expense Categories"
      description="Enter your annual expenses by category. These drive income-vs-expense and smile curve projections."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      {errors.categories && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errors.categories}</AlertDescription>
        </Alert>
      )}

      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Category Amounts ($/year)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_CATEGORIES.map((name) => {
            const amount = Number(form.categoryAmounts[name]) || 0;
            return (
              <div
                key={name}
                className={`flex items-center gap-2 rounded-md px-2 py-2 ${
                  amount > 0 ? 'bg-primary/5' : ''
                }`}
              >
                <label htmlFor={`cat-${name}`} className="text-sm text-muted-foreground w-36 shrink-0">
                  {CATEGORY_LABELS[name]}
                </label>
                <div className="flex-1">
                  <Input
                    id={`cat-${name}`}
                    type="number"
                    min="0"
                    step="100"
                    value={form.categoryAmounts[name]}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryAmounts: { ...prev.categoryAmounts, [name]: e.target.value } }))}
                    className="h-8"
                  />
                </div>
                {amount > 0 && (
                  <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                    {formatUSD(amount / 12)}/mo
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </FormSection>
  );
}
