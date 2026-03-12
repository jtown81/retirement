import { useState, useMemo } from 'react';
import { useSavedScenarios } from '@hooks/useSavedScenarios';
import { unifiedRetirementSimulation } from '@modules/simulation';
import type { SimulationConfig } from '@models/simulation';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { X } from 'lucide-react';

// ── Formatters ───────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return fmt(n);
};

const fmtPct = (rate: number) => `${(rate * 100).toFixed(1)}%`;

// ── Component ────────────────────────────────────────────────────────────

interface ScenarioComparisonProps {
  currentConfig: SimulationConfig;
  birthYear: number;
  ssClaimingAge: number;
  survivorBenefitOption: 'none' | 'partial' | 'full';
}

export function ScenarioComparison({ currentConfig }: ScenarioComparisonProps) {
  const { scenarios, saveScenario, deleteScenario } = useSavedScenarios();
  const [inputLabel, setInputLabel] = useState('');

  const handleSave = () => {
    if (inputLabel.trim() === '') return;
    if (scenarios.length >= 5) return;
    saveScenario(inputLabel.trim(), currentConfig);
    setInputLabel('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  // Compute results for all saved scenarios
  const results = useMemo(
    () => scenarios.map((s) => unifiedRetirementSimulation(s.config)),
    [scenarios],
  );

  // Determine winner badges
  const longestLastingIndex = results.findIndex((r) => r.depletionAge === null) ?? -1;
  const bestNetIndex = results.reduce((best, r, i) => {
    const netSurplus = r.totalLifetimeIncome - r.totalLifetimeExpenses;
    const bestSurplus = results[best].totalLifetimeIncome - results[best].totalLifetimeExpenses;
    return netSurplus > bestSurplus ? i : best;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Save row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Save Scenario</label>
          <Input
            placeholder="e.g., Retire at 62"
            value={inputLabel}
            onChange={(e) => setInputLabel(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={scenarios.length >= 5}
            className="text-sm"
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={scenarios.length >= 5 || inputLabel.trim() === ''}
        >
          Save
        </Button>
      </div>

      {/* Scenario cards */}
      {scenarios.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario, i) => {
            const cfg = scenario.config;
            return (
              <div
                key={scenario.id}
                className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border text-xs"
              >
                <div className="flex-1">
                  <div className="font-medium">{scenario.label}</div>
                  <div className="text-muted-foreground space-x-2 flex flex-wrap">
                    <span>Age {cfg.retirementAge}</span>
                    <span>•</span>
                    <span>TSP {fmtK(cfg.tspBalanceAtRetirement)}</span>
                    <span>•</span>
                    <span>WR {fmtPct(cfg.withdrawalRate)}</span>
                    <span>•</span>
                    <span>ROI {fmtPct(cfg.highRiskROI)}</span>
                    <span>•</span>
                    <span>COLA {fmtPct(cfg.colaRate)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteScenario(scenario.id)}
                  className="p-1 hover:bg-destructive/20 rounded text-destructive"
                  aria-label="Delete scenario"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison table */}
      {scenarios.length >= 1 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-muted">
                  <TableHead className="text-xs font-semibold">Metric</TableHead>
                  {scenarios.map((scenario, i) => (
                    <TableHead key={scenario.id} className="text-xs font-semibold text-right">
                      <div className="font-medium">{scenario.label}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs font-medium">Retirement Age</TableCell>
                  {scenarios.map((scenario) => (
                    <TableCell key={scenario.id} className="text-xs text-right">
                      {scenario.config.retirementAge}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell className="text-xs font-medium">TSP Depletes</TableCell>
                  {results.map((result, i) => {
                    const badge = longestLastingIndex === i ? ' 🏆' : '';
                    return (
                      <TableCell key={scenarios[i].id} className="text-xs text-right">
                        {result.depletionAge === null ? `Never${badge}` : `Age ${result.depletionAge}`}
                      </TableCell>
                    );
                  })}
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium">Balance at 85</TableCell>
                  {results.map((result) => (
                    <TableCell
                      key={scenarios[results.indexOf(result)].id}
                      className={`text-xs text-right font-medium ${
                        result.balanceAt85 > 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'
                      }`}
                    >
                      {fmtK(result.balanceAt85)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell className="text-xs font-medium">Lifetime Income</TableCell>
                  {results.map((result) => (
                    <TableCell
                      key={scenarios[results.indexOf(result)].id}
                      className="text-xs text-right font-medium"
                    >
                      {fmtK(result.totalLifetimeIncome)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow>
                  <TableCell className="text-xs font-medium">Lifetime Expenses</TableCell>
                  {results.map((result) => (
                    <TableCell
                      key={scenarios[results.indexOf(result)].id}
                      className="text-xs text-right font-medium"
                    >
                      {fmtK(result.totalLifetimeExpenses)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell className="text-xs font-medium">Net Surplus</TableCell>
                  {results.map((result, i) => {
                    const netSurplus = result.totalLifetimeIncome - result.totalLifetimeExpenses;
                    const badge = bestNetIndex === i ? ' 🏆' : '';
                    return (
                      <TableCell
                        key={scenarios[i].id}
                        className={`text-xs text-right font-medium ${
                          netSurplus >= 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'
                        }`}
                      >
                        {fmtK(netSurplus)}
                        {badge}
                      </TableCell>
                    );
                  })}
                </TableRow>

                {results.some((r) => r.years.some((y) => y.afterTaxSurplus !== undefined)) && (
                  <TableRow className="bg-muted/50">
                    <TableCell className="text-xs font-medium">After-Tax Net</TableCell>
                    {results.map((result, i) => {
                      const hasAfterTax = result.years.some((y) => y.afterTaxSurplus !== undefined);
                      const total = hasAfterTax
                        ? result.years.reduce((s, y) => s + (y.afterTaxSurplus ?? 0), 0)
                        : null;
                      return (
                        <TableCell
                          key={scenarios[i].id}
                          className={`text-xs text-right font-medium ${
                            total === null ? 'text-muted-foreground' : total >= 0 ? 'text-green-700 dark:text-green-400' : 'text-destructive'
                          }`}
                        >
                          {total === null ? '—' : fmtK(total)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
