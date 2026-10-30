// Decides what to practice: the daily question, quick reps, missed questions and the
// next lesson or design. Mirrors the quiz half of the web app's src/lib/planner.ts.
import { allDesigns, allLessons, allQuestions, quizCategories } from './content';
import { CODING_CATEGORIES, dayHash, daysBetween, isDue, type DesignPrompt, type Lesson, type QuizQuestion } from './shared';
import type { AppState } from './store';

export function pickDailyQuestion(s: AppState, today: string): QuizQuestion | undefined {
  const pinned = s.daily[today];
  if (pinned) return allQuestions().find((q) => q.id === pinned.id);
  const questions = allQuestions();
  if (!questions.length) return undefined;
  const cats = quizCategories().filter((c) => !CODING_CATEGORIES.includes(c.id));
  const dayNumber = daysBetween('2024-01-01', today);
  const cat = cats.length ? cats[((dayNumber % cats.length) + cats.length) % cats.length].id : undefined;
  const unseen = questions.filter((q) => !s.questions[q.id]);
  const pool = unseen.filter((q) => q.category === cat);
  const candidates = pool.length ? pool : unseen.length ? unseen : questions;
  return candidates[dayHash(today) % candidates.length];
}

export function dueQuestions(s: AppState, today: string): QuizQuestion[] {
  return allQuestions()
    .filter((q) => isDue(s.questions[q.id]?.srs, today))
    .sort((a, b) => s.questions[a.id].srs.due.localeCompare(s.questions[b.id].srs.due));
}

/** Orders questions: due first, then unseen, then ones you got wrong, then the rest (least recently mastered first). */
function prioritize(s: AppState, today: string, qs: QuizQuestion[], salt: string): QuizQuestion[] {
  const score = (q: QuizQuestion) => {
    const p = s.questions[q.id];
    if (!p) return 1;
    if (isDue(p.srs, today)) return 0;
    if (!p.lastCorrect) return 2;
    return 3 + p.srs.interval;
  };
  return [...qs].sort((a, b) => score(a) - score(b) || dayHash(salt + a.id) - dayHash(salt + b.id));
}

/** A short practice set for a category. */
export function practiceSet(s: AppState, today: string, category: string | null, size = 5, salt = ''): QuizQuestion[] {
  const qs = allQuestions().filter((q) => !category || q.category === category);
  return prioritize(s, today, qs, today + (category ?? '') + salt).slice(0, size);
}

/** Quick Reps: alternates code drills with system design questions. */
export function quickReps(s: AppState, today: string, size = 6, salt = ''): QuizQuestion[] {
  const all = allQuestions();
  const coding = prioritize(s, today, all.filter((q) => CODING_CATEGORIES.includes(q.category)), today + salt + 'c');
  const design = prioritize(s, today, all.filter((q) => !CODING_CATEGORIES.includes(q.category)), today + salt + 'd');
  const out: QuizQuestion[] = [];
  for (let i = 0; out.length < size && (i < coding.length || i < design.length); i++) {
    if (coding[i]) out.push(coding[i]);
    if (design[i] && out.length < size) out.push(design[i]);
  }
  return out;
}

export function nextLesson(s: AppState): Lesson | undefined {
  return allLessons().find((l) => !s.lessonsRead[l.id]);
}

const DIFF_RANK = { Easy: 0, Medium: 1, Hard: 2 };

export function suggestedDesign(s: AppState): DesignPrompt | undefined {
  const lastAt = (d: DesignPrompt) => s.designs[d.id]?.at(-1)?.at ?? '';
  return [...allDesigns()].sort((a, b) => lastAt(a).localeCompare(lastAt(b)) || DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty])[0];
}

export function daysSinceLastDesign(s: AppState, today: string): number | null {
  const dates = Object.values(s.designs)
    .flat()
    .map((a) => a.at.slice(0, 10));
  if (!dates.length) return null;
  return daysBetween(dates.sort().at(-1)!, today);
}

export interface CategoryStat {
  id: string;
  title: string;
  color: string;
  total: number;
  seen: number;
  mastered: number;
}

export function categoryStats(s: AppState): CategoryStat[] {
  const qs = allQuestions();
  return quizCategories().map((c) => {
    const inCat = qs.filter((q) => q.category === c.id);
    return {
      id: c.id,
      title: c.title,
      color: c.color,
      total: inCat.length,
      seen: inCat.filter((q) => s.questions[q.id]).length,
      mastered: inCat.filter((q) => s.questions[q.id]?.lastCorrect).length,
    };
  });
}
