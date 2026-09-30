// Decides what to practice: the daily question, due reviews, and next problems.
import { allDesigns, allLessons, allProblems, allQuestions, quizCategories } from './content';
import type { DesignPrompt } from './content/designs';
import type { Lesson } from './content/lessons';
import { TOPICS } from './content/problems';
import { CODING_CATEGORIES, type QuizQuestion } from './content/quiz';
import { dayHash, daysBetween, isDue } from './srs';
import type { AppState } from './store';
import type { Difficulty, Problem } from './types';

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
export function practiceSet(s: AppState, today: string, category: string | null, size = 5): QuizQuestion[] {
  const qs = allQuestions().filter((q) => !category || q.category === category);
  return prioritize(s, today, qs, today + (category ?? '')).slice(0, size);
}

/**
 * Quick Reps: a tap-only set for a phone (commute, rest between sets), alternating
 * code drills (fill-in-the-blank, order-the-lines, patterns) with system design questions.
 */
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

export function dueProblems(s: AppState, today: string): Problem[] {
  return allProblems()
    .filter((p) => isDue(s.problems[p.id]?.srs, today))
    .sort((a, b) => s.problems[a.id].srs!.due.localeCompare(s.problems[b.id].srs!.due));
}

const DIFF_RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

/** The next unsolved problem following the topic roadmap (easier problems first). */
export function nextProblem(s: AppState, exclude: string[] = []): Problem | undefined {
  const unsolved = allProblems().filter((p) => s.problems[p.id]?.status !== 'solved' && !exclude.includes(p.id));
  const topicRank = (t: string) => (TOPICS as readonly string[]).indexOf(t);
  // Tiers keep the roadmap moving: all Easy problems across topics before Hards.
  const tier = (p: Problem) => (p.difficulty === 'Hard' ? 1 : 0);
  return [...unsolved].sort(
    (a, b) => tier(a) - tier(b) || topicRank(a.topic) - topicRank(b.topic) || DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty],
  )[0];
}

export function randomProblem(s: AppState, difficulty?: Difficulty, unsolvedOnly = true): Problem | undefined {
  const pool = allProblems().filter(
    (p) => (!difficulty || p.difficulty === difficulty) && (!unsolvedOnly || s.problems[p.id]?.status !== 'solved'),
  );
  const fallback = allProblems().filter((p) => !difficulty || p.difficulty === difficulty);
  const list = pool.length ? pool : fallback;
  return list[Math.floor(Math.random() * list.length)];
}

export function nextLesson(s: AppState): Lesson | undefined {
  return allLessons().find((l) => !s.lessonsRead[l.id]);
}

export function suggestedDesign(s: AppState): DesignPrompt | undefined {
  const designs = allDesigns();
  const lastAt = (d: DesignPrompt) => s.designs[d.id]?.at(-1)?.at ?? '';
  return [...designs].sort((a, b) => lastAt(a).localeCompare(lastAt(b)) || DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty])[0];
}

export function daysSinceLastDesign(s: AppState, today: string): number | null {
  const dates = Object.values(s.designs)
    .flat()
    .map((a) => a.at.slice(0, 10));
  if (!dates.length) return null;
  const last = dates.sort().at(-1)!;
  return daysBetween(last, today);
}

export interface TopicStat {
  topic: string;
  total: number;
  solved: number;
}

export function topicStats(s: AppState): TopicStat[] {
  const stats = new Map<string, TopicStat>(TOPICS.map((t) => [t, { topic: t, total: 0, solved: 0 }]));
  for (const p of allProblems()) {
    const st = stats.get(p.topic)!;
    st.total++;
    if (s.problems[p.id]?.status === 'solved') st.solved++;
  }
  return [...stats.values()].filter((t) => t.total > 0);
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
