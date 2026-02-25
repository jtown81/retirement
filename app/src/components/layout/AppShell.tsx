'use client';

import { type ReactNode, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Button } from '@components/ui/button';
import { ClipboardList, LayoutDashboard, Sun, Moon, GitBranch, LogIn } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { UserMenu } from '@components/auth/UserMenu';
import { SignInDialog } from '@components/auth/SignInDialog';
import { AdUnit } from '@components/ads/AdUnit';

export type View = 'input' | 'dashboard' | 'scenarios';

interface AppShellProps {
  children: ReactNode;
  view: View;
  onViewChange: (view: View) => void;
  mode: 'demo' | 'user';
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: 'input', label: 'My Plan', icon: <ClipboardList className="w-4 h-4" aria-hidden="true" /> },
  { id: 'scenarios', label: 'Scenarios', icon: <GitBranch className="w-4 h-4" aria-hidden="true" /> },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> },
];

export function AppShell({
  children,
  view,
  onViewChange,
  mode,
  theme = 'system',
  onThemeChange,
}: AppShellProps) {
  const { isSignedIn, loading } = useAuth();
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

  const handleThemeToggle = () => {
    if (onThemeChange) {
      onThemeChange(theme === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:border focus:rounded focus:text-sm"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">
              Federal Retirement Planner
            </h1>
            <div className="flex items-center gap-2">
              {onThemeChange && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleThemeToggle}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Moon className="w-4 h-4" aria-hidden="true" />
                  )}
                </Button>
              )}
              {!loading && (
                <>
                  {isSignedIn ? (
                    <UserMenu />
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSignInDialogOpen(true)}
                      className="gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <Tabs value={view} onValueChange={(value) => onViewChange(value as View)} className="mt-4" aria-label="Main navigation">
            <TabsList className="grid w-full grid-cols-3">
              {NAV_ITEMS.map((item) => (
                <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2" aria-label={item.label}>
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="sticky top-[73px] z-30 bg-slate-50 dark:bg-slate-900/50 border-b border-border py-2 flex justify-center">
        <AdUnit
          slotId={import.meta.env.PUBLIC_ADSENSE_SLOTS_LEADERBOARD}
          format="leaderboard"
        />
      </div>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 mb-16 md:mb-0">
        {children}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-muted-foreground">
          Federal Retirement Planner — {mode === 'demo' ? 'Demo Mode' : 'Your Plan'}
        </div>
      </footer>

      <SignInDialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen} />

      {/* Anchor ad (mobile, sticky at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center bg-white dark:bg-slate-950 border-t border-border md:hidden">
        <AdUnit
          slotId={import.meta.env.PUBLIC_ADSENSE_SLOTS_ANCHOR}
          format="anchor"
        />
      </div>
    </div>
  );
}
