/**
 * Projection Table
 * Sortable, paginated table displaying full retirement projection (40 years).
 */

import { memo, useState, useMemo } from 'react';
import { exportProjectionCSV, triggerPrint } from '@utils/export';
import { Button } from '@components/ui/button';
import { ArrowUpDown, Download, Printer, AlertTriangle } from 'lucide-react';
import type { SimulationYearResult } from '@models/simulation';

export interface ProjectionTableProps {
  years: SimulationYearResult[];
}

type SortKey =
  | 'year'
  | 'age'
  | 'income'
  | 'tax'
  | 'afterTax'
  | 'surplus'
  | 'balance';
type SortOrder = 'asc' | 'desc';

function ProjectionTableComponent({ years }: ProjectionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [showAll, setShowAll] = useState(false);

  // Sorting logic
  const sorted = useMemo(() => {
    const copy = [...years];
    copy.sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortKey) {
        case 'year':
          aVal = a.year;
          bVal = b.year;
          break;
        case 'age':
          aVal = a.age;
          bVal = b.age;
          break;
        case 'income':
          aVal = a.totalIncome;
          bVal = b.totalIncome;
          break;
        case 'tax':
          aVal = a.federalTax + a.stateTax + a.irmaaSurcharge;
          bVal = b.federalTax + b.stateTax + b.irmaaSurcharge;
          break;
        case 'afterTax':
          aVal = a.afterTaxIncome;
          bVal = b.afterTaxIncome;
          break;
        case 'surplus':
          aVal = a.surplus;
          bVal = b.surplus;
          break;
        case 'balance':
          aVal = a.totalTSPBalance;
          bVal = b.totalTSPBalance;
          break;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return copy;
  }, [years, sortKey, sortOrder]);

  // Pagination
  const visibleYears = showAll ? sorted : sorted.slice(0, pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleSortKeyDown = (e: React.KeyboardEvent, key: SortKey) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSort(key);
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="text-muted-foreground">⬍</span>;
    return sortOrder === 'asc' ? (
      <span className="text-blue-600 dark:text-blue-400">▲</span>
    ) : (
      <span className="text-blue-600 dark:text-blue-400">▼</span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll ? 'Show Per-Page' : 'Show All'}
          </Button>
          {!showAll && (
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-border rounded-lg bg-background text-foreground"
              aria-label="Rows per page"
            >
              <option value={10}>10 rows/page</option>
              <option value={20}>20 rows/page</option>
              <option value={40}>All years</option>
            </select>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportProjectionCSV(sorted)}
            className="gap-2"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerPrint('FedRetire Retirement Projection')}
            className="gap-2"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Print / PDF</span>
          </Button>
        </div>
      </div>

      {/* Table: Hidden on mobile, visible on sm+ breakpoint */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th
                scope="col"
                className="text-left px-3 py-2 font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort('year')}
                onKeyDown={(e) => handleSortKeyDown(e, 'year')}
                aria-sort={sortKey === 'year' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                role="columnheader"
              >
                <div className="flex items-center justify-between">
                  Year
                  <SortIcon k="year" />
                </div>
              </th>
              <th
                scope="col"
                className="text-right px-3 py-2 font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort('age')}
                onKeyDown={(e) => handleSortKeyDown(e, 'age')}
                aria-sort={sortKey === 'age' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                role="columnheader"
              >
                <div className="flex items-center justify-between">
                  Age
                  <SortIcon k="age" />
                </div>
              </th>
              <th scope="col" className="text-right px-3 py-2 font-semibold">Annuity</th>
              <th scope="col" className="text-right px-3 py-2 font-semibold">FERS Suppl</th>
              <th scope="col" className="text-right px-3 py-2 font-semibold">Social Sec</th>
              <th scope="col" className="text-right px-3 py-2 font-semibold">TSP Draw</th>
              <th
                scope="col"
                className="text-right px-3 py-2 font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort('income')}
                onKeyDown={(e) => handleSortKeyDown(e, 'income')}
                aria-sort={sortKey === 'income' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                role="columnheader"
              >
                <div className="flex items-center justify-between">
                  Gross Income
                  <SortIcon k="income" />
                </div>
              </th>
              <th
                scope="col"
                className="text-right px-3 py-2 font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort('tax')}
                onKeyDown={(e) => handleSortKeyDown(e, 'tax')}
                aria-sort={sortKey === 'tax' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                role="columnheader"
              >
                <div className="flex items-center justify-between">
                  Total Tax
                  <SortIcon k="tax" />
                </div>
              </th>
              <th
                scope="col"
                className="text-right px-3 py-2 font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort('afterTax')}
                onKeyDown={(e) => handleSortKeyDown(e, 'afterTax')}
                aria-sort={sortKey === 'afterTax' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                role="columnheader"
              >
                <div className="flex items-center justify-between">
                  After-Tax
                  <SortIcon k="afterTax" />
                </div>
              </th>
              <th scope="col" className="text-right px-3 py-2 font-semibold">Expenses</th>
              <th
                scope="col"
                className="text-right px-3 py-2 font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort('surplus')}
                onKeyDown={(e) => handleSortKeyDown(e, 'surplus')}
                aria-sort={sortKey === 'surplus' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                role="columnheader"
              >
                <div className="flex items-center justify-between">
                  Surplus
                  <SortIcon k="surplus" />
                </div>
              </th>
              <th
                scope="col"
                className="text-right px-3 py-2 font-semibold cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleSort('balance')}
                onKeyDown={(e) => handleSortKeyDown(e, 'balance')}
                aria-sort={sortKey === 'balance' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                tabIndex={0}
                role="columnheader"
              >
                <div className="flex items-center justify-between">
                  TSP Balance
                  <SortIcon k="balance" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleYears.map((year, idx) => {
              const deficitRow = year.surplus < 0;
              const tspGrowthRow =
                idx > 0 && year.totalTSPBalance > visibleYears[idx - 1].totalTSPBalance;

              return (
                <tr
                  key={year.year}
                  className={`border-b border-border transition-colors ${
                    deficitRow
                      ? 'bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900'
                      : tspGrowthRow
                        ? 'bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900'
                        : 'hover:bg-muted'
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-foreground">{year.year}</td>
                  <td className="text-right px-3 py-2 text-foreground">
                    {Math.round(year.age)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-foreground">
                    ${fmt(year.annuity)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-foreground">
                    ${fmt(year.fersSupplement)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-foreground">
                    ${fmt(year.socialSecurity)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-foreground">
                    ${fmt(year.tspWithdrawal)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums font-medium text-foreground">
                    ${fmt(year.totalIncome)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-red-700 dark:text-red-300">
                    ${fmt(year.federalTax + year.stateTax + year.irmaaSurcharge)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums font-medium text-foreground">
                    ${fmt(year.afterTaxIncome)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-foreground">
                    ${fmt(year.totalExpenses)}
                  </td>
                  <td
                    className={`text-right px-3 py-2 tabular-nums font-semibold ${
                      deficitRow
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-green-700 dark:text-green-300'
                    }`}
                  >
                    {deficitRow && (
                      <>
                        <AlertTriangle className="inline w-3 h-3 mr-0.5" aria-hidden="true" />
                        <span className="sr-only">deficit </span>
                      </>
                    )}
                    ${fmt(year.surplus)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-foreground">
                    ${fmt(year.totalTSPBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View: Visible only on small screens */}
      <div className="sm:hidden space-y-3">
        {visibleYears.map((year, idx) => {
          const deficitRow = year.surplus < 0;
          const tspGrowthRow =
            idx > 0 && year.totalTSPBalance > visibleYears[idx - 1].totalTSPBalance;

          const bgClass = deficitRow
            ? 'bg-red-50 dark:bg-red-950'
            : tspGrowthRow
              ? 'bg-green-50 dark:bg-green-950'
              : 'bg-muted/30';

          return (
            <div
              key={year.year}
              className={`rounded-lg border border-border p-3 space-y-2 ${bgClass}`}
            >
              {/* Header: Year and Age */}
              <div className="flex justify-between items-center font-semibold">
                <span className="text-foreground">Year {year.year}</span>
                <span className="text-sm text-muted-foreground">Age {Math.round(year.age)}</span>
              </div>

              {/* Income Row */}
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border/30">
                <div>
                  <span className="text-xs text-muted-foreground">Gross Income</span>
                  <p className="font-medium tabular-nums">${fmt(year.totalIncome)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">After-Tax</span>
                  <p className="font-medium tabular-nums">${fmt(year.afterTaxIncome)}</p>
                </div>
              </div>

              {/* Expenses & Surplus Row */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Expenses</span>
                  <p className="tabular-nums">${fmt(year.totalExpenses)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Surplus</span>
                  <p
                    className={`font-semibold tabular-nums ${
                      deficitRow
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-green-700 dark:text-green-300'
                    }`}
                  >
                    ${fmt(year.surplus)}
                  </p>
                </div>
              </div>

              {/* TSP Balance Row */}
              <div className="text-sm pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">TSP Balance</span>
                <p className="font-medium tabular-nums">${fmt(year.totalTSPBalance)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination info */}
      {!showAll && (
        <div className="text-sm text-muted-foreground flex justify-between items-center">
          <span>
            Showing {Math.min(pageSize, sorted.length)} of {sorted.length} years
          </span>
          {totalPages > 1 && (
            <div className="text-xs text-muted-foreground">
              {totalPages} page{totalPages > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Print hint */}
      <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
        <p>💡 Tip: Use your browser's print function (Ctrl+P / Cmd+P) to save as PDF.</p>
      </div>
    </div>
  );
}

export const ProjectionTable = memo(ProjectionTableComponent);

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
