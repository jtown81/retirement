import type { ReactNode } from 'react';

export type View = 'input' | 'leave' | 'dashboard';

interface AppShellProps {
  children: ReactNode;
  view: View;
  onViewChange: (view: View) => void;
  mode: 'demo' | 'user';
}

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'input', label: 'My Plan' },
  { id: 'leave', label: 'Leave' },
  { id: 'dashboard', label: 'Dashboard' },
];

export function AppShell({ children, view, onViewChange, mode }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              Federal Retirement Planner
            </h1>
          </div>
          <nav className="flex space-x-6 mt-3 -mb-px" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onViewChange(item.id)}
                className={`pb-2 text-sm font-medium border-b-2 ${
                  view === item.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {children}
      </main>

      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-500">
          Federal Retirement Planner — {mode === 'demo' ? 'Demo Mode' : 'Your Plan'}
        </div>
      </footer>
    </div>
  );
}
