// Validates quiz questions, lessons and design prompts, and cross-references between them.
import { describe, expect, it } from 'vitest';
import { allDesigns, allLessons, allProblems, allQuestions, getLesson, getProblem, quizCategories } from './lib/content';
import { QUIZ_CATEGORY_ORDER } from './lib/content/quiz';

describe('quiz', () => {
  const questions = allQuestions();

  it('has unique question ids', () => {
    const ids = questions.map((q) => q.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('only uses known categories', () => {
    for (const c of quizCategories()) expect(QUIZ_CATEGORY_ORDER).toContain(c.id);
  });

  it('links only to lessons and problems that exist', () => {
    for (const q of questions) {
      if (q.lesson) expect(getLesson(q.lesson), `${q.id} → lesson ${q.lesson}`).toBeDefined();
      if (q.problem) expect(getProblem(q.problem), `${q.id} → problem ${q.problem}`).toBeDefined();
    }
  });

  it('has well-formed answers', () => {
    for (const q of questions) {
      if (q.type === 'mcq') {
        expect(new Set(q.options).size, q.id).toBe(q.options.length);
      } else if (q.type === 'match') {
        expect(new Set(q.pairs.map((p) => p[0])).size, q.id).toBe(q.pairs.length);
        expect(new Set(q.pairs.map((p) => p[1])).size, q.id).toBe(q.pairs.length);
      } else if (q.type === 'order') {
        expect(new Set(q.items).size, q.id).toBe(q.items.length);
      } else if (q.type === 'blank') {
        expect(q.answers.length, q.id).toBeGreaterThan(0);
        expect(q.distractors.length, `${q.id} needs distractors`).toBeGreaterThan(0);
      }
      expect(q.explanation.length, q.id).toBeGreaterThan(30);
    }
  });
});

describe('lessons', () => {
  it('are complete and in known categories', () => {
    const cats = quizCategories().map((c) => c.id);
    for (const l of allLessons()) {
      expect(cats, l.id).toContain(l.category);
      expect(l.body.length, l.id).toBeGreaterThan(300);
      expect(l.takeaways.length, l.id).toBeGreaterThan(0);
    }
  });
});

describe('design prompts', () => {
  it('parse with all reference sections and a rubric', () => {
    for (const d of allDesigns()) {
      expect(d.prompt.length, d.id).toBeGreaterThan(50);
      expect(d.rubric.length, d.id).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('library size', () => {
  it('reports counts', () => {
    console.log(
      `problems=${allProblems().length} questions=${allQuestions().length} lessons=${allLessons().length} designs=${allDesigns().length}`,
    );
  });
});
