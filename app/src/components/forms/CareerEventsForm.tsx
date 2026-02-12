import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, CareerProfileSchema } from '@storage/index';
import { gradeStepToSalary, applyLocality, getLocalityRate, getAvailableLocalityCodes } from '@modules/career';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import type { CareerProfile, CareerEvent } from '@models/career';
import type { GSGrade, GSStep } from '@models/common';

const EVENT_TYPES: CareerEvent['type'][] = [
  'hire', 'promotion', 'step-increase', 'locality-change', 'separation', 'rehire',
];

const EVENT_TYPE_LABELS: Record<CareerEvent['type'], string> = {
  'hire': 'Hire',
  'promotion': 'Promotion',
  'step-increase': 'Step Increase',
  'locality-change': 'Locality Change',
  'separation': 'Separation',
  'rehire': 'Rehire',
};

const LOCALITY_CODES = getAvailableLocalityCodes(2024);

function makeEmptyEvent(): CareerEvent {
  return {
    id: crypto.randomUUID(),
    type: 'hire',
    effectiveDate: '',
    grade: 7 as GSGrade,
    step: 1 as GSStep,
    localityCode: 'RUS',
    paySystem: 'GS',
    annualSalary: 0,
  };
}

function computeSalary(grade: number, step: number, localityCode: string, year: number): number {
  const base = gradeStepToSalary(grade, step, year);
  const rate = getLocalityRate(localityCode, year);
  return Math.round(applyLocality(base, rate));
}

export function CareerEventsForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.CAREER_PROFILE, CareerProfileSchema);
  const [form, setForm] = useState<CareerProfile>(() =>
    (stored as CareerProfile | null) ?? { id: crypto.randomUUID(), scdLeave: '', scdRetirement: '', paySystem: 'GS' as const, events: [] },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = <K extends keyof CareerProfile>(key: K, value: CareerProfile[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addEvent = () => {
    setForm((prev) => ({ ...prev, events: [...prev.events, makeEmptyEvent()] }));
  };

  const removeEvent = (id: string) => {
    setForm((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
  };

  const updateEvent = (id: string, patch: Partial<CareerEvent>) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.map((ev) => {
        if (ev.id !== id) return ev;
        const updated = { ...ev, ...patch };
        // Auto-compute salary when grade/step/locality change (unless user manually set salary via the patch)
        if (('grade' in patch || 'step' in patch || 'localityCode' in patch) && !('annualSalary' in patch)) {
          const year = updated.effectiveDate ? new Date(updated.effectiveDate).getFullYear() : 2024;
          updated.annualSalary = computeSalary(updated.grade, updated.step, updated.localityCode, year);
        }
        return updated;
      }),
    }));
  };

  const handleSave = () => {
    const result = CareerProfileSchema.safeParse(form);
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
    if (window.confirm('Clear career events? This cannot be undone.')) {
      remove();
      setForm({ id: crypto.randomUUID(), scdLeave: '', scdRetirement: '', paySystem: 'GS' as const, events: [] });
      setErrors({});
    }
  };

  return (
    <FormSection
      title="Career Events"
      description="Timeline of career events including hires, promotions, and step increases. Salary auto-populates from GS pay tables."
      onSave={handleSave}
      onClear={handleClear}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <FieldGroup label="SCD — Leave" htmlFor="careerScdLeave" error={errors.scdLeave}>
          <input
            id="careerScdLeave"
            type="date"
            value={form.scdLeave}
            onChange={(e) => setField('scdLeave', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>
        <FieldGroup label="SCD — Retirement" htmlFor="careerScdRetire" error={errors.scdRetirement}>
          <input
            id="careerScdRetire"
            type="date"
            value={form.scdRetirement}
            onChange={(e) => setField('scdRetirement', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </FieldGroup>
        <FieldGroup label="Pay System" htmlFor="careerPaySystem" error={errors.paySystem}>
          <select
            id="careerPaySystem"
            value={form.paySystem}
            onChange={(e) => setField('paySystem', e.target.value as CareerProfile['paySystem'])}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="GS">GS</option>
            <option value="LEO">LEO</option>
            <option value="Title38">Title 38</option>
          </select>
        </FieldGroup>
      </div>

      {errors.events && <p className="text-sm text-red-600 mb-2">{errors.events}</p>}

      <div className="space-y-4">
        {form.events.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
            No career events yet. Click &ldquo;+ Add Career Event&rdquo; below to record your hire, promotions, and step increases.
          </div>
        )}
        {form.events.map((ev, idx) => (
          <div key={ev.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Event {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeEvent(ev.id)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FieldGroup label="Type" htmlFor={`ev-type-${ev.id}`}>
                <select
                  id={`ev-type-${ev.id}`}
                  value={ev.type}
                  onChange={(e) => updateEvent(ev.id, { type: e.target.value as CareerEvent['type'] })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Effective Date" htmlFor={`ev-date-${ev.id}`}>
                <input
                  id={`ev-date-${ev.id}`}
                  type="date"
                  value={ev.effectiveDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    const year = date ? new Date(date).getFullYear() : 2024;
                    const salary = computeSalary(ev.grade, ev.step, ev.localityCode, year);
                    updateEvent(ev.id, { effectiveDate: date, annualSalary: salary });
                  }}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </FieldGroup>

              <FieldGroup label="Grade" htmlFor={`ev-grade-${ev.id}`}>
                <select
                  id={`ev-grade-${ev.id}`}
                  value={ev.grade}
                  onChange={(e) => updateEvent(ev.id, { grade: Number(e.target.value) as CareerEvent['grade'] })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>GS-{g}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Step" htmlFor={`ev-step-${ev.id}`}>
                <select
                  id={`ev-step-${ev.id}`}
                  value={ev.step}
                  onChange={(e) => updateEvent(ev.id, { step: Number(e.target.value) as CareerEvent['step'] })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>Step {s}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Locality" htmlFor={`ev-loc-${ev.id}`}>
                <select
                  id={`ev-loc-${ev.id}`}
                  value={ev.localityCode}
                  onChange={(e) => updateEvent(ev.id, { localityCode: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {LOCALITY_CODES.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Annual Salary ($)" htmlFor={`ev-sal-${ev.id}`} hint="Auto-filled; override if needed">
                <input
                  id={`ev-sal-${ev.id}`}
                  type="number"
                  min="0"
                  step="100"
                  value={ev.annualSalary}
                  onChange={(e) => updateEvent(ev.id, { annualSalary: Number(e.target.value) })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </FieldGroup>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEvent}
        className="mt-3 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
      >
        + Add Career Event
      </button>
    </FormSection>
  );
}
