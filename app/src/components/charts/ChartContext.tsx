/**
 * Chart Context
 * Provides shared theme and font configuration to all chart components
 * to reduce redundant hook instantiations (MutationObservers, resize listeners)
 */

import { createContext, ReactNode, useContext } from 'react';
import { useChartTheme, type ChartTheme } from '@hooks/useChartTheme';
import { useResponsiveChartFontSize, type ResponsiveChartConfig } from '@hooks/useResponsiveChartFontSize';

export interface ChartContextValue {
  theme: ChartTheme;
  fontConfig: ResponsiveChartConfig;
}

const ChartContext = createContext<ChartContextValue | null>(null);

export function ChartProvider({ children }: { children: ReactNode }) {
  const theme = useChartTheme();
  const fontConfig = useResponsiveChartFontSize();

  return (
    <ChartContext.Provider value={{ theme, fontConfig }}>
      {children}
    </ChartContext.Provider>
  );
}

export function useChart(): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) {
    throw new Error('useChart must be used inside <ChartProvider>');
  }
  return ctx;
}
