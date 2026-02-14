import { useState, useEffect, useMemo } from 'react';

export interface ChartTheme {
  gridColor: string;
  tooltipBg: string;
  tooltipForeground: string;
  textColor: string;
  borderColor: string;
  income: string;
  expenses: string;
  salary: string;
  traditional: string;
  roth: string;
  plannedAnnual: string;
  actualAnnual: string;
  plannedSick: string;
  actualSick: string;
  surplus: string;
  deficit: string;
  holiday: string;
}

const LIGHT_THEME: ChartTheme = {
  gridColor: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipForeground: '#1f2937',
  textColor: '#374151',
  borderColor: '#d1d5db',
  income: '#16a34a',
  expenses: '#dc2626',
  salary: '#2563eb',
  traditional: '#2563eb',
  roth: '#059669',
  plannedAnnual: '#60a5fa',
  actualAnnual: '#22c55e',
  plannedSick: '#fb923c',
  actualSick: '#ef4444',
  surplus: '#dcfce7',
  deficit: '#fee2e2',
  holiday: '#fbbf24',
};

const DARK_THEME: ChartTheme = {
  gridColor: '#374151',
  tooltipBg: '#1f2937',
  tooltipForeground: '#f3f4f6',
  textColor: '#d1d5db',
  borderColor: '#4b5563',
  income: '#22c55e',
  expenses: '#f87171',
  salary: '#60a5fa',
  traditional: '#60a5fa',
  roth: '#6ee7b7',
  plannedAnnual: '#93c5fd',
  actualAnnual: '#86efac',
  plannedSick: '#fdba74',
  actualSick: '#fca5a5',
  surplus: '#374151',
  deficit: '#7f1d1d',
  holiday: '#fcd34d',
};

export function useChartTheme(): ChartTheme {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const root = document.documentElement;

    // Initial check
    setIsDark(root.classList.contains('dark'));

    // Watch for class changes
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return useMemo(() => (isDark ? DARK_THEME : LIGHT_THEME), [isDark]);
}
