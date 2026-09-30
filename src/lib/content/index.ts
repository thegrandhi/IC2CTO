import type { Problem } from '../types';
import { parseDesign, type DesignPrompt } from './designs';
import { parseLesson, type Lesson } from './lessons';
import { parseProblem, sortProblems } from './problems';
import { parseQuizFile, QUIZ_CATEGORY_ORDER, type QuizCategory, type QuizQuestion } from './quiz';

const glob = {
  problems: import.meta.glob<string>('/content/problems/*.md', { query: '?raw', import: 'default', eager: true }),
  quiz: import.meta.glob<string>('/content/quiz/*.md', { query: '?raw', import: 'default', eager: true }),
  lessons: import.meta.glob<string>('/content/lessons/*.md', { query: '?raw', import: 'default', eager: true }),
  designs: import.meta.glob<string>('/content/design/*.md', { query: '?raw', import: 'default', eager: true }),
};

const idFromPath = (path: string) => path.replace(/^.*\/([^/]+)\.md$/, '$1');

function lazy<T>(fn: () => T): () => T {
  let value: T | undefined;
  let done = false;
  return () => {
    if (!done) {
      value = fn();
      done = true;
    }
    return value as T;
  };
}

function byId<T extends { id: string }>(items: () => T[]): (id: string) => T | undefined {
  const map = lazy(() => new Map(items().map((x) => [x.id, x])));
  return (id) => map().get(id);
}

export const allProblems = lazy<Problem[]>(() =>
  sortProblems(Object.entries(glob.problems).map(([path, src]) => parseProblem(idFromPath(path), src))),
);
export const getProblem = byId(allProblems);

const quiz = lazy(() => {
  const parsed = Object.entries(glob.quiz).map(([path, src]) => parseQuizFile(idFromPath(path), src));
  const rank = (id: string) => {
    const i = QUIZ_CATEGORY_ORDER.indexOf(id);
    return i < 0 ? 99 : i;
  };
  parsed.sort((a, b) => rank(a.category.id) - rank(b.category.id));
  return {
    categories: parsed.map((p) => p.category),
    questions: parsed.flatMap((p) => p.questions),
  };
});

export const quizCategories = (): QuizCategory[] => quiz().categories;
export const allQuestions = (): QuizQuestion[] => quiz().questions;
export const getQuestion = byId(allQuestions);
export const getQuizCategory = byId(quizCategories);

export const allLessons = lazy<Lesson[]>(() =>
  Object.entries(glob.lessons)
    .map(([path, src]) => parseLesson(idFromPath(path), src))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
);
export const getLesson = byId(allLessons);

export const allDesigns = lazy<DesignPrompt[]>(() =>
  Object.entries(glob.designs)
    .map(([path, src]) => parseDesign(idFromPath(path), src))
    .sort((a, b) => a.title.localeCompare(b.title)),
);
export const getDesign = byId(allDesigns);
