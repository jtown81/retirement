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
  fundG: string;
  fundF: string;
  fundC: string;
  fundS: string;
  fundI: string;
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
  fundG: '20',
  fundF: '20',
  fundC: '20',
  fundS: '20',
  fundI: '20',
};

function formStateFromStored(fers: FERSEstimate | null, snapshot?: any): TSPFormState {
  // Load fund allocations from latest snapshot if available
  const fundAllocMap = new Map((snapshot?.fundAllocations ?? []).map((a: any) => [a.fund, a.percentage * 100]));

  return {
    currentTspBalance: fers ? String(fers.currentTspBalance) : '0',
    traditionalTspBalance: fers?.traditionalTspBalance != null ? String(fers.traditionalTspBalance) : '',
    rothTspBalance: fers?.rothTspBalance != null ? String(fers.rothTspBalance) : '',
    traditionalContribPct: fers?.traditionalContribPct != null ? String(fers.traditionalContribPct * 100) : '5',
    rothContribPct: fers?.rothContribPct != null ? String(fers.rothContribPct * 100) : '0',
    catchUpEligible: fers?.catchUpEligible ?? false,
    agencyMatchTrueUp: fers?.agencyMatchTrueUp ?? false,
    tspGrowthRate: fers ? parseFloat((fers.tspGrowthRate * 100).toFixed(2)) + '' : '7',
    withdrawalRate: fers ? String(fers.withdrawalRate * 100) : '4',
    withdrawalStartAge: fers ? String(fers.withdrawalStartAge) : '62',
    oneTimeWithdrawalAmount: fers?.oneTimeWithdrawalAmount != null ? String(fers.oneTimeWithdrawalAmount) : '',
    oneTimeWithdrawalAge: fers?.oneTimeWithdrawalAge != null ? String(fers.oneTimeWithdrawalAge) : '',
    fundG: String(fundAllocMap.get('G') ?? 20),
    fundF: String(fundAllocMap.get('F') ?? 20),
    fundC: String(fundAllocMap.get('C') ?? 20),
    fundS: String(fundAllocMap.get('S') ?? 20),
    fundI: String(fundAllocMap.get('I') ?? 20),
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
    if (hasStoredData) {
      const latestSnapshot = Array.isArray(storedSnapshots) && storedSnapshots.length > 0
        ? storedSnapshots[storedSnapshots.length - 1]
        : undefined;
      return formStateFromStored(storedFERS, latestSnapshot);
    }
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

    // Validate fund allocations sum (warning, not blocking)
    const fundTotal = num(form.fundG) + num(form.fundF) + num(form.fundC) + num(form.fundS) + num(form.fundI);
    if (Math.abs(fundTotal - 100) > 0.1) {
      console.warn(`Fund allocations sum to ${fundTotal.toFixed(1)}% instead of 100%`);
    }

    // Save TSP balance as snapshot
    const asOfDate = new Date().toISOString().slice(0, 10);
    const traditionalBal =
      optNum(form.traditionalTspBalance) ??
      Math.max(0, num(form.currentTspBalance) - (optNum(form.rothTspBalance) ?? 0));
    const snapshots = Array.isArray(storedSnapshots) ? storedSnapshots : [];

    // Build fund allocations array
    const fundAllocations = [
      { fund: 'G' as const, percentage: num(form.fundG) / 100 },
      { fund: 'F' as const, percentage: num(form.fundF) / 100 },
      { fund: 'C' as const, percentage: num(form.fundC) / 100 },
      { fund: 'S' as const, percentage: num(form.fundS) / 100 },
      { fund: 'I' as const, percentage: num(form.fundI) / 100 },
    ].filter((f) => f.percentage > 0);

    const newSnapshot = {
      id: `snapshot-${asOfDate}`,
      asOf: asOfDate,
      source: 'manual' as const,
      traditionalBalance: traditionalBal,
      rothBalance: optNum(form.rothTspBalance) ?? 0,
      fundAllocations,
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
          hint="Annual rate, e.g. 7.00">
          <Input
            id="fe-tspGrowth"
            type="number"
            min="0"
            max="100"
            step="0.01"
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
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Agency Match Summary</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">Your Contribution</div>
                <div className="font-semibold">{total.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">({trad.toFixed(1)}% Trad + {roth.toFixed(1)}% Roth)</div>
              </div>
              <div>
                <div className="text-muted-foreground">Auto (1%)</div>
                <div className="font-semibold">1.0%</div>
                <div className="text-xs text-muted-foreground">Traditional</div>
              </div>
              <div>
                <div className="text-muted-foreground">Match (up to 4%)</div>
                <div className="font-semibold">{(maxAgency - 1).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Traditional</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Possible</div>
                <div className="font-semibold">{(total + maxAgency).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">of salary</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Agency match (auto + match) always goes to Traditional TSP, regardless of your Roth election.
            </p>
          </div>
        );
      })()}
      {/* Fund Allocation Section */}
      <div className="mt-6 pt-6 border-t border-border">
        <h3 className="text-sm font-semibold mb-3">Fund Allocation</h3>
        <p className="text-xs text-muted-foreground mb-3">Allocate contributions across TSP investment funds (total must equal 100%):</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <FieldGroup label="Government (G)" htmlFor="fe-fundG" error={errors.fundG}>
            <Input
              id="fe-fundG"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.fundG}
              onChange={(e) => set('fundG', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Fixed Income (F)" htmlFor="fe-fundF" error={errors.fundF}>
            <Input
              id="fe-fundF"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.fundF}
              onChange={(e) => set('fundF', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Common (C)" htmlFor="fe-fundC" error={errors.fundC}>
            <Input
              id="fe-fundC"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.fundC}
              onChange={(e) => set('fundC', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Small Cap (S)" htmlFor="fe-fundS" error={errors.fundS}>
            <Input
              id="fe-fundS"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.fundS}
              onChange={(e) => set('fundS', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Intl Stock (I)" htmlFor="fe-fundI" error={errors.fundI}>
            <Input
              id="fe-fundI"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.fundI}
              onChange={(e) => set('fundI', e.target.value)}
            />
          </FieldGroup>
        </div>
        {(() => {
          const toNum = (s: string) => (s === '' ? 0 : Number(s));
          const total = toNum(form.fundG) + toNum(form.fundF) + toNum(form.fundC) + toNum(form.fundS) + toNum(form.fundI);
          const remainder = Math.max(0, 100 - total);
          return (
            <div className="text-xs text-muted-foreground mt-2">
              Total allocated: {total.toFixed(1)}% • Lifecycle (L): {remainder.toFixed(1)}%
            </div>
          );
        })()}
      </div>

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
