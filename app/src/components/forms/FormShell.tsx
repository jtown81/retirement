import { useState, type ReactNode } from 'react';

export interface TabDef {
  id: string;
  label: string;
  complete: boolean;
}

interface FormShellProps {
  tabs: TabDef[];
  children: (activeTabId: string) => ReactNode;
}

export function FormShell({ tabs, children }: FormShellProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex -mb-px space-x-4 sm:space-x-6 min-w-max" aria-label="Form sections">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full ${tab.complete ? 'bg-green-500' : 'bg-gray-300'}`}
                  aria-label={tab.complete ? 'Complete' : 'Incomplete'}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Active tab content */}
      {children(activeTab)}
    </div>
  );
}
