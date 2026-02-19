/**
 * useResponsiveChartFontSize
 *
 * Provides responsive font sizing and label configuration for Recharts
 * based on viewport width to prevent label overlap on mobile screens.
 *
 * - Mobile (<400px): fontSize=10, interval=4 (thin out labels)
 * - Tablet (400px-768px): fontSize=11, interval=1
 * - Desktop (768px+): fontSize=12, interval=0 (show all labels)
 *
 * Usage:
 *   const config = useResponsiveChartFontSize();
 *   <XAxis
 *     dataKey="year"
 *     tick={{ fontSize: config.fontSize }}
 *     interval={config.interval}
 *   />
 */

import { useEffect, useState } from 'react';

export interface ResponsiveChartConfig {
  fontSize: 10 | 11 | 12;
  interval: 0 | 1 | 4;
  shouldThinLabels: boolean;
}

export function useResponsiveChartFontSize(): ResponsiveChartConfig {
  const [config, setConfig] = useState<ResponsiveChartConfig>({
    fontSize: 12,
    interval: 0,
    shouldThinLabels: false,
  });

  useEffect(() => {
    const updateConfig = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;

      if (width < 400) {
        // Mobile: very small fonts, thin out labels heavily
        setConfig({
          fontSize: 10,
          interval: 4, // Show every 5th label
          shouldThinLabels: true,
        });
      } else if (width < 768) {
        // Tablet: medium fonts, some label thinning
        setConfig({
          fontSize: 11,
          interval: 1, // Show every other label
          shouldThinLabels: false,
        });
      } else {
        // Desktop: full-size fonts, show all labels
        setConfig({
          fontSize: 12,
          interval: 0, // Show all labels
          shouldThinLabels: false,
        });
      }
    };

    // Initial call
    updateConfig();

    // Listen for window resize
    window.addEventListener('resize', updateConfig);
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  return config;
}
