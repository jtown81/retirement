import { FieldGroup } from '../FieldGroup';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import { Trash2 } from 'lucide-react';
import type { CareerEvent } from '@fedplan/models';
import { gradeStepToSalary, applyLocality, getLocalityRate, getAvailableLocalityCodes } from '@fedplan/career';

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

interface CareerEventItemProps {
  event: CareerEvent;
  index: number;
  onUpdate: (patch: Partial<CareerEvent>) => void;
  onRemove: () => void;
}

function computeSalary(grade: number, step: number, localityCode: string, year: number): number {
  const base = gradeStepToSalary(grade, step, year);
  const rate = getLocalityRate(localityCode, year);
  return Math.round(applyLocality(base, rate));
}

export function CareerEventItem({ event, index, onUpdate, onRemove }: CareerEventItemProps) {
  const handleDateChange = (date: string) => {
    const year = date ? new Date(date).getFullYear() : 2024;
    const salary = computeSalary(event.grade, event.step, event.localityCode, year);
    onUpdate({ effectiveDate: date, annualSalary: salary });
  };

  const handleGradeChange = (value: string) => {
    const grade = Number(value) as CareerEvent['grade'];
    const year = event.effectiveDate ? new Date(event.effectiveDate).getFullYear() : 2024;
    const salary = computeSalary(grade, event.step, event.localityCode, year);
    onUpdate({ grade, annualSalary: salary });
  };

  const handleStepChange = (value: string) => {
    const step = Number(value) as CareerEvent['step'];
    const year = event.effectiveDate ? new Date(event.effectiveDate).getFullYear() : 2024;
    const salary = computeSalary(event.grade, step, event.localityCode, year);
    onUpdate({ step, annualSalary: salary });
  };

  const handleLocalityChange = (value: string) => {
    const year = event.effectiveDate ? new Date(event.effectiveDate).getFullYear() : 2024;
    const salary = computeSalary(event.grade, event.step, value, year);
    onUpdate({ localityCode: value, annualSalary: salary });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ annualSalary: Number(e.target.value) });
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/50 transition-colors hover:border-primary/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Event {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Remove
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <FieldGroup label="Type" htmlFor={`ev-type-${event.id}`}>
          <Select value={event.type} onValueChange={(value) => onUpdate({ type: value as CareerEvent['type'] })}>
            <SelectTrigger id={`ev-type-${event.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Effective Date" htmlFor={`ev-date-${event.id}`}>
          <Input
            id={`ev-date-${event.id}`}
            type="date"
            value={event.effectiveDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </FieldGroup>

        <FieldGroup label="Grade" htmlFor={`ev-grade-${event.id}`}>
          <Select value={String(event.grade)} onValueChange={handleGradeChange}>
            <SelectTrigger id={`ev-grade-${event.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((g) => (
                <SelectItem key={g} value={String(g)}>GS-{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Step" htmlFor={`ev-step-${event.id}`}>
          <Select value={String(event.step)} onValueChange={handleStepChange}>
            <SelectTrigger id={`ev-step-${event.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                <SelectItem key={s} value={String(s)}>Step {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Locality" htmlFor={`ev-loc-${event.id}`}>
          <Select value={event.localityCode} onValueChange={handleLocalityChange}>
            <SelectTrigger id={`ev-loc-${event.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALITY_CODES.map((code) => (
                <SelectItem key={code} value={code}>{code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Annual Salary ($)" htmlFor={`ev-sal-${event.id}`} hint="Auto-filled; override if needed">
          <Input
            id={`ev-sal-${event.id}`}
            type="number"
            min="0"
            step="100"
            value={event.annualSalary}
            onChange={handleSalaryChange}
          />
        </FieldGroup>
      </div>
    </div>
  );
}
