import { useEffect, useSyncExternalStore } from 'react';
import { useAppState } from './lib/store';

const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

// When embedded, the host page may announce its theme on <html data-theme> before we start.
const hostTheme = typeof document !== 'undefined' ? document.documentElement.dataset.theme : undefined;

function subscribe(fn: () => void) {
  media?.addEventListener('change', fn);
  return () => media?.removeEventListener('change', fn);
}

/** The effective theme after resolving "system". */
export function useResolvedTheme(): 'light' | 'dark' {
  const setting = useAppState().settings.theme;
  const systemDark = useSyncExternalStore(subscribe, () => media?.matches ?? true, () => true);
  if (setting !== 'system') return setting;
  if (hostTheme === 'light' || hostTheme === 'dark') return hostTheme;
  return systemDark ? 'dark' : 'light';
}

export function useApplyTheme() {
  const theme = useResolvedTheme();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1117' : '#f6f7f9');
  }, [theme]);
}
