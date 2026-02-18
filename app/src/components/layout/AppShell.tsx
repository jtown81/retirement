import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Button } from '@components/ui/button';
import { ClipboardList, Calendar, LayoutDashboard, Sun, Moon, GitBranch } from 'lucide-react';

export type View = 'input' | 'leave' | 'dashboard' | 'scenarios';

interface AppShellProps {
  children: ReactNode;
  view: View;
  onViewChange: (view: View) => void;
  mode: 'demo' | 'user';
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'input', label: 'My Plan', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'leave', label: 'Leave', icon: <Calendar className="w-4 h-4" /> },
  { id: 'scenarios', label: 'Scenarios', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
];

export function AppShell({
  children,
  view,
  onViewChange,
  mode,
  theme = 'system',
  onThemeChange,
}: AppShellProps) {
  const handleThemeToggle = () => {
    if (onThemeChange) {
      onThemeChange(theme === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">
              Federal Retirement Planner
            </h1>
            {onThemeChange && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          <Tabs value={view} onValueChange={(value) => onViewChange(value as View)} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              {NAV_ITEMS.map((item) => (
                <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2">
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        {children}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-muted-foreground">
          Federal Retirement Planner — {mode === 'demo' ? 'Demo Mode' : 'Your Plan'}
        </div>
      </footer>
    </div>
  );
}
