import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, CareerProfileSchema } from '@storage/index';
import { FormSection } from './FormSection';
import { Button } from '@components/ui/button';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@components/ui/alert';
import { CareerEventItem } from './career/CareerEventItem';
import type { CareerProfile, CareerEvent } from '@fedplan/models';
import type { GSGrade, GSStep } from '@fedplan/models';

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

export function CareerEventsForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.CAREER_PROFILE, CareerProfileSchema);
  const [form, setForm] = useState<CareerProfile>(() =>
    (stored as CareerProfile | null) ?? { id: crypto.randomUUID(), scdLeave: '', scdRetirement: '', paySystem: 'GS' as const, events: [] },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addEvent = () => {
    setForm((prev) => ({ ...prev, events: [...prev.events, makeEmptyEvent()] }));
  };

  const removeEvent = (id: string) => {
    setForm((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
  };

  const updateEvent = (id: string, patch: Partial<CareerEvent>) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev)),
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
          <CareerEventItem
            key={ev.id}
            event={ev}
            index={idx}
            onUpdate={(patch) => updateEvent(ev.id, patch)}
            onRemove={() => removeEvent(ev.id)}
          />
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
