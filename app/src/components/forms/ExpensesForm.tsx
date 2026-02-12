import { useState, useMemo } from 'react';
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

const INPUT_CLS = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

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

function makeDefaults(): ExpenseProfile {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    baseYear: new Date().getFullYear(),
    categories: ALL_CATEGORIES.map((name) => ({ name, annualAmount: DEFAULT_AMOUNTS[name] })),
    inflationRate: 0.025,
    healthcareInflationRate: 0.055,
    smileCurveEnabled: true,
  };
}

function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function ExpensesForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);
  const [form, setForm] = useState<ExpenseProfile>(() => stored ?? makeDefaults());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalAnnual = useMemo(
    () => form.categories.reduce((sum, c) => sum + c.annualAmount, 0),
    [form.categories],
  );
  const totalMonthly = totalAnnual / 12;

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

  const handleResetDefaults = () => {
    setForm(makeDefaults());
    setErrors({});
  };

  return (
    <FormSection
      title="Annual Expenses"
      description="Estimated annual expenses in retirement, by category. Used for income-vs-expense projections."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleResetDefaults}
    >
      {/* ── Totals banner ─────────────────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-wrap gap-6 items-center">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Annual Total</div>
          <div className={`text-2xl font-bold ${totalAnnual > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
            {formatUSD(totalAnnual)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Monthly</div>
          <div className={`text-lg font-semibold ${totalMonthly > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
            {formatUSD(totalMonthly)}
          </div>
        </div>
        {totalAnnual === 0 && (
          <p className="text-sm text-amber-700">
            Enter your expected retirement expenses below. These drive the income-vs-expense projection.
          </p>
        )}
      </div>

      {/* ── Settings ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Base Year" htmlFor="expBaseYear" error={errors.baseYear}>
          <input
            id="expBaseYear"
            type="number"
            min="2000"
            max="2100"
            value={form.baseYear}
            onChange={(e) => setForm((prev) => ({ ...prev, baseYear: Number(e.target.value) }))}
            className={INPUT_CLS}
          />
        </FieldGroup>

        <FieldGroup label="Inflation Rate (%)" htmlFor="inflRate" error={errors.inflationRate} hint="Annual inflation for general expenses">
          <input
            id="inflRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            value={(form.inflationRate * 100).toFixed(1)}
            onChange={(e) => setForm((prev) => ({ ...prev, inflationRate: Number(e.target.value) / 100 }))}
            className={INPUT_CLS}
          />
        </FieldGroup>
        <FieldGroup label="Healthcare Inflation (%)" htmlFor="hcInflRate" error={errors.healthcareInflationRate}
          hint="Healthcare costs typically rise faster (~5.5%)">
          <input
            id="hcInflRate"
            type="number"
            min="0"
            max="20"
            step="0.1"
            value={((form.healthcareInflationRate ?? 0.055) * 100).toFixed(1)}
            onChange={(e) => setForm((prev) => ({ ...prev, healthcareInflationRate: Number(e.target.value) / 100 }))}
            className={INPUT_CLS}
          />
        </FieldGroup>
      </div>

      <div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.smileCurveEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, smileCurveEnabled: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Enable expense smile curve (Blanchett 2014)
        </label>
        {form.smileCurveEnabled && (
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Spending typically starts high (travel/activities), dips mid-retirement, then rises again (healthcare).
          </p>
        )}
      </div>

      {/* ── Category amounts ──────────────────────────────────────────── */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Category Amounts ($/year)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_CATEGORIES.map((name) => {
            const cat = form.categories.find((c) => c.name === name);
            const amount = cat?.annualAmount ?? 0;
            return (
              <div
                key={name}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                  amount > 0 ? 'bg-blue-50' : ''
                }`}
              >
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
                    value={amount}
                    onChange={(e) => setCategoryAmount(name, Number(e.target.value))}
                    className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {amount > 0 && (
                  <span className="text-xs text-gray-500 w-16 text-right shrink-0">
                    {formatUSD(amount / 12)}/mo
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {errors.categories && <p className="text-sm text-red-600 mt-1">{errors.categories}</p>}
    </FormSection>
  );
}
