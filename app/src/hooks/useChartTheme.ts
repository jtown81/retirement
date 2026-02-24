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
  // New colors for expanded dashboard
  annuity: string;
  supplement: string;
  socialSecurity: string;
  tspWithdrawal: string;
  highRisk: string;
  lowRisk: string;
  goGo: string;
  goSlow: string;
  noGo: string;
  rmdRequired: string;
  healthcare: string;
  blanchett: string;
}

const LIGHT_THEME: ChartTheme = {
  gridColor: '#e5e7eb',
  tooltipBg: '#ffffff',
  tooltipForeground: '#1f2937',
  textColor: '#374151',
  borderColor: '#d1d5db',
  income: '#2563eb',
  expenses: '#ea580c',
  salary: '#2563eb',
  traditional: '#2563eb',
  roth: '#059669',
  plannedAnnual: '#60a5fa',
  actualAnnual: '#22c55e',
  plannedSick: '#fb923c',
  actualSick: '#ef4444',
  surplus: '#dcfce7',
  deficit: '#fee2e2',
  holiday: '#d97706',
  annuity: '#1e40af',
  supplement: '#7c3aed',
  socialSecurity: '#06b6d4',
  tspWithdrawal: '#8b5cf6',
  highRisk: '#f59e0b',
  lowRisk: '#10b981',
  goGo: '#10b981',
  goSlow: '#f59e0b',
  noGo: '#9ca3af',
  rmdRequired: '#ef4444',
  healthcare: '#ec4899',
  blanchett: '#64748b',
};

const DARK_THEME: ChartTheme = {
  gridColor: '#374151',
  tooltipBg: '#1f2937',
  tooltipForeground: '#f3f4f6',
  textColor: '#d1d5db',
  borderColor: '#4b5563',
  income: '#60a5fa',
  expenses: '#fb923c',
  salary: '#60a5fa',
  traditional: '#60a5fa',
  roth: '#6ee7b7',
  plannedAnnual: '#93c5fd',
  actualAnnual: '#86efac',
  plannedSick: '#fdba74',
  actualSick: '#fca5a5',
  surplus: '#374151',
  deficit: '#7f1d1d',
  holiday: '#f59e0b',
  annuity: '#3b82f6',
  supplement: '#a78bfa',
  socialSecurity: '#22d3ee',
  tspWithdrawal: '#c084fc',
  highRisk: '#fbbf24',
  lowRisk: '#34d399',
  goGo: '#34d399',
  goSlow: '#fbbf24',
  noGo: '#6b7280',
  rmdRequired: '#f87171',
  healthcare: '#f472b6',
  blanchett: '#94a3b8',
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
