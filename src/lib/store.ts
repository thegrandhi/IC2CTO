// App state persisted in localStorage. Everything stays on this device;
// Settings → Backup exports it as JSON.
import { useSyncExternalStore } from 'react';
import { schedule, todayStr, type Rating, type SrsCard } from './srs';
import { LANGS, type Lang } from './types';

export interface Attempt {
  at: string;
  lang: Lang;
  passed: number;
  total: number;
  sec: number;
  rating?: Rating;
  assisted?: boolean;
  mode?: 'practice' | 'review' | 'mock';
}

export interface ProblemProgress {
  status: 'attempted' | 'solved';
  srs?: SrsCard;
  attempts: Attempt[];
  notes?: string;
  solvedAt?: string;
  bestSec?: number;
  starred?: boolean;
}

export interface QuestionProgress {
  srs: SrsCard;
  seen: number;
  correct: number;
  lastCorrect: boolean;
}

export interface DesignAttempt {
  at: string;
  checked: number[];
  total: number;
  minutes: number;
}

export interface DayActivity {
  problems: number;
  reviews: number;
  quiz: number;
  quizCorrect: number;
  designs: number;
  lessons: number;
}

export interface Settings {
  lang: Lang;
  theme: 'system' | 'light' | 'dark';
  fontSize: number;
}

export interface AppState {
  version: 1;
  createdAt: string;
  settings: Settings;
  problems: Record<string, ProblemProgress>;
  questions: Record<string, QuestionProgress>;
  lessonsRead: Record<string, string>;
  designs: Record<string, DesignAttempt[]>;
  activity: Record<string, DayActivity>;
  /** Daily question log: date → picked question and, once answered, whether it was right. */
  daily: Record<string, { id: string; correct?: boolean }>;
}

export const STORAGE_PREFIX = 'codegym:';
const KEY = `${STORAGE_PREFIX}state`;

export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
  keys(): string[] {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
    } catch {
      return [];
    }
  },
};

export function defaultState(): AppState {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    settings: { lang: LANGS[0], theme: 'system', fontSize: 14 },
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
  const settings = { ...d.settings, ...raw.settings };
  if (!LANGS.includes(settings.lang)) settings.lang = LANGS[0];
  return { ...d, ...raw, settings };
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

let state: AppState = typeof window === 'undefined' ? defaultState() : load();
const listeners = new Set<() => void>();
let saveFailed = false;

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getState(): AppState {
  return state;
}

export function storageWorks(): boolean {
  return !saveFailed;
}

/** Applies `recipe` to a copy of the state, persists it and notifies subscribers. */
export function update(recipe: (draft: AppState) => void) {
  const next = structuredClone(state);
  recipe(next);
  state = next;
  saveFailed = !storage.set(KEY, JSON.stringify(state));
  emit();
}

export function replaceState(next: AppState) {
  state = normalize(next);
  storage.set(KEY, JSON.stringify(state));
  emit();
}

if (typeof window !== 'undefined') {
  // Keep multiple open tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      emit();
    }
  });
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
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

export function recordAttempt(problemId: string, attempt: Attempt) {
  update((s) => {
    const p: ProblemProgress = s.problems[problemId] ?? { status: 'attempted', attempts: [] };
    p.attempts = [...p.attempts, attempt].slice(-30);
    if (attempt.passed === attempt.total && attempt.total > 0) {
      if (p.status !== 'solved') {
        p.status = 'solved';
        p.solvedAt = attempt.at;
      }
      if (!attempt.assisted && (!p.bestSec || attempt.sec < p.bestSec)) p.bestSec = attempt.sec;
    }
    s.problems[problemId] = p;
  });
}

/** Called once per solved session with the user's self-rating. */
export function rateProblem(problemId: string, rating: Rating, isReview: boolean) {
  update((s) => {
    const p = s.problems[problemId];
    if (!p) return;
    p.srs = schedule(p.srs, rating, todayStr(), 'problem');
    const last = p.attempts[p.attempts.length - 1];
    if (last) last.rating = rating;
    bump(s, isReview ? 'reviews' : 'problems');
  });
}

export function setProblemField(problemId: string, patch: Partial<Pick<ProblemProgress, 'notes' | 'starred'>>) {
  update((s) => {
    s.problems[problemId] = { ...(s.problems[problemId] ?? { status: 'attempted', attempts: [] }), ...patch };
  });
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

// ------------------------------------------------------------------ drafts (stored separately, written often)

export const draftKey = (problemId: string, lang: Lang) => `${STORAGE_PREFIX}draft:${problemId}:${lang}`;
export const designDraftKey = (designId: string) => `${STORAGE_PREFIX}design:${designId}`;

// ------------------------------------------------------------------ backup

export interface Backup {
  app: 'code-gym';
  exportedAt: string;
  data: Record<string, string>;
}

export function exportBackup(): Backup {
  const data: Record<string, string> = {};
  for (const k of storage.keys()) data[k] = storage.get(k) ?? '';
  return { app: 'code-gym', exportedAt: new Date().toISOString(), data };
}

export function importBackup(backup: Backup) {
  if (backup?.app !== 'code-gym' || typeof backup.data !== 'object') throw new Error('Not a Code Gym backup file.');
  const parsed = JSON.parse(backup.data[KEY] ?? 'null');
  if (!parsed || parsed.version !== 1) throw new Error('Backup has no progress data.');
  for (const k of storage.keys()) storage.remove(k);
  for (const [k, v] of Object.entries(backup.data)) if (k.startsWith(STORAGE_PREFIX)) storage.set(k, v);
  replaceState(parsed);
}

export function resetAll() {
  for (const k of storage.keys()) storage.remove(k);
  replaceState(defaultState());
}
