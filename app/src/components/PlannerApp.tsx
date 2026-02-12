import { useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { AppShell, type View } from './layout/AppShell';
import { Dashboard } from './Dashboard';
import { FormShell, type TabDef } from './forms/FormShell';
import { useFormSections, useLeaveComplete } from './forms/useFormSections';
import { useAssembleInput } from './forms/useAssembleInput';
import { useSimulation, type SimulationData } from '@hooks/useSimulation';
import { FERSEstimateForm } from './forms/FERSEstimateForm';
import { CareerEventsForm } from './forms/CareerEventsForm';
import { LeaveBalanceForm } from './forms/LeaveBalanceForm';
import { ExpensesForm } from './forms/ExpensesForm';
import { SimulationForm } from './forms/SimulationForm';

class TabErrorBoundary extends Component<{ children: ReactNode; tabId: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Tab ${this.props.tabId}]`, error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-700">
          <p className="font-semibold mb-1">Something went wrong loading this tab.</p>
          <p className="text-xs text-red-500">{this.state.error.message}</p>
          <button type="button" onClick={() => this.setState({ error: null })}
            className="mt-3 text-xs text-blue-700 underline">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Demo data for fallback mode
import {
  DEMO_RESULT,
  DEMO_SALARY_HISTORY,
  DEMO_LEAVE_BALANCES,
  DEMO_TSP_BALANCES,
  DEMO_SMILE_CURVE,
} from '@data/demo-fixture';

const DEMO_DATA: SimulationData = {
  result: DEMO_RESULT,
  salaryHistory: DEMO_SALARY_HISTORY,
  leaveBalances: DEMO_LEAVE_BALANCES,
  tspBalances: DEMO_TSP_BALANCES,
  smileCurve: DEMO_SMILE_CURVE,
};

function FormContent({ activeTabId }: { activeTabId: string }) {
  switch (activeTabId) {
    case 'personal': return <FERSEstimateForm />;
    case 'career': return <CareerEventsForm />;
    case 'expenses': return <ExpensesForm />;
    case 'simulation': return <SimulationForm />;
    default: return null;
  }
}

export function PlannerApp() {
  const [view, setView] = useState<View>('input');
  const sections = useFormSections();
  const leaveComplete = useLeaveComplete();
  const assembledInput = useAssembleInput();
  const userData = useSimulation(assembledInput);

  const mode = userData ? 'user' : 'demo';
  const data = userData ?? DEMO_DATA;

  const requiredComplete = sections.filter((s) => s.required).every((s) => s.complete) && leaveComplete;

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
              Complete all required sections (marked with dots) and the Leave tab, then switch to the Dashboard to see your personalized projections.
            </div>
          )}
          <FormShell tabs={tabs}>
            {(activeTabId) => (
              <TabErrorBoundary tabId={activeTabId} key={activeTabId}>
                <FormContent activeTabId={activeTabId} />
              </TabErrorBoundary>
            )}
          </FormShell>
        </div>
      ) : view === 'leave' ? (
        <LeaveBalanceForm />
      ) : (
        <Dashboard data={data} mode={mode} />
      )}
    </AppShell>
  );
}
