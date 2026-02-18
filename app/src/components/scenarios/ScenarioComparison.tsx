/**
 * Scenario Comparison
 * 2-column metric table comparing baseline vs. selected scenario.
 */

import { useState } from 'react';
import { useScenarioManager } from '@hooks/useScenarioManager';
import { useLocalStorage } from '@hooks/useLocalStorage';
import { STORAGE_KEYS, NamedScenariosArraySchema } from '@storage/index';
import {
  computeMetricDelta,
  formatMetric,
  formatDelta,
  METRIC_GROUPS,
  prettifyMetricName,
} from '@utils/scenario-comparison';
import { AlertCircle } from 'lucide-react';

export function ScenarioComparison() {
  const [scenarios] = useLocalStorage(STORAGE_KEYS.NAMED_SCENARIOS, NamedScenariosArraySchema);
  const { getBaseline, getComparisonMetrics } = useScenarioManager();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const baseline = getBaseline();
  const selected = scenarios?.find((s) => s.id === selectedScenarioId);

  if (!baseline) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 p-6 flex gap-4">
        <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
            No Baseline Scenario
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Save at least one scenario first, then set it as baseline to enable comparison.
          </p>
        </div>
      </div>
    );
  }

  const baselineMetrics = getComparisonMetrics(baseline);
  const selectedMetrics = selected ? getComparisonMetrics(selected) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Scenario Comparison</h2>

      {/* Scenario Selector */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Baseline Scenario
            </label>
            <div className="p-3 rounded-lg bg-muted border border-blue-500">
              <p className="font-semibold text-foreground">{baseline.label}</p>
              {baseline.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {baseline.description}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Compare To
            </label>
            <select
              value={selectedScenarioId ?? ''}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a scenario...</option>
              {(scenarios ?? [])
                .filter((s) => s.id !== baseline.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!selected ? (
        <div className="rounded-lg border border-dashed border-border bg-muted p-8 text-center">
          <p className="text-muted-foreground">
            Select a scenario above to compare metrics side-by-side.
          </p>
        </div>
      ) : (
        <>
          {/* Comparison Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">
                    Metric
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">
                    {baseline.label}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">
                    {selected.label}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody>
                {METRIC_GROUPS.map((group, groupIdx) => (
                  <tbody key={group.group}>
                    {/* Group Header */}
                    {groupIdx > 0 && (
                      <tr>
                        <td colSpan={4} className="h-1 bg-border" />
                      </tr>
                    )}
                    <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                      <td colSpan={4} className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">
                        {group.group}
                      </td>
                    </tr>

                    {/* Metric Rows */}
                    {group.metrics.map((metricName) => {
                      const baselineValue = baselineMetrics[metricName];
                      const selectedValue = selectedMetrics?.[metricName];
                      const delta = selectedMetrics
                        ? computeMetricDelta(metricName, baselineMetrics, selectedMetrics)
                        : ({
                            label: metricName,
                            baselineValue: typeof baselineValue === 'number' ? baselineValue : null,
                            comparisonValue: null,
                            deltaValue: 0,
                            deltaPercentage: 0,
                            isImprovement: false,
                          } as any);

                      const deltaClass = delta.isImprovement
                        ? 'text-green-700 dark:text-green-400'
                        : delta.deltaValue !== 0
                          ? 'text-red-700 dark:text-red-400'
                          : '';

                      return (
                        <tr key={metricName} className="border-b border-border hover:bg-muted/50">
                          <td className="px-4 py-2 text-foreground">
                            {prettifyMetricName(metricName)}
                          </td>
                          <td className="text-right px-4 py-2 font-mono text-foreground">
                            {formatMetric(metricName, baselineValue)}
                          </td>
                          <td className="text-right px-4 py-2 font-mono text-foreground">
                            {formatMetric(metricName, selectedValue)}
                          </td>
                          <td
                            className={`text-right px-4 py-2 font-mono font-semibold ${deltaClass}`}
                          >
                            {formatDelta(delta)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="rounded-lg border border-border bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <strong>▲ Green</strong> = improvement for this metric &nbsp;&nbsp;
              <strong>▼ Red</strong> = disadvantage for this metric
            </p>
          </div>
        </>
      )}
    </div>
  );
}
