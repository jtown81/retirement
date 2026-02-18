import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, TaxProfileSchema } from '@storage/index';
import { getStandardDeduction } from '@modules/tax';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Alert, AlertDescription } from '@components/ui/alert';
import type { TaxProfile, FilingStatus } from '@models/tax';

const CURRENT_YEAR = new Date().getFullYear();

const FILING_STATUS_OPTIONS: { label: string; value: FilingStatus }[] = [
  { label: 'Single', value: 'single' },
  { label: 'Married Filing Jointly', value: 'married-joint' },
  { label: 'Married Filing Separately', value: 'married-separate' },
  { label: 'Head of Household', value: 'head-of-household' },
];

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

function makeDefaults(): TaxProfile {
  return {
    filingStatus: 'single',
    stateCode: null,
    stateResidencyYear: CURRENT_YEAR,
    deductionStrategy: 'standard',
    modelIrmaa: false,
  };
}

function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function getStandardDeductionAmount(filingStatus: FilingStatus, year: number): number {
  try {
    return getStandardDeduction(year, filingStatus);
  } catch {
    return 0;
  }
}

export function TaxProfileForm() {
  const [stored, save, remove] = useLocalStorage(STORAGE_KEYS.TAX_PROFILE, TaxProfileSchema);
  const [form, setForm] = useState<TaxProfile>(() => stored ?? makeDefaults());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const standardDeductionAmount = getStandardDeductionAmount(form.filingStatus, CURRENT_YEAR);

  const handleSave = () => {
    const result = TaxProfileSchema.safeParse(form);
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
    if (window.confirm('Clear tax profile data? This cannot be undone.')) {
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
      title="Tax Profile"
      description="Configure your filing status, state residency, deduction strategy, and Medicare IRMAA modeling."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleResetDefaults}
    >
      {/* ── Filing Status ────────────────────────────────────────────── */}
      <FieldGroup label="Filing Status" htmlFor="filingStatus" error={errors.filingStatus}>
        <Select value={form.filingStatus} onValueChange={(value) => {
          setForm((prev) => ({ ...prev, filingStatus: value as FilingStatus }));
        }}>
          <SelectTrigger id="filingStatus">
            <SelectValue placeholder="Select filing status" />
          </SelectTrigger>
          <SelectContent>
            {FILING_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {/* ── Standard Deduction Display ────────────────────────────── */}
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
        <p className="text-sm font-medium text-foreground">
          Standard Deduction {CURRENT_YEAR}
        </p>
        <p className="text-lg font-bold text-primary">
          {formatUSD(standardDeductionAmount)}
        </p>
      </div>

      {/* ── State ────────────────────────────────────────────────────── */}
      <FieldGroup label="State of Residency" htmlFor="stateCode" error={errors.stateCode}
        hint="Used for state income tax calculations. Select 'No state income tax' if you reside in a non-income-tax state or are a nomad.">
        <Select value={form.stateCode ?? 'null'} onValueChange={(value) => {
          setForm((prev) => ({ ...prev, stateCode: value === 'null' ? null : value }));
        }}>
          <SelectTrigger id="stateCode">
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

      {/* ── Deduction Strategy ───────────────────────────────────────── */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Deduction Strategy
        </label>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={form.deductionStrategy === 'standard' ? 'default' : 'outline'}
            onClick={() => setForm((prev) => ({ ...prev, deductionStrategy: 'standard' }))}
            className="text-sm"
          >
            Standard ({formatUSD(standardDeductionAmount)})
          </Button>
          <Button
            variant={form.deductionStrategy !== 'standard' ? 'default' : 'outline'}
            onClick={() => setForm((prev) => ({ ...prev, deductionStrategy: 15000 }))}
            className="text-sm"
          >
            Itemized
          </Button>
        </div>

        {form.deductionStrategy !== 'standard' && (
          <div className="mt-3">
            <FieldGroup label="Itemized Deduction Amount ($)" htmlFor="itemizedAmount">
              <Input
                id="itemizedAmount"
                type="number"
                min="0"
                step="100"
                value={typeof form.deductionStrategy === 'number' ? form.deductionStrategy : 0}
                onChange={(e) => setForm((prev) => ({ ...prev, deductionStrategy: Number(e.target.value) }))}
              />
            </FieldGroup>
          </div>
        )}
      </div>

      {/* ── IRMAA Modeling ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="model-irmaa"
            checked={form.modelIrmaa}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, modelIrmaa: !!checked }))}
          />
          <label htmlFor="model-irmaa" className="text-sm cursor-pointer">
            Model Medicare IRMAA surcharges (age 65+)
          </label>
        </div>
        {form.modelIrmaa && (
          <Alert className="mt-2">
            <AlertDescription className="text-xs">
              When enabled, projected income at age 65+ will be checked against IRMAA thresholds, and Part B/D premiums will be adjusted accordingly.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {errors.modelIrmaa && <Alert variant="destructive"><AlertDescription>{errors.modelIrmaa}</AlertDescription></Alert>}
    </FormSection>
  );
}
