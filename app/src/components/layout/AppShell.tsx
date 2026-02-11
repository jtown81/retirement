import type { ReactNode } from 'react';

type View = 'input' | 'dashboard';

interface AppShellProps {
  children: ReactNode;
  view: View;
  onViewChange: (view: View) => void;
  mode: 'demo' | 'user';
}

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
            <button
              type="button"
              onClick={() => onViewChange('input')}
              className={`pb-2 text-sm font-medium border-b-2 ${
                view === 'input'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Plan
            </button>
            <button
              type="button"
              onClick={() => onViewChange('dashboard')}
              className={`pb-2 text-sm font-medium border-b-2 ${
                view === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
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
