import { useState, useEffect, Component, type ReactNode, type ErrorInfo } from 'react';
import { AppShell, type View } from './layout/AppShell';
import { Dashboard } from './Dashboard';
import { FormShell, type TabDef } from './forms/FormShell';
import { useFormSections } from './forms/useFormSections';
import { useAssembleInput, useSimulationConfig } from './forms/useAssembleInput';
import { useSimulation, type SimulationData } from '@hooks/useSimulation';
import { useTheme } from '@hooks/useTheme';
import { useEntitlement } from '@hooks/useEntitlement';
import { useRevenueCatSync } from '@hooks/useRevenueCatSync';
import { FERSEstimateForm } from './forms/FERSEstimateForm';
import { CareerEventsForm } from './forms/CareerEventsForm';
import { ExpensesForm } from './forms/ExpensesForm';
import { SimulationForm } from './forms/SimulationForm';
import { TaxProfileForm } from './forms/TaxProfileForm';
import { TSPMonitorPanel } from './forms/TSPMonitorPanel';
import { UpgradePrompt } from './paywall/UpgradePrompt';
import { ScenarioManager } from './scenarios/ScenarioManager';
import { ScenarioComparison } from './scenarios/ScenarioComparison';
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

function FormContent({
  activeTabId,
  isPremium,
}: {
  activeTabId: string;
  isPremium: boolean;
}) {
  switch (activeTabId) {
    case 'personal': return <FERSEstimateForm />;
    case 'career': return <CareerEventsForm />;
    case 'expenses': return <ExpensesForm />;
    case 'simulation':
      return isPremium ? (
        <SimulationForm />
      ) : (
        <UpgradePrompt
          feature="Advanced Simulation"
          description="Unlock detailed retirement projections with Monte Carlo analysis and tax modeling."
        />
      );
    case 'tax':
      return isPremium ? (
        <TaxProfileForm />
      ) : (
        <UpgradePrompt
          feature="Tax Modeling"
          description="Unlock advanced tax planning including IRMAA surcharge calculations."
        />
      );
    case 'tsp-monitor': return <TSPMonitorPanel />;
    default: return null;
  }
}

export function PlannerApp() {
  const [view, setView] = useState<View>('input');
  const { theme, setTheme } = useTheme();
  const { isPremium } = useEntitlement();

  // Initialize RevenueCat SDK on app load
  useEffect(() => {
    const initializeRC = async () => {
      try {
        const { initializeRevenueCat } = await import('@entitlements/revenuecat');
        await initializeRevenueCat();
      } catch (err) {
        console.error('[PlannerApp] RevenueCat initialization failed:', err);
      }
    };
    initializeRC();
  }, []);

  // Sync entitlements from RevenueCat on sign-in/sign-out
  useRevenueCatSync();

  const sections = useFormSections();
  const assembledInput = useAssembleInput();
  const simConfig = useSimulationConfig();
  // For basic tier, suppress simulation config to prevent fullSimulation projection
  const effectiveSimConfig = isPremium ? simConfig : null;
  const userData = useSimulation(assembledInput, effectiveSimConfig);

  const mode = userData ? 'user' : 'demo';
  const data = userData ?? DEMO_DATA;

  // For basic tier, exclude premium forms from required completion check
  const requiredComplete = sections
    .filter((s) => s.required && (isPremium || s.tier === 'basic'))
    .every((s) => s.complete);

  const tabs: TabDef[] = sections.map((s) => ({
    id: s.id,
    label: s.label,
    complete: s.complete,
    locked: !isPremium && s.tier === 'premium',
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
                Complete all required sections (marked with dots), then switch to the Dashboard to see your personalized projections.
              </AlertDescription>
            </Alert>
          )}
          <FormShell tabs={tabs}>
            {(activeTabId) => (
              <TabErrorBoundary tabId={activeTabId} key={activeTabId}>
                <FormContent activeTabId={activeTabId} isPremium={isPremium} />
              </TabErrorBoundary>
            )}
          </FormShell>
        </div>
      ) : view === 'scenarios' ? (
        <div className="space-y-8">
          <ScenarioManager />
          <ScenarioComparison />
        </div>
      ) : (
        <Dashboard data={data} mode={mode} inputs={assembledInput} />
      )}
    </AppShell>
  );
}
