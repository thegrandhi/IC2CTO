// Validates quiz questions, lessons and design prompts, and cross-references between them.
import { describe, expect, it } from 'vitest';
import { allDesigns, allLessons, allProblems, allQuestions, getInterview, getLesson, getProblem, interviewIds, quizCategories } from './lib/content';
import { DESIGN_STEPS } from './lib/content/designs';
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

describe('guided interviews', () => {
  it('exist for every design prompt', () => {
    expect(interviewIds().sort()).toEqual(allDesigns().map((d) => d.id).sort());
  });

  it('walk through the main steps in order', () => {
    for (const d of allDesigns()) {
      const items = getInterview(d.id) ?? [];
      const steps = items.map((it) => DESIGN_STEPS.findIndex((s) => s.key === it.step));
      expect(steps, `${d.id}: steps out of order`).toEqual([...steps].sort((a, b) => a - b));
      for (const key of ['requirements', 'estimation', 'high-level design', 'deep dives'])
        expect(items.some((it) => it.step === key), `${d.id} has no ${key} items`).toBe(true);
      expect(items[0]?.type, `${d.id} should open with clarifying questions`).toBe('ask');
      expect(items.some((it) => it.type === 'path'), `${d.id} needs a path to build`).toBe(true);
      expect(items.length, d.id).toBeGreaterThanOrEqual(10);
    }
  });

  it('have distinct options with feedback on each', () => {
    for (const d of allDesigns()) {
      for (const it of getInterview(d.id) ?? []) {
        const where = `${d.id}/${it.id}`;
        expect(it.explanation.length, where).toBeGreaterThan(40);
        if (it.type === 'choice' || it.type === 'pick') {
          expect(new Set(it.options.map((o) => o.text)).size, where).toBe(it.options.length);
          for (const o of it.options) expect(o.note.length, `${where}: "${o.text}" needs a note`).toBeGreaterThan(4);
        }
        if (it.type === 'ask') {
          expect(new Set(it.questions.map((q) => q.text)).size, where).toBe(it.questions.length);
          expect(it.questions.length, where).toBeGreaterThan(it.budget);
        }
      }
    }
  });

  it("don't always put the right answer in the same place", () => {
    for (const d of allDesigns()) {
      const spots = (getInterview(d.id) ?? []).flatMap((it) => (it.type === 'choice' ? [it.options.findIndex((o) => o.correct)] : []));
      expect(new Set(spots).size, `${d.id}: right answers at ${spots.join(',')}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('library size', () => {
  it('reports counts', () => {
    console.log(
      `problems=${allProblems().length} questions=${allQuestions().length} lessons=${allLessons().length} designs=${allDesigns().length} interview items=${interviewIds().reduce((n, id) => n + (getInterview(id)?.length ?? 0), 0)}`,
    );
  });
});
