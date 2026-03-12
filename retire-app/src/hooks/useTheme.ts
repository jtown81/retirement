import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('retire:theme') as Theme) ?? 'system';
  });

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem('retire:theme', t);
    setThemeState(t);
    applyTheme(t);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  return { theme, setTheme } as const;
}
