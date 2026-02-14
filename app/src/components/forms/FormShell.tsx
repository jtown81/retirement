import { useState, type ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
import { Calculator, Briefcase, Receipt, LineChart, CheckCircle2, Circle } from 'lucide-react';

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
  personal: <Calculator className="w-4 h-4" />,
  career: <Briefcase className="w-4 h-4" />,
  expenses: <Receipt className="w-4 h-4" />,
  simulation: <LineChart className="w-4 h-4" />,
};

export function FormShell({ tabs, children }: FormShellProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
            {TAB_ICONS[tab.id] || <Circle className="w-4 h-4" />}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.complete ? (
              <CheckCircle2 className="w-3 h-3 ml-1 text-green-600" />
            ) : (
              <Circle className="w-3 h-3 ml-1 text-muted-foreground" />
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
