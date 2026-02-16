import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, PersonalInfoSchema, FERSEstimateSchema, TSPBalancesSchema, LeaveBalanceSchema } from '@storage/index';
import { getAvailableLocalityCodes } from '@data/locality-rates';
import { getMRA } from '@modules/simulation/eligibility';
import type { LeaveBalance } from '@models/leave';
import { FieldGroup } from './FieldGroup';
import { FormSection } from './FormSection';
import { FERSEstimateResults } from './FERSEstimateResults';
import { useFERSEstimate, type FERSEstimateInput } from './useFERSEstimate';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Checkbox } from '@components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@components/ui/collapsible';
import { ChevronDown, User, DollarSign, Shield, Building2, PiggyBank, ArrowDownToLine } from 'lucide-react';
import type { z } from 'zod';
import defaultInputs from '@data/default-inputs.json';

const LOCALITY_CODES = getAvailableLocalityCodes(new Date().getFullYear());
const GS_GRADES = Array.from({ length: 15 }, (_, i) => i + 1);
const GS_STEPS = Array.from({ length: 10 }, (_, i) => i + 1);

type RetirementAgeOption = 'MRA' | '60' | '62' | 'custom';

function computeRetirementDate(birthDate: string, option: RetirementAgeOption): string {
  if (!birthDate || option === 'custom') return '';
  const d = new Date(birthDate + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const birthYear = d.getFullYear();
  if (option === 'MRA') {
    const mra = getMRA(birthYear);
    d.setFullYear(d.getFullYear() + mra.years);
    d.setMonth(d.getMonth() + mra.months);
  } else {
    d.setFullYear(d.getFullYear() + Number(option));
  }
  return d.toISOString().slice(0, 10);
}


type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
type FERSEstimate = z.infer<typeof FERSEstimateSchema>;

interface FormState extends PersonalInfo {
  retirementAgeOption: RetirementAgeOption;
  retirementDate: string;
  gsGrade: string;
  gsStep: string;
  localityCode: string;
  annualRaiseRate: string;
  high3Override: string;
  sickLeaveHours: string;
  averageAnnualSickLeaveUsage: string;
  annuityReductionPct: string;
  ssaBenefitAt62: string;
  annualEarnings: string;
  currentTspBalance: string;
  traditionalTspBalance: string;
  rothTspBalance: string;
  biweeklyTspContribution: string;
  isRothContribution: boolean;
  catchUpEligible: boolean;
  tspGrowthRate: string;
  withdrawalRate: string;
  withdrawalStartAge: string;
  oneTimeWithdrawalAmount: string;
  oneTimeWithdrawalAge: string;
}

const DEFAULTS: FormState = {
  birthDate: '',
  scdLeave: '',
  scdRetirement: '',
  paySystem: 'GS',
  retirementAgeOption: 'custom',
  retirementDate: '',
  gsGrade: '',
  gsStep: '',
  localityCode: 'RUS',
  annualRaiseRate: '2',
  high3Override: '',
  sickLeaveHours: '0',
  averageAnnualSickLeaveUsage: '0',
  annuityReductionPct: '0',
  ssaBenefitAt62: '',
  annualEarnings: '',
  currentTspBalance: '0',
  traditionalTspBalance: '',
  rothTspBalance: '',
  biweeklyTspContribution: '0',
  isRothContribution: false,
  catchUpEligible: false,
  tspGrowthRate: '7',
  withdrawalRate: '4',
  withdrawalStartAge: '62',
  oneTimeWithdrawalAmount: '',
  oneTimeWithdrawalAge: '',
};

const DRAFT_KEY = 'retire:fers-form-draft';

function loadDraft(): FormState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Merge with DEFAULTS to handle any missing keys from older drafts
    return { ...DEFAULTS, ...parsed };
  } catch {
    return null;
  }
}

function saveDraft(form: FormState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch { /* quota exceeded — ignore */ }
}

function removeDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}

/** Build a FormState from the JSON defaults file, computing derived fields. */
function loadFromDefaults(): FormState {
  const d = { ...DEFAULTS, ...(defaultInputs as Partial<FormState>) };
  // Compute retirement date if age option + birthDate are set
  if (d.retirementAgeOption !== 'custom' && d.birthDate) {
    d.retirementDate = computeRetirementDate(d.birthDate, d.retirementAgeOption);
  }
  // Sync scdLeave
  if (d.scdRetirement && !d.scdLeave) {
    d.scdLeave = d.scdRetirement;
  }
  return d;
}

function formStateFromStored(personal: PersonalInfo | null, fers: FERSEstimate | null, leaveBalance: LeaveBalance | null = null): FormState {
  return {
    birthDate: personal?.birthDate ?? '',
    scdLeave: personal?.scdLeave ?? '',
    scdRetirement: personal?.scdRetirement ?? '',
    paySystem: personal?.paySystem ?? 'GS',
    retirementAgeOption: (fers?.retirementAgeOption as RetirementAgeOption) ?? 'custom',
    retirementDate: fers?.retirementDate ?? '',
    gsGrade: fers?.gsGrade != null ? String(fers.gsGrade) : '',
    gsStep: fers?.gsStep != null ? String(fers.gsStep) : '',
    localityCode: fers?.localityCode ?? 'RUS',
    annualRaiseRate: fers?.annualRaiseRate != null ? String(fers.annualRaiseRate * 100) : '2',
    high3Override: fers?.high3Override != null ? String(fers.high3Override) : '',
    sickLeaveHours: fers ? String(fers.sickLeaveHours) : '0',
    averageAnnualSickLeaveUsage: leaveBalance?.averageAnnualSickLeaveUsage != null ? String(leaveBalance.averageAnnualSickLeaveUsage) : '0',
    annuityReductionPct: fers ? String(fers.annuityReductionPct * 100) : '0',
    ssaBenefitAt62: fers?.ssaBenefitAt62 != null ? String(fers.ssaBenefitAt62) : '',
    annualEarnings: fers?.annualEarnings != null ? String(fers.annualEarnings) : '',
    currentTspBalance: fers ? String(fers.currentTspBalance) : '0',
    traditionalTspBalance: fers?.traditionalTspBalance != null ? String(fers.traditionalTspBalance) : '',
    rothTspBalance: fers?.rothTspBalance != null ? String(fers.rothTspBalance) : '',
    biweeklyTspContribution: fers ? String(fers.biweeklyTspContribution) : '0',
    isRothContribution: fers?.isRothContribution ?? false,
    catchUpEligible: fers?.catchUpEligible ?? false,
    tspGrowthRate: fers ? String(fers.tspGrowthRate * 100) : '7',
    withdrawalRate: fers ? String(fers.withdrawalRate * 100) : '4',
    withdrawalStartAge: fers ? String(fers.withdrawalStartAge) : '62',
    oneTimeWithdrawalAmount: fers?.oneTimeWithdrawalAmount != null ? String(fers.oneTimeWithdrawalAmount) : '',
    oneTimeWithdrawalAge: fers?.oneTimeWithdrawalAge != null ? String(fers.oneTimeWithdrawalAge) : '',
  };
}

function toEstimateInput(form: FormState): FERSEstimateInput {
  const num = (s: string) => (s === '' ? 0 : Number(s));
  const optNum = (s: string) => (s === '' ? undefined : Number(s));
  return {
    birthDate: form.birthDate,
    scdRetirement: form.scdRetirement,
    retirementDate: form.retirementDate,
    gsGrade: optNum(form.gsGrade),
    gsStep: optNum(form.gsStep),
    localityCode: form.localityCode || 'RUS',
    annualRaiseRate: num(form.annualRaiseRate) / 100,
    high3Override: optNum(form.high3Override),
    sickLeaveHours: num(form.sickLeaveHours),
    annuityReductionPct: num(form.annuityReductionPct) / 100,
    ssaBenefitAt62: optNum(form.ssaBenefitAt62),
    annualEarnings: optNum(form.annualEarnings),
    currentTspBalance: num(form.currentTspBalance),
    biweeklyTspContribution: num(form.biweeklyTspContribution),
    tspGrowthRate: num(form.tspGrowthRate) / 100,
    withdrawalRate: num(form.withdrawalRate) / 100,
    withdrawalStartAge: num(form.withdrawalStartAge),
    oneTimeWithdrawalAmount: optNum(form.oneTimeWithdrawalAmount),
    oneTimeWithdrawalAge: optNum(form.oneTimeWithdrawalAge) ? Number(form.oneTimeWithdrawalAge) : undefined,
  };
}

export function FERSEstimateForm() {
  const [storedPersonal, savePersonal, removePersonal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [storedFERS, saveFERS, removeFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [, saveTSP] = useLocalStorage(STORAGE_KEYS.TSP_BALANCES, TSPBalancesSchema);
  const [storedLeaveBalance, saveLeaveBalance] = useLocalStorage(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    salary: true,
    annuity: false,
    social: false,
    tspBalances: false,
    tspWithdrawals: false,
  });

  const [form, setForm] = useState<FormState>(() => {
    // Priority: draft (partial data survives refresh) > validated storage > JSON defaults
    const draft = loadDraft();
    if (draft) return draft;
    const fromStorage = formStateFromStored(storedPersonal, storedFERS, storedLeaveBalance);
    const hasStoredData = storedPersonal !== null || storedFERS !== null;
    if (hasStoredData) return fromStorage;
    return loadFromDefaults();
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isFirstRender = useRef(true);

  // Auto-save draft to localStorage on every form change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveDraft(form);
  }, [form]);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleBirthDateChange = useCallback((value: string) => {
    setForm((prev) => {
      const next = { ...prev, birthDate: value };
      if (prev.retirementAgeOption !== 'custom' && value) {
        next.retirementDate = computeRetirementDate(value, prev.retirementAgeOption);
      }
      return next;
    });
  }, []);

  const handleRetirementAgeChange = useCallback((option: string) => {
    setForm((prev) => {
      const next = { ...prev, retirementAgeOption: option as RetirementAgeOption };
      if (option !== 'custom' && prev.birthDate) {
        next.retirementDate = computeRetirementDate(prev.birthDate, option as RetirementAgeOption);
      }
      return next;
    });
  }, []);

  const handleScdRetirementChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      scdRetirement: value,
      scdLeave: value,
    }));
  }, []);

  const estimate = useFERSEstimate(toEstimateInput(form));

  const handleSave = () => {
    const personalData: PersonalInfo = {
      birthDate: form.birthDate,
      scdLeave: form.scdLeave,
      scdRetirement: form.scdRetirement,
      paySystem: form.paySystem,
    };

    const num = (s: string) => (s === '' ? 0 : Number(s));
    const optNum = (s: string) => (s === '' ? undefined : Number(s));

    const fersData: FERSEstimate = {
      retirementAgeOption: form.retirementAgeOption,
      retirementDate: form.retirementDate,
      gsGrade: optNum(form.gsGrade),
      gsStep: optNum(form.gsStep),
      localityCode: form.localityCode || undefined,
      annualRaiseRate: num(form.annualRaiseRate) / 100,
      high3Override: optNum(form.high3Override),
      sickLeaveHours: num(form.sickLeaveHours),
      annuityReductionPct: num(form.annuityReductionPct) / 100,
      ssaBenefitAt62: optNum(form.ssaBenefitAt62),
      annualEarnings: optNum(form.annualEarnings),
      currentTspBalance: num(form.currentTspBalance),
      traditionalTspBalance: optNum(form.traditionalTspBalance),
      rothTspBalance: optNum(form.rothTspBalance),
      biweeklyTspContribution: num(form.biweeklyTspContribution),
      isRothContribution: form.isRothContribution,
      catchUpEligible: form.catchUpEligible,
      tspGrowthRate: num(form.tspGrowthRate) / 100,
      withdrawalRate: num(form.withdrawalRate) / 100,
      withdrawalStartAge: num(form.withdrawalStartAge),
      oneTimeWithdrawalAmount: optNum(form.oneTimeWithdrawalAmount),
      oneTimeWithdrawalAge: optNum(form.oneTimeWithdrawalAge),
    };

    const pResult = PersonalInfoSchema.safeParse(personalData);
    const fResult = FERSEstimateSchema.safeParse(fersData);

    const newErrors: Record<string, string> = {};

    if (!pResult.success) {
      const flat = pResult.error.flatten().fieldErrors;
      for (const [k, v] of Object.entries(flat)) {
        if (v?.[0]) newErrors[k] = v[0];
      }
    }
    if (!fResult.success) {
      const flat = fResult.error.flatten().fieldErrors;
      for (const [k, v] of Object.entries(flat)) {
        if (v?.[0]) newErrors[k] = v[0];
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    savePersonal(pResult.data!);
    saveFERS(fResult.data!);

    const traditionalBal =
      fResult.data!.traditionalTspBalance ??
      Math.max(0, fResult.data!.currentTspBalance - (fResult.data!.rothTspBalance ?? 0));
    saveTSP({
      asOf: new Date().toISOString().slice(0, 10),
      traditionalBalance: traditionalBal,
      rothBalance: fResult.data!.rothTspBalance ?? 0,
    });

    // Save LeaveBalance with the new averageAnnualSickLeaveUsage field
    const leaveBalance = storedLeaveBalance ?? {
      asOf: new Date().toISOString().slice(0, 10),
      annualLeaveHours: 0,
      sickLeaveHours: fResult.data!.sickLeaveHours,
      familyCareUsedCurrentYear: 0,
    };
    saveLeaveBalance({
      ...leaveBalance,
      sickLeaveHours: fResult.data!.sickLeaveHours,
      averageAnnualSickLeaveUsage: num(form.averageAnnualSickLeaveUsage),
    });
  };

  const handleClear = () => {
    if (window.confirm('Clear all FERS Estimate data? This cannot be undone.')) {
      removePersonal();
      removeFERS();
      removeDraft();
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
      title="FERS Estimate"
      description="Enter your information below to calculate your FERS retirement estimate. Results update live as you type."
      onSave={handleSave}
      onClear={handleClear}
      onLoadDefaults={handleLoadDefaults}
    >
      {/* Section 1: Personal & Service */}
      <Collapsible
        open={openSections.personal}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, personal: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.personal ? 'rotate-180' : ''}`} />
          <User className="w-4 h-4" />
          Personal & Service
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Date of Birth" htmlFor="fe-birthDate" error={errors.birthDate}>
              <Input
                id="fe-birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="SCD — Retirement" htmlFor="fe-scdRetirement" error={errors.scdRetirement}
              hint="Service Computation Date for retirement">
              <Input
                id="fe-scdRetirement"
                type="date"
                value={form.scdRetirement}
                onChange={(e) => handleScdRetirementChange(e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="SCD — Leave" htmlFor="fe-scdLeave" error={errors.scdLeave}
              hint="Defaults to SCD Retirement">
              <Input
                id="fe-scdLeave"
                type="date"
                value={form.scdLeave}
                onChange={(e) => set('scdLeave', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Pay System" htmlFor="fe-paySystem" error={errors.paySystem}>
              <Select value={form.paySystem} onValueChange={(value) => set('paySystem', value)}>
                <SelectTrigger id="fe-paySystem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GS">GS — General Schedule</SelectItem>
                  <SelectItem value="LEO">LEO — Law Enforcement Officer</SelectItem>
                  <SelectItem value="Title38">Title 38 — VA Health</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Retire At" htmlFor="fe-retireAge" error={errors.retirementAgeOption}
              hint="Select age or choose custom date">
              <Select value={form.retirementAgeOption} onValueChange={(value) => handleRetirementAgeChange(value)}>
                <SelectTrigger id="fe-retireAge">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MRA">MRA (Minimum Retirement Age)</SelectItem>
                  <SelectItem value="60">Age 60</SelectItem>
                  <SelectItem value="62">Age 62</SelectItem>
                  <SelectItem value="custom">Custom date</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Planned Retirement Date" htmlFor="fe-retirementDate" error={errors.retirementDate}
              hint={form.retirementAgeOption !== 'custom' ? 'Computed from DOB + age' : undefined}>
              <Input
                id="fe-retirementDate"
                type="date"
                value={form.retirementDate}
                onChange={(e) => set('retirementDate', e.target.value)}
                disabled={form.retirementAgeOption !== 'custom'}
              />
            </FieldGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 2: Salary */}
      <Collapsible
        open={openSections.salary}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, salary: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.salary ? 'rotate-180' : ''}`} />
          <DollarSign className="w-4 h-4" />
          Salary
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="GS Grade" htmlFor="fe-gsGrade" error={errors.gsGrade}>
              <Select value={form.gsGrade} onValueChange={(value) => set('gsGrade', value)}>
                <SelectTrigger id="fe-gsGrade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GS_GRADES.map((g) => (
                    <SelectItem key={g} value={String(g)}>GS-{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="GS Step" htmlFor="fe-gsStep" error={errors.gsStep}>
              <Select value={form.gsStep} onValueChange={(value) => set('gsStep', value)}>
                <SelectTrigger id="fe-gsStep">
                  <SelectValue placeholder="Select step" />
                </SelectTrigger>
                <SelectContent>
                  {GS_STEPS.map((s) => (
                    <SelectItem key={s} value={String(s)}>Step {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup label="Locality Area" htmlFor="fe-locality" error={errors.localityCode}>
              <Select value={form.localityCode} onValueChange={(value) => set('localityCode', value)}>
                <SelectTrigger id="fe-locality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALITY_CODES.map((code) => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldGroup label="Annual Raise (%)" htmlFor="fe-raiseRate" error={errors.annualRaiseRate}
              hint="0 = no raises assumed">
              <Input
                id="fe-raiseRate"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.annualRaiseRate}
                onChange={(e) => set('annualRaiseRate', e.target.value)}
              />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="High-3 Override ($)" htmlFor="fe-high3" error={errors.high3Override}
              hint="Leave blank to calculate from grade/step">
              <Input
                id="fe-high3"
                type="number"
                min="0"
                step="1"
                placeholder="Auto from grade/step"
                value={form.high3Override}
                onChange={(e) => set('high3Override', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Sick Leave Hours" htmlFor="fe-sickHours" error={errors.sickLeaveHours}>
              <Input
                id="fe-sickHours"
                type="number"
                min="0"
                step="1"
                value={form.sickLeaveHours}
                onChange={(e) => set('sickLeaveHours', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup
              label="Average Annual Sick Leave Used (hrs)"
              htmlFor="fe-avgSickUsage"
              error={errors.averageAnnualSickLeaveUsage}
              hint="e.g., 40 hours/year for projection modeling"
            >
              <Input
                id="fe-avgSickUsage"
                type="number"
                min="0"
                step="1"
                value={form.averageAnnualSickLeaveUsage}
                onChange={(e) => set('averageAnnualSickLeaveUsage', e.target.value)}
              />
            </FieldGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 3: Annuity Options */}
      <Collapsible
        open={openSections.annuity}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, annuity: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.annuity ? 'rotate-180' : ''}`} />
          <Shield className="w-4 h-4" />
          Annuity Options
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Survivor Benefit Reduction (%)" htmlFor="fe-reduction" error={errors.annuityReductionPct}
              hint="Typical: 0%, 5%, or 10%">
              <Input
                id="fe-reduction"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.annuityReductionPct}
                onChange={(e) => set('annuityReductionPct', e.target.value)}
              />
            </FieldGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 4: Social Security */}
      <Collapsible
        open={openSections.social}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, social: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.social ? 'rotate-180' : ''}`} />
          <Building2 className="w-4 h-4" />
          Social Security
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="SSA Monthly Benefit at 62 ($)" htmlFor="fe-ssAt62" error={errors.ssaBenefitAt62}
              hint="From your Social Security statement">
              <Input
                id="fe-ssAt62"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 1800"
                value={form.ssaBenefitAt62}
                onChange={(e) => set('ssaBenefitAt62', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Annual Earnings ($)" htmlFor="fe-earnings" error={errors.annualEarnings}
              hint="0 if fully retired (for earnings test)">
              <Input
                id="fe-earnings"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.annualEarnings}
                onChange={(e) => set('annualEarnings', e.target.value)}
              />
            </FieldGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 5: TSP — Balances & Contributions */}
      <Collapsible
        open={openSections.tspBalances}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, tspBalances: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.tspBalances ? 'rotate-180' : ''}`} />
          <PiggyBank className="w-4 h-4" />
          TSP — Balances & Contributions
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
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
            <FieldGroup label="Bi-weekly Contribution ($)" htmlFor="fe-tspContrib" error={errors.biweeklyTspContribution}>
              <Input
                id="fe-tspContrib"
                type="number"
                min="0"
                step="0.01"
                value={form.biweeklyTspContribution}
                onChange={(e) => set('biweeklyTspContribution', e.target.value)}
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
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="fe-roth"
                checked={form.isRothContribution}
                onCheckedChange={(checked) => set('isRothContribution', !!checked)}
              />
              <label htmlFor="fe-roth" className="text-sm cursor-pointer">
                Contributing to Roth TSP
              </label>
            </div>
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
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 6: TSP — Withdrawals */}
      <Collapsible
        open={openSections.tspWithdrawals}
        onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, tspWithdrawals: open }))}
      >
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
          <ChevronDown className={`w-4 h-4 transition-transform ${openSections.tspWithdrawals ? 'rotate-180' : ''}`} />
          <ArrowDownToLine className="w-4 h-4" />
          TSP — Withdrawals
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-4">
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
        </CollapsibleContent>
      </Collapsible>

      {/* Live Results */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-foreground mb-2">Estimate Results</h3>
        <FERSEstimateResults result={estimate} />
      </div>
    </FormSection>
  );
}
