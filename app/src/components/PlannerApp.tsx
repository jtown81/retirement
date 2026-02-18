import { useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { AppShell, type View } from './layout/AppShell';
import { Dashboard } from './Dashboard';
import { FormShell, type TabDef } from './forms/FormShell';
import { useFormSections } from './forms/useFormSections';
import { useAssembleInput, useSimulationConfig } from './forms/useAssembleInput';
import { useSimulation, type SimulationData } from '@hooks/useSimulation';
import { useTheme } from '@hooks/useTheme';
import { FERSEstimateForm } from './forms/FERSEstimateForm';
import { CareerEventsForm } from './forms/CareerEventsForm';
import { LeaveBalanceForm } from './forms/LeaveBalanceForm';
import { ExpensesForm } from './forms/ExpensesForm';
import { SimulationForm } from './forms/SimulationForm';
import { TaxProfileForm } from './forms/TaxProfileForm';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { AlertCircle } from 'lucide-react';

class TabErrorBoundary extends Component<{ children: ReactNode; tabId: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Tab ${this.props.tabId}]`, error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong loading this tab</AlertTitle>
          <AlertDescription className="mt-2 text-xs">
            {this.state.error.message}
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-2 text-xs underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
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
  DEMO_INCOME_WATERFALL,
  DEMO_TSP_LIFECYCLE,
  DEMO_EXPENSE_PHASES,
  DEMO_RMD_TIMELINE,
} from '@data/demo-fixture';

const DEMO_DATA: SimulationData = {
  result: DEMO_RESULT,
  salaryHistory: DEMO_SALARY_HISTORY,
  leaveBalances: DEMO_LEAVE_BALANCES,
  tspBalances: DEMO_TSP_BALANCES,
  smileCurve: DEMO_SMILE_CURVE,
  fullSimulation: null,
  incomeWaterfall: DEMO_INCOME_WATERFALL,
  tspLifecycle: DEMO_TSP_LIFECYCLE,
  expensePhases: DEMO_EXPENSE_PHASES,
  rmdTimeline: DEMO_RMD_TIMELINE,
};

function FormContent({ activeTabId }: { activeTabId: string }) {
  switch (activeTabId) {
    case 'personal': return <FERSEstimateForm />;
    case 'career': return <CareerEventsForm />;
    case 'expenses': return <ExpensesForm />;
    case 'simulation': return <SimulationForm />;
    case 'tax': return <TaxProfileForm />;
    default: return null;
  }
}

export function PlannerApp() {
  const [view, setView] = useState<View>('input');
  const { theme, setTheme } = useTheme();
  const sections = useFormSections();
  const assembledInput = useAssembleInput();
  const simConfig = useSimulationConfig();
  const userData = useSimulation(assembledInput, simConfig);

  const mode = userData ? 'user' : 'demo';
  const data = userData ?? DEMO_DATA;

  const requiredComplete = sections.filter((s) => s.required).every((s) => s.complete);

  const tabs: TabDef[] = sections.map((s) => ({
    id: s.id,
    label: s.label,
    complete: s.complete,
  }));

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      mode={mode}
      theme={theme}
      onThemeChange={setTheme}
    >
      {view === 'input' ? (
        <div>
          {!requiredComplete && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Complete your plan details</AlertTitle>
              <AlertDescription>
                Complete all required sections (marked with dots) and the Leave tab, then switch to the Dashboard to see your personalized projections.
              </AlertDescription>
            </Alert>
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
