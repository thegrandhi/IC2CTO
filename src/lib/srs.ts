// Spaced repetition (a simplified SM-2) plus local-date helpers.

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];

export interface SrsCard {
  ease: number;
  /** Days until the next review. */
  interval: number;
  /** Local date (YYYY-MM-DD) when the item is due. */
  due: string;
  reps: number;
  lapses: number;
  last: string;
}

/** `problem` ramps up slowly (re-solving takes a while); `quiz` is for 2-minute questions. */
export type SrsProfile = 'problem' | 'quiz';

const FIRST_INTERVAL: Record<SrsProfile, Record<Rating, number>> = {
  problem: { again: 1, hard: 3, good: 7, easy: 14 },
  quiz: { again: 1, hard: 2, good: 4, easy: 8 },
};

const MAX_INTERVAL = 180;

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: string, n: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

export function schedule(card: SrsCard | undefined, rating: Rating, today: string, profile: SrsProfile): SrsCard {
  if (!card || card.reps === 0) {
    const interval = FIRST_INTERVAL[profile][rating];
    return {
      ease: rating === 'again' ? 2.3 : rating === 'hard' ? 2.35 : rating === 'easy' ? 2.65 : 2.5,
      interval,
      due: addDays(today, interval),
      reps: rating === 'again' ? 0 : 1,
      lapses: (card?.lapses ?? 0) + (rating === 'again' ? 1 : 0),
      last: today,
    };
  }
  let { ease, interval, lapses } = card;
  switch (rating) {
    case 'again':
      lapses += 1;
      ease = Math.max(1.3, ease - 0.2);
      interval = 1;
      break;
    case 'hard':
      ease = Math.max(1.3, ease - 0.15);
      interval = Math.max(interval + 1, Math.round(interval * 1.2));
      break;
    case 'good':
      interval = Math.max(interval + 1, Math.round(interval * ease));
      break;
    case 'easy':
      ease += 0.15;
      interval = Math.max(interval + 2, Math.round(interval * ease * 1.3));
      break;
  }
  interval = Math.min(MAX_INTERVAL, interval);
  return {
    ease: Math.round(ease * 100) / 100,
    interval,
    due: addDays(today, interval),
    reps: rating === 'again' ? 0 : card.reps + 1,
    lapses,
    last: today,
  };
}

export function isDue(card: SrsCard | undefined, today: string): boolean {
  return !!card && card.due <= today;
}

/** Human-friendly "in 3 days" / "today" / "2 days overdue". */
export function dueLabel(card: SrsCard | undefined, today: string): string {
  if (!card) return '';
  const d = daysBetween(today, card.due);
  if (d === 0) return 'due today';
  if (d < 0) return `${-d}d overdue`;
  if (d === 1) return 'tomorrow';
  if (d < 30) return `in ${d}d`;
  return `in ${Math.round(d / 30)}mo`;
}

/** 32-bit hash used to make "random" daily picks stable for a given day. */
export function dayHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
