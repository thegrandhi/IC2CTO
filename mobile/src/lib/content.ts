import { raw } from '../content.generated';
import {
  parseDesign,
  parseInterview,
  parseLesson,
  parseQuizFile,
  QUIZ_CATEGORY_ORDER,
  type DesignPrompt,
  type InterviewItem,
  type Lesson,
  type QuizCategory,
  type QuizQuestion,
} from './shared';

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

const quiz = lazy(() => {
  const parsed = Object.entries(raw.quiz).map(([id, src]) => parseQuizFile(id, src));
  const rank = (id: string) => {
    const i = QUIZ_CATEGORY_ORDER.indexOf(id);
    return i < 0 ? 99 : i;
  };
  parsed.sort((a, b) => rank(a.category.id) - rank(b.category.id));
  return { categories: parsed.map((p) => p.category), questions: parsed.flatMap((p) => p.questions) };
});

export const quizCategories = (): QuizCategory[] => quiz().categories;
export const allQuestions = (): QuizQuestion[] => quiz().questions;
export const getQuestion = byId(allQuestions);
export const getQuizCategory = byId(quizCategories);

export const allLessons = lazy<Lesson[]>(() =>
  Object.entries(raw.lessons)
    .map(([id, src]) => parseLesson(id, src))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
);
export const getLesson = byId(allLessons);

export const allDesigns = lazy<DesignPrompt[]>(() =>
  Object.entries(raw.designs)
    .map(([id, src]) => parseDesign(id, src))
    .sort((a, b) => a.title.localeCompare(b.title)),
);
export const getDesign = byId(allDesigns);

const interviews = lazy(() => new Map(Object.entries(raw.interviews).map(([id, src]) => [id, parseInterview(id, src)])));

/** The guided-interview script for a design prompt, if it has one. */
export const getInterview = (designId: string): InterviewItem[] | undefined => interviews().get(designId);

/** Lesson categories in reading order, using the quiz category titles. */
export function lessonSections(): { id: string; title: string; lessons: Lesson[] }[] {
  const sections = new Map<string, Lesson[]>();
  for (const l of allLessons()) sections.set(l.category, [...(sections.get(l.category) ?? []), l]);
  return [...sections].map(([id, lessons]) => ({ id, title: getQuizCategory(id)?.title ?? id, lessons }));
}
