// App state persisted on the device with expo-sqlite's key-value store. The shape and
// keys match the web app's localStorage state, so backups move between the two.
import { useSyncExternalStore } from 'react';
import { kv } from './kv';
import { schedule, todayStr, type SrsCard } from './shared';

export interface DesignAttempt {
  at: string;
  /** Whiteboard: rubric items ticked. Guided: interview items answered fully right. */
  checked: number[];
  total: number;
  minutes: number;
  mode?: 'guided' | 'whiteboard';
  /** 0–1. Guided interviews give partial credit, so this can differ from checked/total. */
  score?: number;
}

export const attemptScore = (a: DesignAttempt) => a.score ?? a.checked.length / a.total;

export interface QuestionProgress {
  srs: SrsCard;
  seen: number;
  correct: number;
  lastCorrect: boolean;
}

export interface DayActivity {
  problems: number;
  reviews: number;
  quiz: number;
  quizCorrect: number;
  designs: number;
  lessons: number;
}

export type ThemeSetting = 'system' | 'light' | 'dark';

export interface Settings {
  lang: 'python' | 'javascript';
  theme: ThemeSetting;
  fontSize: number;
  /** iOS only: haptic feedback on taps and answers. */
  haptics?: boolean;
}

export interface AppState {
  version: 1;
  createdAt: string;
  settings: Settings;
  /** Coding progress from the web app. Kept untouched so backups round-trip. */
  problems: Record<string, unknown>;
  questions: Record<string, QuestionProgress>;
  lessonsRead: Record<string, string>;
  designs: Record<string, DesignAttempt[]>;
  activity: Record<string, DayActivity>;
  /** Daily question log: date → picked question and, once answered, whether it was right. */
  daily: Record<string, { id: string; correct?: boolean }>;
}

// Same prefix as the web app (it keeps the app's former name, Code Gym).
export const STORAGE_PREFIX = 'codegym:';
const KEY = `${STORAGE_PREFIX}state`;

export const storage = {
  get(key: string): string | null {
    try {
      return kv.getItemSync(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): boolean {
    try {
      kv.setItemSync(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
    try {
      kv.removeItemSync(key);
    } catch {
      /* ignore */
    }
  },
  keys(): string[] {
    try {
      return kv.getAllKeysSync().filter((k) => k.startsWith(STORAGE_PREFIX));
    } catch {
      return [];
    }
  },
};

export function defaultState(): AppState {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    settings: { lang: 'python', theme: 'system', fontSize: 14, haptics: true },
    problems: {},
    questions: {},
    lessonsRead: {},
    designs: {},
    activity: {},
    daily: {},
  };
}

function normalize(raw: Partial<AppState>): AppState {
  const d = defaultState();
  return { ...d, ...raw, settings: { ...d.settings, ...raw.settings } };
}

function load(): AppState {
  const raw = storage.get(KEY);
  if (!raw) return defaultState();
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getState(): AppState {
  return state;
}

/** Applies `recipe` to a copy of the state, persists it and notifies subscribers. */
export function update(recipe: (draft: AppState) => void) {
  const next = structuredClone(state);
  recipe(next);
  state = next;
  storage.set(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn());
}

function replaceState(next: AppState) {
  state = normalize(next);
  storage.set(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn());
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/** Subscribes to one slice so screens only re-render when it changes. */
export function useAppSelector<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}

// ------------------------------------------------------------------ helpers

export function dayActivity(s: AppState, date = todayStr()): DayActivity {
  return s.activity[date] ?? { problems: 0, reviews: 0, quiz: 0, quizCorrect: 0, designs: 0, lessons: 0 };
}

function bump(s: AppState, field: keyof DayActivity, n = 1) {
  const date = todayStr();
  const day = dayActivity(s, date);
  s.activity[date] = { ...day, [field]: day[field] + n };
}

export function activityTotal(a: DayActivity | undefined): number {
  if (!a) return 0;
  return a.problems + a.reviews + a.quiz + a.designs + a.lessons;
}

/** Consecutive active days ending today (or yesterday, if today has no activity yet). */
export function streak(s: AppState, today = todayStr()): number {
  let count = 0;
  const d = new Date();
  if (!activityTotal(s.activity[today])) d.setDate(d.getDate() - 1);
  for (;;) {
    if (!activityTotal(s.activity[todayStr(d)])) return count;
    count++;
    d.setDate(d.getDate() - 1);
  }
}

export function recordAnswer(questionId: string, correct: boolean, opts: { daily?: boolean } = {}) {
  update((s) => {
    const prev = s.questions[questionId];
    s.questions[questionId] = {
      srs: schedule(prev?.srs, correct ? 'good' : 'again', todayStr(), 'quiz'),
      seen: (prev?.seen ?? 0) + 1,
      correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
      lastCorrect: correct,
    };
    bump(s, 'quiz');
    if (correct) bump(s, 'quizCorrect');
    if (opts.daily) s.daily[todayStr()] = { id: questionId, correct };
  });
}

/** Pins today's daily question so it doesn't change during the day. */
export function pinDailyQuestion(questionId: string) {
  const today = todayStr();
  if (state.daily[today]) return;
  update((s) => {
    s.daily[today] = { id: questionId };
  });
}

export function markLessonRead(lessonId: string) {
  update((s) => {
    if (!s.lessonsRead[lessonId]) bump(s, 'lessons');
    s.lessonsRead[lessonId] = todayStr();
  });
}

export function recordDesign(designId: string, attempt: DesignAttempt) {
  update((s) => {
    s.designs[designId] = [...(s.designs[designId] ?? []), attempt].slice(-20);
    bump(s, 'designs');
  });
}

export function updateSettings(patch: Partial<Settings>) {
  update((s) => {
    s.settings = { ...s.settings, ...patch };
  });
}

export const interviewDraftKey = (designId: string) => `${STORAGE_PREFIX}interview:${designId}`;

// ------------------------------------------------------------------ backup

export interface Backup {
  app: 'base-case' | 'code-gym';
  exportedAt: string;
  data: Record<string, string>;
}

/** True for backups from this app, including ones exported under its former name. */
export function isBackup(value: unknown): value is Backup {
  const app = (value as Backup | null)?.app;
  return app === 'base-case' || app === 'code-gym';
}

export function exportBackup(): Backup {
  const data: Record<string, string> = {};
  for (const k of storage.keys()) data[k] = storage.get(k) ?? '';
  return { app: 'base-case', exportedAt: new Date().toISOString(), data };
}

export function importBackup(backup: unknown) {
  if (!isBackup(backup) || typeof backup.data !== 'object') throw new Error('This isn’t a Base Case backup file.');
  const parsed = JSON.parse(backup.data[KEY] ?? 'null');
  if (!parsed || parsed.version !== 1) throw new Error('The backup has no progress in it.');
  for (const k of storage.keys()) storage.remove(k);
  for (const [k, v] of Object.entries(backup.data)) if (k.startsWith(STORAGE_PREFIX)) storage.set(k, v);
  replaceState(parsed);
}

export function resetAll() {
  for (const k of storage.keys()) storage.remove(k);
  replaceState(defaultState());
}
