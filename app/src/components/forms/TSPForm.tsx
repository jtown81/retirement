import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, TSPBalancesSchema, TSPContributionEventSchema } from '@storage/index';
import { z } from 'zod';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import type { TSPBalances, TSPContributionEvent } from '@models/tsp';

const TSPContributionListSchema = z.array(TSPContributionEventSchema);

function makeEmptyContribution(): TSPContributionEvent {
  return {
    id: crypto.randomUUID(),
    effectiveDate: '',
    employeeContributionPct: 0.05,
    isRoth: false,
    catchUpEnabled: false,
  };
}

const BALANCE_DEFAULTS: TSPBalances = {
  asOf: '',
  traditionalBalance: 0,
  rothBalance: 0,
};

export function TSPForm() {
  const [storedBal, saveBal, removeBal] = useLocalStorage(STORAGE_KEYS.TSP_BALANCES, TSPBalancesSchema);
  const [storedContribs, saveContribs, removeContribs] = useLocalStorage(STORAGE_KEYS.TSP_CONTRIBUTIONS, TSPContributionListSchema);

  const [balances, setBalances] = useState<TSPBalances>(storedBal ?? BALANCE_DEFAULTS);
  const [contributions, setContributions] = useState<TSPContributionEvent[]>(storedContribs ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setBal = <K extends keyof TSPBalances>(key: K, value: TSPBalances[K]) =>
    setBalances((prev) => ({ ...prev, [key]: value }));

  const addContribution = () => {
    setContributions((prev) => [...prev, makeEmptyContribution()]);
  };

  const removeContribution = (id: string) => {
    setContributions((prev) => prev.filter((c) => c.id !== id));
  };

  const updateContribution = (id: string, patch: Partial<TSPContributionEvent>) => {
    setContributions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  };

  const handleSave = () => {
    const balResult = TSPBalancesSchema.safeParse(balances);
    const contribResult = TSPContributionListSchema.safeParse(contributions);
    const newErrors: Record<string, string> = {};

    if (!balResult.success) {
      const flat = balResult.error.flatten().fieldErrors;
      Object.entries(flat).forEach(([k, v]) => { newErrors[k] = v?.[0] ?? ''; });
    }
    if (!contribResult.success) {
      newErrors.contributions = 'One or more contribution events are invalid.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    saveBal(balResult.data!);
    saveContribs(contribResult.data!);
  };

  const handleClear = () => {
    if (window.confirm('Clear TSP data? This cannot be undone.')) {
      removeBal();
      removeContribs();
      setBalances(BALANCE_DEFAULTS);
      setContributions([]);
      setErrors({});
    }
  };

  return (
    <FormSection
      title="TSP — Thrift Savings Plan"
      description="Current balances and contribution history for Traditional and Roth TSP accounts."
      onSave={handleSave}
      onClear={handleClear}
    >
      {/* Balances sub-section */}
      <h4 className="text-sm font-medium text-gray-700">Current Balances</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="As-Of Date" htmlFor="tspAsOf" error={errors.asOf}>
          <input
            id="tspAsOf"
            type="date"
            value={balances.asOf}
            onChange={(e) => setBal('asOf', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>
        <FieldGroup label="Traditional Balance ($)" htmlFor="tspTrad" error={errors.traditionalBalance}>
          <input
            id="tspTrad"
            type="number"
            min="0"
            step="1000"
            value={balances.traditionalBalance}
            onChange={(e) => setBal('traditionalBalance', Number(e.target.value))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>
        <FieldGroup label="Roth Balance ($)" htmlFor="tspRoth" error={errors.rothBalance}>
          <input
            id="tspRoth"
            type="number"
            min="0"
            step="1000"
            value={balances.rothBalance}
            onChange={(e) => setBal('rothBalance', Number(e.target.value))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>
      </div>

      {/* Contribution events */}
      <h4 className="text-sm font-medium text-gray-700 mt-6">Contribution Events</h4>
      {errors.contributions && <p className="text-sm text-red-600">{errors.contributions}</p>}

      <div className="space-y-3">
        {contributions.map((c, idx) => (
          <div key={c.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Contribution {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeContribution(c.id)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FieldGroup label="Effective Date" htmlFor={`tc-date-${c.id}`}>
                <input
                  id={`tc-date-${c.id}`}
                  type="date"
                  value={c.effectiveDate}
                  onChange={(e) => updateContribution(c.id, { effectiveDate: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </FieldGroup>

              <FieldGroup label="Contribution (%)" htmlFor={`tc-pct-${c.id}`}>
                <input
                  id={`tc-pct-${c.id}`}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(c.employeeContributionPct * 100)}
                  onChange={(e) => updateContribution(c.id, { employeeContributionPct: Number(e.target.value) / 100 })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </FieldGroup>

              <div className="flex items-end gap-4 col-span-2 sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 pb-2">
                  <input
                    type="checkbox"
                    checked={c.isRoth}
                    onChange={(e) => updateContribution(c.id, { isRoth: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Roth
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 pb-2">
                  <input
                    type="checkbox"
                    checked={c.catchUpEnabled}
                    onChange={(e) => updateContribution(c.id, { catchUpEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Catch-Up (50+)
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addContribution}
        className="mt-3 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
      >
        + Add Contribution Event
      </button>
    </FormSection>
  );
}
