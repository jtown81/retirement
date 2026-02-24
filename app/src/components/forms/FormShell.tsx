import { useState, type ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
import { Calculator, Briefcase, Receipt, LineChart, FileText, BarChart3, CheckCircle2, Circle } from 'lucide-react';

export interface TabDef {
  id: string;
  label: string;
  complete: boolean;
}

interface FormShellProps {
  tabs: TabDef[];
  children: (activeTabId: string) => ReactNode;
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  personal: <Calculator className="w-4 h-4" aria-hidden="true" />,
  career: <Briefcase className="w-4 h-4" aria-hidden="true" />,
  expenses: <Receipt className="w-4 h-4" aria-hidden="true" />,
  simulation: <LineChart className="w-4 h-4" aria-hidden="true" />,
  tax: <FileText className="w-4 h-4" aria-hidden="true" />,
  'tsp-monitor': <BarChart3 className="w-4 h-4" aria-hidden="true" />,
};

export function FormShell({ tabs, children }: FormShellProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="flex flex-wrap w-full gap-2 mb-6">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="flex-1 flex items-center gap-2 min-w-fit" aria-label={tab.label}>
            {TAB_ICONS[tab.id] || <Circle className="w-4 h-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.complete ? (
              <>
                <CheckCircle2 className="w-3 h-3 ml-1 text-green-600 dark:text-green-400" aria-hidden="true" />
                <span className="sr-only">(complete)</span>
              </>
            ) : (
              <>
                <Circle className="w-3 h-3 ml-1 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">(incomplete)</span>
              </>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {children(tab.id)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
