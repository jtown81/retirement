import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import {
  STORAGE_KEYS,
  SimulationConfigSchema,
  FERSEstimateSchema,
  ExpenseProfileSchema,
  PersonalInfoSchema,
} from '@storage/index';
import { projectRetirementSimulation } from '@modules/simulation/retirement-simulation';
import type { SimulationConfig, FullSimulationResult } from '@models/simulation';
import { useFERSEstimate, type FERSEstimateInput } from './useFERSEstimate';
import { CoreParametersSubForm } from './simulation/CoreParametersSubForm';
import { TSPSimulationSubForm } from './simulation/TSPSimulationSubForm';
import { ExpensesSimulationSubForm } from './simulation/ExpensesSimulationSubForm';
import { RatesSubForm } from './simulation/RatesSubForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import type { z } from 'zod';

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
};

// ── Type definitions ─────────────────────────────────────────────────────────

type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
type FERSEstimate = z.infer<typeof FERSEstimateSchema>;
type ExpenseProfile = z.infer<typeof ExpenseProfileSchema>;

// ── Helper: Build FERS estimate input ────────────────────────────────────────

function buildFERSEstimateInput(personal: PersonalInfo | null, fers: FERSEstimate | null): FERSEstimateInput | null {
  if (!personal || !fers) return null;
  return {
    birthDate: personal.birthDate,
    scdRetirement: personal.scdRetirement,
    retirementDate: fers.retirementDate,
    gsGrade: fers.gsGrade,
    gsStep: fers.gsStep,
    localityCode: fers.localityCode ?? 'RUS',
    annualRaiseRate: fers.annualRaiseRate,
    high3Override: fers.high3Override,
    sickLeaveHours: fers.sickLeaveHours,
    annuityReductionPct: fers.annuityReductionPct,
    ssaBenefitAt62: fers.ssaBenefitAt62,
    annualEarnings: fers.annualEarnings,
    currentTspBalance: fers.currentTspBalance,
    employeeTotalContribPct: fers.traditionalContribPct + fers.rothContribPct,
    tspGrowthRate: fers.tspGrowthRate,
    withdrawalRate: fers.withdrawalRate,
    withdrawalStartAge: fers.withdrawalStartAge,
    oneTimeWithdrawalAmount: fers.oneTimeWithdrawalAmount,
    oneTimeWithdrawalAge: fers.oneTimeWithdrawalAge,
  };
}

// ── Container Component ──────────────────────────────────────────────────────

export function SimulationForm() {
  const [activeSubTab, setActiveSubTab] = useState('core');
  const [storedConfig, saveConfig] = useLocalStorage(STORAGE_KEYS.SIMULATION_CONFIG, SimulationConfigSchema);
  const [storedPersonal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [storedFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [storedExpenses] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);
  const isFirstRender = useRef(true);

  // Compute FERS estimate from saved data for auto-population hints in sub-forms
  const fersInput = useMemo(
    () => buildFERSEstimateInput(storedPersonal, storedFERS),
    [storedPersonal, storedFERS],
  );
  const fersEstimate = useFERSEstimate(fersInput!);

  // ── Auto-initialize SimulationConfig with defaults on first load ──────────────────
  // This ensures the full simulation is available (not null) in the Dashboard
  useEffect(() => {
    if (isFirstRender.current && !storedConfig && fersEstimate?.canCompute) {
      isFirstRender.current = false;

      // Build default config with values from FERS estimate where available
      const now = new Date();
      const retirementYear = new Date(storedFERS?.retirementDate || now).getFullYear();
      const birthYear = storedPersonal?.birthDate ? new Date(storedPersonal.birthDate).getFullYear() : 1962;
      const retirementAge = Math.round(fersEstimate.ageAtRetirement);
      const endAge = Math.max(95, retirementAge + 30); // At least 30 years of projection

      const defaultConfig: SimulationConfig = {
        // Core retirement parameters from FERS estimate
        proposedRetirementDate: storedFERS?.retirementDate || now.toISOString().slice(0, 10),
        retirementAge,
        retirementYear,
        birthYear,
        endAge,
        tspGrowthRate: storedFERS?.tspGrowthRate ?? 0.07,
        ssClaimingAge: 62,

        // Annuity values from FERS estimate
        fersAnnuity: Math.round(fersEstimate.netAnnuity),
        fersSupplement: Math.round(fersEstimate.supplementAnnual),
        ssMonthlyAt62: storedFERS?.ssaBenefitAt62 ?? 0,

        // TSP parameters (reasonable defaults based on FERS data)
        tspBalanceAtRetirement: storedFERS?.currentTspBalance ?? 500000,
        traditionalPct: 0.70,
        highRiskPct: 0.60,
        highRiskROI: 0.08,
        lowRiskROI: 0.03,
        withdrawalRate: 0.04, // 4% rule
        timeStepYears: 2,
        withdrawalStrategy: 'proportional',

        // Expense parameters from expense profile or defaults
        baseAnnualExpenses: storedExpenses?.categories.reduce((sum, c) => sum + c.annualAmount, 0) ?? 60000,
        goGoEndAge: 72,
        goGoRate: 1.0,
        goSlowEndAge: 82,
        goSlowRate: 0.85,
        noGoRate: 0.75,

        // Rate assumptions
        colaRate: 0.02,
        inflationRate: 0.025,
        healthcareInflationRate: 0.055,
        healthcareAnnualExpenses: 8000,
      };

      // Validate and save
      const validation = SimulationConfigSchema.safeParse(defaultConfig);
      if (validation.success) {
        saveConfig(defaultConfig);
      }
    }
  }, [storedConfig, fersEstimate, storedFERS, storedPersonal, storedExpenses, saveConfig]);

  // ── Live simulation (read-only, driven by stored config) ──────────────────
  const simulation = useMemo<FullSimulationResult | null>(() => {
    if (!storedConfig) return null;
    try {
      const result = SimulationConfigSchema.safeParse(storedConfig);
      if (!result.success) return null;
      return projectRetirementSimulation(storedConfig);
    } catch {
      return null;
    }
  }, [storedConfig]);

  return (
    <div className="space-y-4">
      {/* Sub-tabs for simulation parameters */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Retirement Simulation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Year-by-year post-retirement projection with dual-pot TSP, RMD compliance, and GoGo/GoSlow/NoGo expense phases. Results update live.
          </p>
        </div>

        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-muted p-0 h-auto">
            <TabsTrigger value="core" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Core Parameters
            </TabsTrigger>
            <TabsTrigger value="tsp" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              TSP
            </TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="rates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Rates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="p-6 border-none">
            <CoreParametersSubForm />
          </TabsContent>
          <TabsContent value="tsp" className="p-6 border-none">
            <TSPSimulationSubForm />
          </TabsContent>
          <TabsContent value="expenses" className="p-6 border-none">
            <ExpensesSimulationSubForm />
          </TabsContent>
          <TabsContent value="rates" className="p-6 border-none">
            <RatesSubForm />
          </TabsContent>
        </Tabs>
      </div>

      {/* Results Panel (always visible, reads from stored config) */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Simulation Results</h3>
        <SimulationResults result={simulation} />
      </div>
    </div>
  );
}

// ── Results Display ──────────────────────────────────────────────────────────

function SimulationResults({ result }: { result: FullSimulationResult | null }) {
  if (!result) {
    return (
      <Alert className="bg-muted">
        <AlertDescription className="text-center">
          Enter valid parameters above to see the year-by-year retirement projection.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
        <MetricBox
          label="TSP Depletes"
          value={result.depletionAge === null ? 'NEVER' : `Age ${result.depletionAge}`}
          good={result.depletionAge === null}
        />
        <MetricBox
          label="Balance at 85"
          value={fmtK(result.balanceAt85)}
          good={result.balanceAt85 > 0}
        />
        <MetricBox
          label="Lifetime Income"
          value={fmtK(result.totalLifetimeIncome)}
        />
        <MetricBox
          label="Lifetime Expenses"
          value={fmtK(result.totalLifetimeExpenses)}
        />
      </div>

      {/* Year-by-Year Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0">
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-xs w-8">Age</TableHead>
                <TableHead className="text-xs w-10">Year</TableHead>
                <TableHead className="text-xs text-right">Annuity</TableHead>
                <TableHead className="text-xs text-right">Suppl.</TableHead>
                <TableHead className="text-xs text-right">SS</TableHead>
                <TableHead className="text-xs text-right">TSP Draw</TableHead>
                <TableHead className="text-xs text-right">Income</TableHead>
                <TableHead className="text-xs text-right">Expenses</TableHead>
                <TableHead className="text-xs text-right">Surplus</TableHead>
                <TableHead className="text-xs text-right">TSP Bal.</TableHead>
                <TableHead className="text-xs text-right">Trad.</TableHead>
                <TableHead className="text-xs text-right">Roth</TableHead>
                <TableHead className="text-xs text-right">Hi-Risk</TableHead>
                <TableHead className="text-xs text-right">Lo-Risk</TableHead>
                <TableHead className="text-xs text-center">Phase</TableHead>
                <TableHead className="text-xs text-right">RMD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.years.map((yr) => {
                const phase = yr.smileMultiplier >= 1.0
                  ? 'GoGo'
                  : yr.smileMultiplier >= (result.config.noGoRate + 0.001)
                    ? 'GoSlow'
                    : 'NoGo';
                const phaseColor = phase === 'GoGo'
                  ? 'text-green-700 dark:text-green-400'
                  : phase === 'GoSlow'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-muted-foreground';
                const depleted = yr.totalTSPBalance <= 0;
                const rowBg = depleted
                  ? 'bg-destructive/10 hover:bg-destructive/20'
                  : yr.age === 85
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : '';

                return (
                  <TableRow key={yr.age} className={rowBg}>
                    <TableCell className="text-xs font-medium">{yr.age}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{yr.year}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.annuity)}</TableCell>
                    <TableCell className="text-xs text-right">{yr.fersSupplement > 0 ? fmtK(yr.fersSupplement) : '-'}</TableCell>
                    <TableCell className="text-xs text-right">{yr.socialSecurity > 0 ? fmtK(yr.socialSecurity) : '-'}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.tspWithdrawal)}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{fmtK(yr.totalIncome)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.totalExpenses)}</TableCell>
                    <TableCell className={`text-xs text-right font-medium ${yr.surplus >= 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'}`}>
                      {fmtK(yr.surplus)}
                    </TableCell>
                    <TableCell className={`text-xs text-right font-medium ${depleted ? 'text-destructive' : ''}`}>
                      {fmtK(yr.totalTSPBalance)}
                    </TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.traditionalBalance)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.rothBalance)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.highRiskBalance)}</TableCell>
                    <TableCell className="text-xs text-right">{fmtK(yr.lowRiskBalance)}</TableCell>
                    <TableCell className="text-xs text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${phaseColor} bg-background border border-border`}>
                        {phase}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {yr.rmdRequired > 0 ? (
                        <span className={yr.rmdSatisfied ? 'text-green-700 dark:text-green-400' : 'text-destructive'}>
                          {fmtK(yr.rmdRequired)}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-sm font-semibold ${
        good === true ? 'text-green-700 dark:text-green-400' : good === false ? 'text-destructive' : 'text-foreground'
      }`}>
        {value}
      </div>
    </div>
  );
}
