import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, MilitaryServiceSchema } from '@storage/index';
import { z } from 'zod';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import type { MilitaryService } from '@models/military';

const MilitaryServiceListSchema = z.array(MilitaryServiceSchema);

const BRANCHES = ['Army', 'Navy', 'Air Force', 'Marine Corps', 'Coast Guard', 'Space Force'];

interface PayYearEntry {
  year: number;
  pay: number;
}

interface MilitaryServiceLocal extends Omit<MilitaryService, 'annualBasicPayByYear'> {
  payEntries: PayYearEntry[];
}

function toLocal(svc: MilitaryService): MilitaryServiceLocal {
  return {
    ...svc,
    payEntries: Object.entries(svc.annualBasicPayByYear).map(([y, p]) => ({
      year: Number(y),
      pay: p,
    })),
  };
}

function fromLocal(local: MilitaryServiceLocal): MilitaryService {
  const { payEntries, ...rest } = local;
  return {
    ...rest,
    annualBasicPayByYear: Object.fromEntries(payEntries.map((e) => [e.year, e.pay])) as Record<number, number>,
  };
}

function makeEmpty(): MilitaryServiceLocal {
  return {
    id: crypto.randomUUID(),
    startDate: '',
    endDate: '',
    branch: 'Army',
    buybackDepositPaid: 0,
    militaryRetirementWaived: false,
    payEntries: [],
  };
}

export function MilitaryServiceForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.MILITARY_SERVICE, MilitaryServiceListSchema);
  const [services, setServices] = useState<MilitaryServiceLocal[]>(() =>
    stored ? stored.map(toLocal) : [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addService = () => {
    setServices((prev) => [...prev, makeEmpty()]);
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const updateService = (id: string, patch: Partial<MilitaryServiceLocal>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const addPayYear = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        const nextYear = s.payEntries.length > 0
          ? Math.max(...s.payEntries.map((e) => e.year)) + 1
          : s.startDate ? new Date(s.startDate).getFullYear() : new Date().getFullYear();
        return { ...s, payEntries: [...s.payEntries, { year: nextYear, pay: 0 }] };
      }),
    );
  };

  const removePayYear = (serviceId: string, year: number) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, payEntries: s.payEntries.filter((e) => e.year !== year) }
          : s,
      ),
    );
  };

  const updatePayYear = (serviceId: string, year: number, pay: number) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, payEntries: s.payEntries.map((e) => (e.year === year ? { ...e, pay } : e)) }
          : s,
      ),
    );
  };

  const handleSave = () => {
    const data = services.map(fromLocal);
    const result = MilitaryServiceListSchema.safeParse(data);
    if (!result.success) {
      setErrors({ services: 'One or more service periods are invalid. Check dates and pay entries.' });
      return;
    }
    setErrors({});
    save(result.data);
  };

  const handleClear = () => {
    if (window.confirm('Clear military service data? This cannot be undone.')) {
      remove();
      setServices([]);
      setErrors({});
    }
  };

  return (
    <FormSection
      title="Military Service (Optional)"
      description="Prior military service periods for buyback credit. Skip if not applicable."
      onSave={handleSave}
      onClear={handleClear}
    >
      {errors.services && <p className="text-sm text-red-600 mb-2">{errors.services}</p>}

      <div className="space-y-4">
        {services.map((svc, idx) => (
          <div key={svc.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Service Period {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeService(svc.id)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldGroup label="Start Date" htmlFor={`ms-start-${svc.id}`}>
                <input
                  id={`ms-start-${svc.id}`}
                  type="date"
                  value={svc.startDate}
                  onChange={(e) => updateService(svc.id, { startDate: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </FieldGroup>
              <FieldGroup label="End Date" htmlFor={`ms-end-${svc.id}`}>
                <input
                  id={`ms-end-${svc.id}`}
                  type="date"
                  value={svc.endDate}
                  onChange={(e) => updateService(svc.id, { endDate: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </FieldGroup>
              <FieldGroup label="Branch" htmlFor={`ms-branch-${svc.id}`}>
                <select
                  id={`ms-branch-${svc.id}`}
                  value={svc.branch}
                  onChange={(e) => updateService(svc.id, { branch: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <FieldGroup label="Buyback Deposit Paid ($)" htmlFor={`ms-deposit-${svc.id}`}>
                <input
                  id={`ms-deposit-${svc.id}`}
                  type="number"
                  min="0"
                  step="100"
                  value={svc.buybackDepositPaid}
                  onChange={(e) => updateService(svc.id, { buybackDepositPaid: Number(e.target.value) })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </FieldGroup>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={svc.militaryRetirementWaived}
                    onChange={(e) => updateService(svc.id, { militaryRetirementWaived: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Military retirement waived
                </label>
              </div>
            </div>

            {/* Pay by year */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Annual Basic Pay by Year</span>
                <button
                  type="button"
                  onClick={() => addPayYear(svc.id)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Year
                </button>
              </div>
              {svc.payEntries.length === 0 && (
                <p className="text-sm text-gray-500 italic">No pay entries. Add years to record annual basic pay.</p>
              )}
              <div className="space-y-2">
                {svc.payEntries.map((entry) => (
                  <div key={entry.year} className="flex items-center gap-2">
                    <input
                      type="number"
                      value={entry.year}
                      readOnly
                      className="w-20 rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-sm text-gray-600"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={entry.pay}
                        onChange={(e) => updatePayYear(svc.id, entry.year, Number(e.target.value))}
                        className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePayYear(svc.id, entry.year)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addService}
        className="mt-3 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
      >
        + Add Service Period
      </button>
    </FormSection>
  );
}
