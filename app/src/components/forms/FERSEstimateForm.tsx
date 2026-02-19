import { useState } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, PersonalInfoSchema, FERSEstimateSchema, LeaveBalanceSchema } from '@storage/index';
import { FERSEstimateResults } from './FERSEstimateResults';
import { useFERSEstimate, type FERSEstimateInput } from './useFERSEstimate';
import { PersonalSubForm } from './fers/PersonalSubForm';
import { SalarySubForm } from './fers/SalarySubForm';
import { AnnuitySocialSubForm } from './fers/AnnuitySocialSubForm';
import { TSPSubForm } from './fers/TSPSubForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import type { z } from 'zod';

type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
type FERSEstimate = z.infer<typeof FERSEstimateSchema>;
type LeaveBalance = z.infer<typeof LeaveBalanceSchema>;

function toEstimateInput(
  personal: PersonalInfo | null,
  fers: FERSEstimate | null,
  leaveBalance: LeaveBalance | null
): FERSEstimateInput | null {
  if (!personal || !fers) return null;

  const num = (v: number | undefined) => v ?? 0;
  const optNum = (v: number | undefined) => v;

  return {
    birthDate: personal.birthDate,
    scdRetirement: personal.scdRetirement,
    retirementDate: fers.retirementDate,
    gsGrade: optNum(fers.gsGrade),
    gsStep: optNum(fers.gsStep),
    localityCode: fers.localityCode || 'RUS',
    annualRaiseRate: num(fers.annualRaiseRate),
    high3Override: optNum(fers.high3Override),
    sickLeaveHours: num(fers.sickLeaveHours),
    annuityReductionPct: num(fers.annuityReductionPct),
    ssaBenefitAt62: optNum(fers.ssaBenefitAt62),
    annualEarnings: optNum(fers.annualEarnings),
    currentTspBalance: num(fers.currentTspBalance),
    employeeTotalContribPct: (num(fers.traditionalContribPct) + num(fers.rothContribPct)),
    tspGrowthRate: num(fers.tspGrowthRate),
    withdrawalRate: num(fers.withdrawalRate),
    withdrawalStartAge: num(fers.withdrawalStartAge),
    oneTimeWithdrawalAmount: optNum(fers.oneTimeWithdrawalAmount),
    oneTimeWithdrawalAge: optNum(fers.oneTimeWithdrawalAge),
  };
}

export function FERSEstimateForm() {
  const [activeTab, setActiveTab] = useState('personal');
  const [storedPersonal] = useLocalStorage(STORAGE_KEYS.PERSONAL_INFO, PersonalInfoSchema);
  const [storedFERS] = useLocalStorage(STORAGE_KEYS.FERS_ESTIMATE, FERSEstimateSchema);
  const [storedLeaveBalance] = useLocalStorage(STORAGE_KEYS.LEAVE_BALANCE, LeaveBalanceSchema);

  const estimateInput = toEstimateInput(storedPersonal, storedFERS, storedLeaveBalance);
  const estimate = estimateInput ? useFERSEstimate(estimateInput) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">FERS Estimate</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your information below to calculate your FERS retirement estimate. Results update live as you save.
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-muted p-0 h-auto">
            <TabsTrigger value="personal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Personal
            </TabsTrigger>
            <TabsTrigger value="salary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Salary
            </TabsTrigger>
            <TabsTrigger value="annuity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Annuity & SS
            </TabsTrigger>
            <TabsTrigger value="tsp" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              TSP
            </TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="p-6 border-none">
            <PersonalSubForm />
          </TabsContent>
          <TabsContent value="salary" className="p-6 border-none">
            <SalarySubForm />
          </TabsContent>
          <TabsContent value="annuity" className="p-6 border-none">
            <AnnuitySocialSubForm />
          </TabsContent>
          <TabsContent value="tsp" className="p-6 border-none">
            <TSPSubForm />
          </TabsContent>
        </Tabs>
      </div>

      {/* Results Panel */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Estimate Results</h3>
        <FERSEstimateResults result={estimate} />
      </div>
    </div>
  );
}
