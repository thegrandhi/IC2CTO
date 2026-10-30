// Colors resolve to plain strings (iOS system color values) so they also work in
// animated styles and on web. Lime is the one accent, carried over from the web app.
import { useColorScheme } from 'react-native';
import { useAppSelector } from './store';

const light = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  fill: 'rgba(118,118,128,0.12)',
  fillStrong: 'rgba(118,118,128,0.2)',
  label: '#000000',
  secondary: 'rgba(60,60,67,0.6)',
  tertiary: 'rgba(60,60,67,0.3)',
  separator: 'rgba(60,60,67,0.29)',
  accent: '#4D7C0F',
  onAccent: '#FFFFFF',
  accentSoft: 'rgba(77,124,15,0.12)',
  pass: '#248A3D',
  passSoft: 'rgba(52,199,89,0.14)',
  fail: '#D70015',
  failSoft: 'rgba(255,59,48,0.12)',
  warn: '#B25000',
  warnSoft: 'rgba(255,149,0,0.14)',
  code: '#E5E5EA',
  cat: { c1: '#0969DA', c2: '#8250DF', c3: '#BC4C00', c4: '#0A7B83', c5: '#BF3989', c6: '#4D7C0F', c7: '#9A6700' } as Record<string, string>,
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#000000',
  card: '#1C1C1E',
  elevated: '#2C2C2E',
  fill: 'rgba(118,118,128,0.24)',
  fillStrong: 'rgba(118,118,128,0.36)',
  label: '#FFFFFF',
  secondary: 'rgba(235,235,245,0.6)',
  tertiary: 'rgba(235,235,245,0.3)',
  separator: 'rgba(84,84,88,0.6)',
  accent: '#A3E635',
  onAccent: '#10150A',
  accentSoft: 'rgba(163,230,53,0.14)',
  pass: '#30D158',
  passSoft: 'rgba(48,209,88,0.16)',
  fail: '#FF453A',
  failSoft: 'rgba(255,69,58,0.16)',
  warn: '#FF9F0A',
  warnSoft: 'rgba(255,159,10,0.16)',
  code: '#2C2C2E',
  cat: { c1: '#58A6FF', c2: '#BC8CFF', c3: '#F0883E', c4: '#39C5CF', c5: '#FF7EB6', c6: '#A3E635', c7: '#F2CC60' },
};

export function useScheme(): 'light' | 'dark' {
  const setting = useAppSelector((s) => s.settings.theme);
  const system = useColorScheme();
  if (setting !== 'system') return setting;
  return system === 'light' ? 'light' : 'dark';
}

export function useColors(): Palette {
  return useScheme() === 'dark' ? dark : light;
}

/** One radius scale: actions are pills, cards 20, rows and options 14, chips and code 8. */
export const radius = { card: 20, row: 14, chip: 8 } as const;
export const space = 16;
export const mono = process.env.EXPO_OS === 'ios' ? 'Menlo' : 'monospace';
