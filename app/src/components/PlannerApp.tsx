import { useState } from 'react';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './Dashboard';
import { FormShell, type TabDef } from './forms/FormShell';
import { useFormSections } from './forms/useFormSections';
import { useAssembleInput } from './forms/useAssembleInput';
import { useSimulation, type SimulationData } from '@hooks/useSimulation';
import { PersonalInfoForm } from './forms/PersonalInfoForm';
import { CareerEventsForm } from './forms/CareerEventsForm';
import { LeaveBalanceForm } from './forms/LeaveBalanceForm';
import { TSPForm } from './forms/TSPForm';
import { MilitaryServiceForm } from './forms/MilitaryServiceForm';
import { ExpensesForm } from './forms/ExpensesForm';
import { AssumptionsForm } from './forms/AssumptionsForm';

// Demo data for fallback mode
import {
  DEMO_RESULT,
  DEMO_SALARY_HISTORY,
  DEMO_LEAVE_BALANCES,
  DEMO_TSP_BALANCES,
  DEMO_SMILE_CURVE,
} from '@data/demo-fixture';

type View = 'input' | 'dashboard';

const DEMO_DATA: SimulationData = {
  result: DEMO_RESULT,
  salaryHistory: DEMO_SALARY_HISTORY,
  leaveBalances: DEMO_LEAVE_BALANCES,
  tspBalances: DEMO_TSP_BALANCES,
  smileCurve: DEMO_SMILE_CURVE,
};

function FormContent({ activeTabId }: { activeTabId: string }) {
  switch (activeTabId) {
    case 'personal': return <PersonalInfoForm />;
    case 'career': return <CareerEventsForm />;
    case 'leave': return <LeaveBalanceForm />;
    case 'tsp': return <TSPForm />;
    case 'military': return <MilitaryServiceForm />;
    case 'expenses': return <ExpensesForm />;
    case 'assumptions': return <AssumptionsForm />;
    default: return null;
  }
}

export function PlannerApp() {
  const [view, setView] = useState<View>('input');
  const sections = useFormSections();
  const assembledInput = useAssembleInput();
  const userData = useSimulation(assembledInput);

  const mode = userData ? 'user' : 'demo';
  const data = userData ?? DEMO_DATA;

  const requiredComplete = sections.filter((s) => s.required).every((s) => s.complete);

  const tabs: TabDef[] = sections.map((s) => ({
    id: s.id,
    label: s.label,
    complete: s.complete,
  }));

  return (
    <AppShell view={view} onViewChange={setView} mode={mode}>
      {view === 'input' ? (
        <div>
          {!requiredComplete && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6 text-sm text-blue-800">
              Complete all required sections (marked with dots) then switch to the Dashboard to see your personalized projections.
            </div>
          )}
          <FormShell tabs={tabs}>
            {(activeTabId) => <FormContent activeTabId={activeTabId} />}
          </FormShell>
        </div>
      ) : (
        <Dashboard data={data} mode={mode} />
      )}
    </AppShell>
  );
}
