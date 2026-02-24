import { useState, useMemo } from 'react';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, ExpenseProfileSchema } from '@storage/index';
import { Card, CardContent } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { ExpenseCategoriesSubForm } from './expenses/ExpenseCategoriesSubForm';
import { ExpenseSettingsSubForm } from './expenses/ExpenseSettingsSubForm';
import type { ExpenseProfile } from '@fedplan/models';

const CATEGORY_LABELS = {
  'housing': 'Housing',
  'transportation': 'Transportation',
  'food': 'Food',
  'healthcare': 'Healthcare',
  'insurance': 'Insurance',
  'travel-leisure': 'Travel & Leisure',
  'utilities': 'Utilities',
  'personal-care': 'Personal Care',
  'gifts-charitable': 'Gifts & Charitable',
  'other': 'Other',
} as const;

function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function ExpensesForm() {
  const [activeSubTab, setActiveSubTab] = useState('categories');
  const [storedConfig] = useLocalStorage(STORAGE_KEYS.EXPENSE_PROFILE, ExpenseProfileSchema);

  const totalAnnual = useMemo(
    () => storedConfig?.categories?.reduce((sum, c) => sum + c.annualAmount, 0) ?? 0,
    [storedConfig?.categories],
  );
  const totalMonthly = totalAnnual / 12;

  return (
    <div className="space-y-4">
      {/* ── Totals banner (always visible, read-only) ───────────────────── */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Annual Total</div>
              <div className={`text-2xl font-bold ${totalAnnual > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                {formatUSD(totalAnnual)}
              </div>
            </div>
            <Badge variant={totalMonthly > 0 ? 'default' : 'secondary'}>
              Monthly: {formatUSD(totalMonthly)}
            </Badge>
            {totalAnnual === 0 && (
              <Alert className="flex-1">
                <AlertDescription>
                  Enter your expected retirement expenses below. These drive the income-vs-expense projection.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Sub-tabs for categories and settings ──────────────────────── */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Expense Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your annual expense categories and inflation assumptions.
          </p>
        </div>

        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-muted p-0 h-auto">
            <TabsTrigger value="categories" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Categories
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="p-6 border-none">
            <ExpenseCategoriesSubForm />
          </TabsContent>
          <TabsContent value="settings" className="p-6 border-none">
            <ExpenseSettingsSubForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
