import { useEffect, useSyncExternalStore } from 'react';
import { useAppState } from './lib/store';

const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function subscribe(fn: () => void) {
  media?.addEventListener('change', fn);
  return () => media?.removeEventListener('change', fn);
}

/** The effective theme after resolving "system". */
export function useResolvedTheme(): 'light' | 'dark' {
  const setting = useAppState().settings.theme;
  const systemDark = useSyncExternalStore(subscribe, () => media?.matches ?? true, () => true);
  return setting === 'system' ? (systemDark ? 'dark' : 'light') : setting;
}

export function useApplyTheme() {
  const theme = useResolvedTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1117' : '#f6f7f9');
  }, [theme]);
}
