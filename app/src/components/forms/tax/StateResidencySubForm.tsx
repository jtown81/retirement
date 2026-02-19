import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, TaxProfileSchema } from '@storage/index';
import type { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

type TaxProfileModel = z.infer<typeof TaxProfileSchema>;

const CURRENT_YEAR = new Date().getFullYear();

const STATE_OPTIONS = [
  { label: '-- No state income tax --', value: null },
  { label: 'Alabama (AL)', value: 'AL' },
  { label: 'Alaska (AK)', value: 'AK' },
  { label: 'Arizona (AZ)', value: 'AZ' },
  { label: 'Arkansas (AR)', value: 'AR' },
  { label: 'California (CA)', value: 'CA' },
  { label: 'Colorado (CO)', value: 'CO' },
  { label: 'Connecticut (CT)', value: 'CT' },
  { label: 'Delaware (DE)', value: 'DE' },
  { label: 'Florida (FL)', value: 'FL' },
  { label: 'Georgia (GA)', value: 'GA' },
  { label: 'Hawaii (HI)', value: 'HI' },
  { label: 'Idaho (ID)', value: 'ID' },
  { label: 'Illinois (IL)', value: 'IL' },
  { label: 'Indiana (IN)', value: 'IN' },
  { label: 'Iowa (IA)', value: 'IA' },
  { label: 'Kansas (KS)', value: 'KS' },
  { label: 'Kentucky (KY)', value: 'KY' },
  { label: 'Louisiana (LA)', value: 'LA' },
  { label: 'Maine (ME)', value: 'ME' },
  { label: 'Maryland (MD)', value: 'MD' },
  { label: 'Massachusetts (MA)', value: 'MA' },
  { label: 'Michigan (MI)', value: 'MI' },
  { label: 'Minnesota (MN)', value: 'MN' },
  { label: 'Mississippi (MS)', value: 'MS' },
  { label: 'Missouri (MO)', value: 'MO' },
  { label: 'Montana (MT)', value: 'MT' },
  { label: 'Nebraska (NE)', value: 'NE' },
  { label: 'Nevada (NV)', value: 'NV' },
  { label: 'New Hampshire (NH)', value: 'NH' },
  { label: 'New Jersey (NJ)', value: 'NJ' },
  { label: 'New Mexico (NM)', value: 'NM' },
  { label: 'New York (NY)', value: 'NY' },
  { label: 'North Carolina (NC)', value: 'NC' },
  { label: 'North Dakota (ND)', value: 'ND' },
  { label: 'Ohio (OH)', value: 'OH' },
  { label: 'Oklahoma (OK)', value: 'OK' },
  { label: 'Oregon (OR)', value: 'OR' },
  { label: 'Pennsylvania (PA)', value: 'PA' },
  { label: 'Rhode Island (RI)', value: 'RI' },
  { label: 'South Carolina (SC)', value: 'SC' },
  { label: 'South Dakota (SD)', value: 'SD' },
  { label: 'Tennessee (TN)', value: 'TN' },
  { label: 'Texas (TX)', value: 'TX' },
  { label: 'Utah (UT)', value: 'UT' },
  { label: 'Vermont (VT)', value: 'VT' },
  { label: 'Virginia (VA)', value: 'VA' },
  { label: 'Washington (WA)', value: 'WA' },
  { label: 'West Virginia (WV)', value: 'WV' },
  { label: 'Wisconsin (WI)', value: 'WI' },
  { label: 'Wyoming (WY)', value: 'WY' },
  { label: 'District of Columbia (DC)', value: 'DC' },
];

interface StateResidencyFormState {
  stateCode: string; // 'null' for null, or state code
  stateResidencyYear: string;
}

const DEFAULTS: StateResidencyFormState = {
  stateCode: 'null',
  stateResidencyYear: String(CURRENT_YEAR),
};

function formStateFromStored(config: TaxProfileModel | null): StateResidencyFormState {
  if (!config) return DEFAULTS;
  return {
    stateCode: config.stateCode ?? 'null',
    stateResidencyYear: String(config.stateResidencyYear ?? CURRENT_YEAR),
  };
}

const TAX_DEFAULTS: Partial<TaxProfileModel> = {
  filingStatus: 'single',
  stateCode: null,
  stateResidencyYear: CURRENT_YEAR,
  deductionStrategy: 'standard',
  modelIrmaa: false,
};

export function StateResidencySubForm() {
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.TAX_PROFILE, TaxProfileSchema);

  const [form, setForm] = useState<StateResidencyFormState>(() => formStateFromStored(storedConfig));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const selectedState = STATE_OPTIONS.find(s => (s.value ?? 'null') === form.stateCode);
  const hasStateTax = form.stateCode !== 'null';

  const handleSave = () => {
    const saved = storedConfig ?? {};
    const stateCode = form.stateCode === 'null' ? null : form.stateCode;
    const merged = {
      ...TAX_DEFAULTS,
      ...saved,
      stateCode,
      stateResidencyYear: Number(form.stateResidencyYear),
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
    if (window.confirm('Clear state residency settings? This cannot be undone.')) {
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
      title="State Residency"
      description="Configure your state of residency for state income tax calculations."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      {/* ── State Code ────────────────────────────────────────────────────── */}
      <FieldGroup label="State of Residency" htmlFor="state-code" error={errors.stateCode}
        hint="Used for state income tax calculations. Select 'No state income tax' if you reside in a non-income-tax state or are a nomad.">
        <Select value={form.stateCode} onValueChange={(value) => {
          setForm((prev) => ({ ...prev, stateCode: value }));
        }}>
          <SelectTrigger id="state-code">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {STATE_OPTIONS.map((option) => (
              <SelectItem key={option.value ?? 'null'} value={option.value ?? 'null'}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {/* ── State Residency Year ───────────────────────────────────────── */}
      {hasStateTax && (
        <FieldGroup label="State Residency Year" htmlFor="state-year" error={errors.stateResidencyYear}
          hint="The year you established residency in this state. Used to determine tax residence.">
          <Input
            id="state-year"
            type="number"
            min="1900"
            max={CURRENT_YEAR}
            step="1"
            value={form.stateResidencyYear}
            onChange={(e) => setForm((prev) => ({ ...prev, stateResidencyYear: e.target.value }))}
          />
        </FieldGroup>
      )}

      {selectedState && (
        <div className="rounded-md border border-border bg-muted p-3">
          <p className="text-sm font-medium text-foreground">
            Selected: {selectedState.label}
          </p>
          {hasStateTax && (
            <p className="text-xs text-muted-foreground mt-1">
              Resident since {form.stateResidencyYear}
            </p>
          )}
        </div>
      )}
    </FormSection>
  );
}
