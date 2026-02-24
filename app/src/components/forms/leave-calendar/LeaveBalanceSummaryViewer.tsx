/**
 * LeaveBalanceSummaryViewer — Toggle between pie chart and table views
 * for annual and sick leave balance summary.
 */

import { useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { Button } from '@components/ui/button';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@lib/utils';
import type { CalendarYearSummary } from '@fedplan/leave';

interface LeaveBalanceSummaryViewerProps {
  summary: CalendarYearSummary;
}

function StatItem({
  label,
  value,
  color,
  warning,
}: {
  label: string;
  value: number;
  color?: string;
  warning?: boolean;
}) {
  return (
    <div className="text-center min-w-0">
      <div className="text-xs text-muted-foreground whitespace-normal break-words">{label}</div>
      <div
        className={cn(
          'text-sm font-semibold',
          warning ? 'text-red-600 dark:text-red-400' : color ?? 'text-foreground',
        )}
      >
        {value.toFixed(0)}
      </div>
    </div>
  );
}

function TableView({ summary }: { summary: CalendarYearSummary }) {
  return (
    <div className="space-y-2">
      {/* Annual Leave Row */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 rounded-md px-3 py-2">
        <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Annual Leave</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <StatItem label="Carry-over" value={summary.annualCarryOver} />
          <StatItem label="Accrued" value={summary.annualAccrued} color="text-green-700 dark:text-green-400" />
          <StatItem label="Planned" value={summary.plannedAnnualUsed} color="text-blue-600 dark:text-blue-400" />
          <StatItem label="Actual" value={summary.actualAnnualUsed} color="text-green-600 dark:text-green-400" />
          <StatItem label="Proj. EOY" value={summary.projectedAnnualEOY} />
          <StatItem
            label="Use/Lose"
            value={summary.useOrLoseHours}
            warning={summary.useOrLoseHours > 0}
          />
        </div>
      </div>

      {/* Sick Leave Row */}
      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-800 rounded-md px-3 py-2">
        <div className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-2">Sick Leave</div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          <StatItem label="Carry-over" value={summary.sickCarryOver} />
          <StatItem label="Accrued" value={summary.sickAccrued} color="text-green-700 dark:text-green-400" />
          <StatItem label="LS Planned" value={summary.plannedSickLS} color="text-orange-600 dark:text-orange-400" />
          <StatItem label="LS Actual" value={summary.actualSickLS} color="text-red-600 dark:text-red-400" />
          <StatItem label="DE Planned" value={summary.plannedSickDE} color="text-orange-600 dark:text-orange-400" />
          <StatItem label="DE Actual" value={summary.actualSickDE} color="text-red-600 dark:text-red-400" />
          <StatItem label="Proj. EOY" value={summary.projectedSickEOY} />
        </div>
      </div>
    </div>
  );
}

function PieChartView({ summary }: { summary: CalendarYearSummary }) {
  // Annual Leave pie data
  const annualData = [
    { name: 'Carry-over', value: Math.max(0, summary.annualCarryOver) },
    { name: 'Accrued', value: Math.max(0, summary.annualAccrued) },
    { name: 'Planned Used', value: Math.max(0, summary.plannedAnnualUsed) },
    { name: 'Actual Used', value: Math.max(0, summary.actualAnnualUsed) },
    { name: 'Proj. EOY', value: Math.max(0, summary.projectedAnnualEOY) },
  ].filter((d) => d.value > 0);

  // Sick Leave pie data
  const sickData = [
    { name: 'Carry-over', value: Math.max(0, summary.sickCarryOver) },
    { name: 'Accrued', value: Math.max(0, summary.sickAccrued) },
    { name: 'LS Planned', value: Math.max(0, summary.plannedSickLS) },
    { name: 'LS Actual', value: Math.max(0, summary.actualSickLS) },
    { name: 'DE Planned', value: Math.max(0, summary.plannedSickDE) },
    { name: 'DE Actual', value: Math.max(0, summary.actualSickDE) },
    { name: 'Proj. EOY', value: Math.max(0, summary.projectedSickEOY) },
  ].filter((d) => d.value > 0);

  const annualColors = ['#3b82f6', '#10b981', '#60a5fa', '#4ade80', '#93c5fd'];
  const sickColors = ['#f97316', '#10b981', '#fb923c', '#ef4444', '#fbbf24', '#ef5350', '#fed7aa'];

  return (
    <div className="space-y-6">
      {/* Annual Leave Pie Chart */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Annual Leave Distribution</h3>
        {annualData.length > 0 ? (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 rounded-md p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={annualData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(0)}h`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {annualData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={annualColors[index % annualColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toFixed(0)}h`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No annual leave data to display</p>
        )}
      </div>

      {/* Sick Leave Pie Chart */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200">Sick Leave Distribution</h3>
        {sickData.length > 0 ? (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-800 rounded-md p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sickData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(0)}h`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sickData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={sickColors[index % sickColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toFixed(0)}h`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No sick leave data to display</p>
        )}
      </div>
    </div>
  );
}

export function LeaveBalanceSummaryViewer({ summary }: LeaveBalanceSummaryViewerProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  return (
    <div className="space-y-2">
      {/* Toggle Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => setViewMode('table')}
          className="gap-2"
        >
          <Table2 className="w-4 h-4" />
          Table
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'chart' ? 'default' : 'outline'}
          onClick={() => setViewMode('chart')}
          className="gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Charts
        </Button>
      </div>

      {/* Content */}
      {viewMode === 'table' && <TableView summary={summary} />}
      {viewMode === 'chart' && <PieChartView summary={summary} />}
    </div>
  );
}
