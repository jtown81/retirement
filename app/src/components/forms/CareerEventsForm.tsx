import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, CareerProfileSchema } from '@storage/index';
import { gradeStepToSalary, applyLocality, getLocalityRate, getAvailableLocalityCodes } from '@modules/career';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@components/ui/alert';
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
      {/* SCD and paySystem are read from FERS Estimate (PersonalInfo) — not entered here */}
      {errors.events && <Alert variant="destructive" className="mb-4"><AlertDescription>{errors.events}</AlertDescription></Alert>}

      <div className="space-y-4">
        {form.events.length === 0 && (
          <Alert className="bg-muted">
            <AlertDescription className="text-center">
              No career events yet. Click &ldquo;+ Add Career Event&rdquo; below to record your hire, promotions, and step increases.
            </AlertDescription>
          </Alert>
        )}
        {form.events.map((ev, idx) => (
          <div key={ev.id} className="border border-border rounded-lg p-4 bg-muted/50 transition-colors hover:border-primary/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Event {idx + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEvent(ev.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FieldGroup label="Type" htmlFor={`ev-type-${ev.id}`}>
                <Select value={ev.type} onValueChange={(value) => updateEvent(ev.id, { type: value as CareerEvent['type'] })}>
                  <SelectTrigger id={`ev-type-${ev.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Effective Date" htmlFor={`ev-date-${ev.id}`}>
                <Input
                  id={`ev-date-${ev.id}`}
                  type="date"
                  value={ev.effectiveDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    const year = date ? new Date(date).getFullYear() : 2024;
                    const salary = computeSalary(ev.grade, ev.step, ev.localityCode, year);
                    updateEvent(ev.id, { effectiveDate: date, annualSalary: salary });
                  }}
                />
              </FieldGroup>

              <FieldGroup label="Grade" htmlFor={`ev-grade-${ev.id}`}>
                <Select value={String(ev.grade)} onValueChange={(value) => updateEvent(ev.id, { grade: Number(value) as CareerEvent['grade'] })}>
                  <SelectTrigger id={`ev-grade-${ev.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((g) => (
                      <SelectItem key={g} value={String(g)}>GS-{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Step" htmlFor={`ev-step-${ev.id}`}>
                <Select value={String(ev.step)} onValueChange={(value) => updateEvent(ev.id, { step: Number(value) as CareerEvent['step'] })}>
                  <SelectTrigger id={`ev-step-${ev.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                      <SelectItem key={s} value={String(s)}>Step {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Locality" htmlFor={`ev-loc-${ev.id}`}>
                <Select value={ev.localityCode} onValueChange={(value) => updateEvent(ev.id, { localityCode: value })}>
                  <SelectTrigger id={`ev-loc-${ev.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALITY_CODES.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Annual Salary ($)" htmlFor={`ev-sal-${ev.id}`} hint="Auto-filled; override if needed">
                <Input
                  id={`ev-sal-${ev.id}`}
                  type="number"
                  min="0"
                  step="100"
                  value={ev.annualSalary}
                  onChange={(e) => updateEvent(ev.id, { annualSalary: Number(e.target.value) })}
                />
              </FieldGroup>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addEvent}
        className="mt-3"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Career Event
      </Button>
    </FormSection>
  );
}
