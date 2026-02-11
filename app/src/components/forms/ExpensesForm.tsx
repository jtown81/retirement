import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, ExpenseProfileSchema } from '@storage/index';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import type { ExpenseProfile, ExpenseCategoryName } from '@models/expenses';

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

function makeDefaults(): ExpenseProfile {
  return {
    id: crypto.randomUUID(),
    baseYear: new Date().getFullYear(),
    categories: ALL_CATEGORIES.map((name) => ({ name, annualAmount: 0 })),
    inflationRate: 0.025,
    smileCurveEnabled: true,
  };
}

export function ExpensesForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);
  const [form, setForm] = useState<ExpenseProfile>(() => {
    if (stored) return stored;
    return makeDefaults();
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setCategoryAmount = (name: ExpenseCategoryName, amount: number) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.name === name ? { ...c, annualAmount: amount } : c,
      ),
    }));
  };

  const handleSave = () => {
    const result = ExpenseProfileSchema.safeParse(form);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])),
      );
      return;
    }
    setErrors({});
    save(result.data);
  };

  const handleClear = () => {
    if (window.confirm('Clear expense data? This cannot be undone.')) {
      remove();
      setForm(makeDefaults());
      setErrors({});
    }
  };

  return (
    <FormSection
      title="Annual Expenses"
      description="Estimated annual expenses in retirement, by category. Used for income-vs-expense projections."
      onSave={handleSave}
      onClear={handleClear}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Base Year" htmlFor="expBaseYear" error={errors.baseYear}>
          <input
            id="expBaseYear"
            type="number"
            min="2000"
            max="2100"
            value={form.baseYear}
            onChange={(e) => setForm((prev) => ({ ...prev, baseYear: Number(e.target.value) }))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>

        <FieldGroup label="Inflation Rate (%)" htmlFor="inflRate" error={errors.inflationRate} hint="Annual inflation assumption">
          <input
            id="inflRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            value={(form.inflationRate * 100).toFixed(1)}
            onChange={(e) => setForm((prev) => ({ ...prev, inflationRate: Number(e.target.value) / 100 }))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>
      </div>

      <div className="mt-2">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.smileCurveEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, smileCurveEnabled: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Enable expense smile curve (Blanchett 2014)
        </label>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Category Amounts ($/year)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_CATEGORIES.map((name) => {
            const cat = form.categories.find((c) => c.name === name);
            return (
              <div key={name} className="flex items-center gap-2">
                <label htmlFor={`exp-${name}`} className="text-sm text-gray-600 w-36 shrink-0">
                  {CATEGORY_LABELS[name]}
                </label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                  <input
                    id={`exp-${name}`}
                    type="number"
                    min="0"
                    step="100"
                    value={cat?.annualAmount ?? 0}
                    onChange={(e) => setCategoryAmount(name, Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errors.categories && <p className="text-sm text-red-600 mt-1">{errors.categories}</p>}
    </FormSection>
  );
}
