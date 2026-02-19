import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, FERSEstimateSchema, TSPContributionEventSchema, TSPAccountSnapshotSchema } from '@storage/index';
import type { TSPContributionEvent } from '@models/tsp';
import { z } from 'zod';
import { FieldGroup } from '../FieldGroup';
import { FormSection } from '../FormSection';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import defaultInputs from '@data/default-inputs.json';

type FERSEstimate = z.infer<typeof FERSEstimateSchema>;

interface TSPFormState {
  currentTspBalance: string;
  traditionalTspBalance: string;
  rothTspBalance: string;
  traditionalContribPct: string;
  rothContribPct: string;
  catchUpEligible: boolean;
  agencyMatchTrueUp: boolean;
  tspGrowthRate: string;
  withdrawalRate: string;
  withdrawalStartAge: string;
  oneTimeWithdrawalAmount: string;
  oneTimeWithdrawalAge: string;
}

const DEFAULTS: TSPFormState = {
  currentTspBalance: '0',
  traditionalTspBalance: '',
  rothTspBalance: '',
  traditionalContribPct: '5',
  rothContribPct: '0',
  catchUpEligible: false,
  agencyMatchTrueUp: false,
  tspGrowthRate: '7',
  withdrawalRate: '4',
  withdrawalStartAge: '62',
  oneTimeWithdrawalAmount: '',
  oneTimeWithdrawalAge: '',
};

function formStateFromStored(fers: FERSEstimate | null): TSPFormState {
  return {
    currentTspBalance: fers ? String(fers.currentTspBalance) : '0',
    traditionalTspBalance: fers?.traditionalTspBalance != null ? String(fers.traditionalTspBalance) : '',
    rothTspBalance: fers?.rothTspBalance != null ? String(fers.rothTspBalance) : '',
    traditionalContribPct: fers?.traditionalContribPct != null ? String(fers.traditionalContribPct * 100) : '5',
    rothContribPct: fers?.rothContribPct != null ? String(fers.rothContribPct * 100) : '0',
    catchUpEligible: fers?.catchUpEligible ?? false,
    agencyMatchTrueUp: fers?.agencyMatchTrueUp ?? false,
    tspGrowthRate: fers ? String(fers.tspGrowthRate * 100) : '7',
    withdrawalRate: fers ? String(fers.withdrawalRate * 100) : '4',
    withdrawalStartAge: fers ? String(fers.withdrawalStartAge) : '62',
    oneTimeWithdrawalAmount: fers?.oneTimeWithdrawalAmount != null ? String(fers.oneTimeWithdrawalAmount) : '',
    oneTimeWithdrawalAge: fers?.oneTimeWithdrawalAge != null ? String(fers.oneTimeWithdrawalAge) : '',
  };
}

function loadFromDefaults(): TSPFormState {
  return { ...DEFAULTS, ...(defaultInputs as Partial<TSPFormState>) };
}

const TSPContributionListSchema = z.array(TSPContributionEventSchema);
const TSPSnapshotListSchema = z.array(TSPAccountSnapshotSchema);

export function TSPSubForm() {
  const [storedFERS, saveFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [storedSnapshots, saveSnapshots] = useLocalStorage(STORAGE_KEYS.TSP_SNAPSHOTS, TSPSnapshotListSchema);
  const [, saveTSPContributions] = useLocalStorage(STORAGE_KEYS.TSP_CONTRIBUTIONS, TSPContributionListSchema);
  const [form, setForm] = useState<TSPFormState>(() => {
    const hasStoredData = storedFERS !== null;
    if (hasStoredData) return formStateFromStored(storedFERS);
    return loadFromDefaults();
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  const set = (key: keyof TSPFormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const num = (s: string) => (s === '' ? 0 : Number(s));
    const optNum = (s: string) => (s === '' ? undefined : Number(s));

    const newErrors: Record<string, string> = {};

    // Validate numeric fields
    if (isNaN(Number(form.currentTspBalance)) || Number(form.currentTspBalance) < 0) {
      newErrors.currentTspBalance = 'Must be a non-negative number';
    }
    if (form.traditionalTspBalance !== '' && (isNaN(Number(form.traditionalTspBalance)) || Number(form.traditionalTspBalance) < 0)) {
      newErrors.traditionalTspBalance = 'Must be a non-negative number';
    }
    if (form.rothTspBalance !== '' && (isNaN(Number(form.rothTspBalance)) || Number(form.rothTspBalance) < 0)) {
      newErrors.rothTspBalance = 'Must be a non-negative number';
    }
    if (isNaN(Number(form.traditionalContribPct)) || Number(form.traditionalContribPct) < 0 || Number(form.traditionalContribPct) > 100) {
      newErrors.traditionalContribPct = 'Must be between 0 and 100';
    }
    if (isNaN(Number(form.rothContribPct)) || Number(form.rothContribPct) < 0 || Number(form.rothContribPct) > 100) {
      newErrors.rothContribPct = 'Must be between 0 and 100';
    }
    if (isNaN(Number(form.tspGrowthRate)) || Number(form.tspGrowthRate) < 0 || Number(form.tspGrowthRate) > 100) {
      newErrors.tspGrowthRate = 'Must be between 0 and 100';
    }
    if (isNaN(Number(form.withdrawalRate)) || Number(form.withdrawalRate) < 0 || Number(form.withdrawalRate) > 100) {
      newErrors.withdrawalRate = 'Must be between 0 and 100';
    }
    if (isNaN(Number(form.withdrawalStartAge)) || Number(form.withdrawalStartAge) < 50 || Number(form.withdrawalStartAge) > 90) {
      newErrors.withdrawalStartAge = 'Must be between 50 and 90';
    }
    if (form.oneTimeWithdrawalAmount !== '' && (isNaN(Number(form.oneTimeWithdrawalAmount)) || Number(form.oneTimeWithdrawalAmount) < 0)) {
      newErrors.oneTimeWithdrawalAmount = 'Must be a non-negative number';
    }
    if (form.oneTimeWithdrawalAge !== '' && (isNaN(Number(form.oneTimeWithdrawalAge)) || Number(form.oneTimeWithdrawalAge) < 50 || Number(form.oneTimeWithdrawalAge) > 90)) {
      newErrors.oneTimeWithdrawalAge = 'Must be between 50 and 90';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Merge TSP fields into FERS_ESTIMATE
    const merged = FERSEstimateSchema.parse({
      retirementAgeOption: storedFERS?.retirementAgeOption ?? 'custom',
      retirementDate: storedFERS?.retirementDate ?? '',
      gsGrade: storedFERS?.gsGrade,
      gsStep: storedFERS?.gsStep,
      localityCode: storedFERS?.localityCode ?? 'RUS',
      annualRaiseRate: storedFERS?.annualRaiseRate ?? 0.02,
      high3Override: storedFERS?.high3Override,
      sickLeaveHours: storedFERS?.sickLeaveHours ?? 0,
      annuityReductionPct: storedFERS?.annuityReductionPct ?? 0,
      ssaBenefitAt62: storedFERS?.ssaBenefitAt62,
      annualEarnings: storedFERS?.annualEarnings,
      currentTspBalance: num(form.currentTspBalance),
      traditionalTspBalance: optNum(form.traditionalTspBalance),
      rothTspBalance: optNum(form.rothTspBalance),
      traditionalContribPct: num(form.traditionalContribPct) / 100,
      rothContribPct: num(form.rothContribPct) / 100,
      catchUpEligible: form.catchUpEligible,
      agencyMatchTrueUp: form.agencyMatchTrueUp,
      tspGrowthRate: num(form.tspGrowthRate) / 100,
      withdrawalRate: num(form.withdrawalRate) / 100,
      withdrawalStartAge: num(form.withdrawalStartAge),
      oneTimeWithdrawalAmount: optNum(form.oneTimeWithdrawalAmount),
      oneTimeWithdrawalAge: optNum(form.oneTimeWithdrawalAge),
    });
    saveFERS(merged);

    // Save TSP balance as snapshot
    const asOfDate = new Date().toISOString().slice(0, 10);
    const traditionalBal =
      optNum(form.traditionalTspBalance) ??
      Math.max(0, num(form.currentTspBalance) - (optNum(form.rothTspBalance) ?? 0));
    const snapshots = Array.isArray(storedSnapshots) ? storedSnapshots : [];
    const newSnapshot = {
      id: `snapshot-${asOfDate}`,
      asOf: asOfDate,
      source: 'manual' as const,
      traditionalBalance: traditionalBal,
      rothBalance: optNum(form.rothTspBalance) ?? 0,
      fundAllocations: [] as any[],
      notes: 'Created from FERS Estimate form',
    };
    const updated = snapshots.filter((s) => s.asOf !== asOfDate);
    updated.push(newSnapshot);
    saveSnapshots(updated);

    // Save TSP Contribution Event with separate Traditional/Roth percentages
    const tspContribution: TSPContributionEvent = {
      id: 'primary-contribution',
      effectiveDate: new Date().toISOString().slice(0, 10),
      employeeTraditionalPct: num(form.traditionalContribPct) / 100,
      employeeRothPct: num(form.rothContribPct) / 100,
      catchUpEnabled: form.catchUpEligible ?? false,
      agencyMatchTrueUp: form.agencyMatchTrueUp,
    };
    saveTSPContributions([tspContribution]);
  };

  const handleClear = () => {
    if (window.confirm('Clear TSP data?')) {
      setForm(DEFAULTS);
      setErrors({});
    }
  };

  const handleLoadDefaults = () => {
    const defaults = loadFromDefaults();
    setForm(defaults);
    setErrors({});
  };

  return (
    <FormSection
      title="TSP"
      description="Enter your TSP balances, contribution rates, growth rate, and withdrawal strategy."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="Total TSP Balance ($)" htmlFor="fe-tspBalance" error={errors.currentTspBalance}
          hint="Combined Traditional + Roth">
          <Input
            id="fe-tspBalance"
            type="number"
            min="0"
            step="1"
            value={form.currentTspBalance}
            onChange={(e) => set('currentTspBalance', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Traditional Balance ($)" htmlFor="fe-tspTrad" error={errors.traditionalTspBalance}
          hint="Optional breakdown">
          <Input
            id="fe-tspTrad"
            type="number"
            min="0"
            step="1"
            placeholder="Optional"
            value={form.traditionalTspBalance}
            onChange={(e) => set('traditionalTspBalance', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Roth Balance ($)" htmlFor="fe-tspRoth" error={errors.rothTspBalance}
          hint="Optional breakdown">
          <Input
            id="fe-tspRoth"
            type="number"
            min="0"
            step="1"
            placeholder="Optional"
            value={form.rothTspBalance}
            onChange={(e) => set('rothTspBalance', e.target.value)}
          />
        </FieldGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FieldGroup label="Traditional Contribution (%)" htmlFor="fe-tradContrib" error={errors.traditionalContribPct}
          hint="% of gross pay to Traditional">
          <Input
            id="fe-tradContrib"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={form.traditionalContribPct}
            onChange={(e) => set('traditionalContribPct', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Roth Contribution (%)" htmlFor="fe-rothContrib" error={errors.rothContribPct}
          hint="% of gross pay to Roth">
          <Input
            id="fe-rothContrib"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={form.rothContribPct}
            onChange={(e) => set('rothContribPct', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Growth Rate (%)" htmlFor="fe-tspGrowth" error={errors.tspGrowthRate}
          hint="Annual rate, e.g. 7">
          <Input
            id="fe-tspGrowth"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.tspGrowthRate}
            onChange={(e) => set('tspGrowthRate', e.target.value)}
          />
        </FieldGroup>
      </div>
      {(() => {
        const trad = Number(form.traditionalContribPct) || 0;
        const roth = Number(form.rothContribPct) || 0;
        const total = trad + roth;
        const maxAgency = Math.min(total, 5);
        return (
          <p className="text-xs text-muted-foreground">
            Employee: {trad}% Traditional + {roth}% Roth = {total}% total.{' '}
            Agency match: up to {maxAgency.toFixed(1)}% (always Traditional). Grand total: up to {(total + maxAgency).toFixed(1)}% of salary.
          </p>
        );
      })()}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="fe-catchup"
            checked={form.catchUpEligible}
            onCheckedChange={(checked) => set('catchUpEligible', !!checked)}
          />
          <label htmlFor="fe-catchup" className="text-sm cursor-pointer">
            Catch-up eligible (age 50+)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="fe-trueup"
            checked={form.agencyMatchTrueUp}
            onCheckedChange={(checked) => set('agencyMatchTrueUp', !!checked)}
          />
          <label htmlFor="fe-trueup" className="text-sm cursor-pointer">
            <span>Agency match true-up</span>
            <span className="text-xs text-gray-500 ml-1">(restores match if 402(g) cap hit mid-year)</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Withdrawal Rate (%)" htmlFor="fe-withdrawRate" error={errors.withdrawalRate}
          hint="Annual rate, e.g. 4">
          <Input
            id="fe-withdrawRate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.withdrawalRate}
            onChange={(e) => set('withdrawalRate', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="Start Age" htmlFor="fe-withdrawAge" error={errors.withdrawalStartAge}>
          <Input
            id="fe-withdrawAge"
            type="number"
            min="50"
            max="90"
            step="1"
            value={form.withdrawalStartAge}
            onChange={(e) => set('withdrawalStartAge', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="One-Time Withdrawal ($)" htmlFor="fe-oneTimeAmt" error={errors.oneTimeWithdrawalAmount}
          hint="Optional lump sum">
          <Input
            id="fe-oneTimeAmt"
            type="number"
            min="0"
            step="1"
            placeholder=""
            value={form.oneTimeWithdrawalAmount}
            onChange={(e) => set('oneTimeWithdrawalAmount', e.target.value)}
          />
        </FieldGroup>
        <FieldGroup label="One-Time Withdrawal Age" htmlFor="fe-oneTimeAge" error={errors.oneTimeWithdrawalAge}>
          <Input
            id="fe-oneTimeAge"
            type="number"
            min="50"
            max="90"
            step="1"
            placeholder=""
            value={form.oneTimeWithdrawalAge}
            onChange={(e) => set('oneTimeWithdrawalAge', e.target.value)}
          />
        </FieldGroup>
      </div>
    </FormSection>
  );
}
