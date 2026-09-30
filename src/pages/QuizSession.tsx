import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { QuizCard } from '../components/QuizCard';
import { allQuestions, getLesson, getQuizCategory } from '../lib/content';
import type { QuizQuestion } from '../lib/content/quiz';
import { dueQuestions, pickDailyQuestion, practiceSet, quickReps } from '../lib/planner';
import { todayStr } from '../lib/srs';
import { getState, pinDailyQuestion, recordAnswer } from '../lib/store';
import { navigate } from '../router';

function buildSet(kind: string, query: URLSearchParams): { title: string; questions: QuizQuestion[]; daily?: boolean } {
  const s = getState();
  const today = todayStr();
  switch (kind) {
    case 'daily': {
      const q = pickDailyQuestion(s, today);
      return { title: 'Daily question', questions: q ? [q] : [], daily: true };
    }
    case 'review':
      return { title: 'Missed questions', questions: dueQuestions(s, today).slice(0, 15) };
    case 'reps':
      return { title: 'Quick reps', questions: quickReps(s, today, 6, query.get('n') ?? '') };
    case 'lesson': {
      const lesson = getLesson(query.get('lesson') ?? '');
      return { title: lesson ? `Check: ${lesson.title}` : 'Lesson check', questions: allQuestions().filter((q) => q.lesson === lesson?.id) };
    }
    default: {
      const category = query.get('category');
      const size = Number(query.get('size') ?? 5);
      const cat = category ? getQuizCategory(category) : undefined;
      return { title: cat ? cat.title : 'Mixed practice', questions: practiceSet(s, today, category, size) };
    }
  }
}

export function QuizSession({ kind, query }: { kind: string; query: URLSearchParams }) {
  // Built once per mount so answering doesn't reshuffle the set (the route key remounts on navigation).
  const [set] = useState(() => buildSet(kind, query));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [alreadyAnswered] = useState(() => !!set.daily && getState().daily[todayStr()]?.correct !== undefined);

  useEffect(() => {
    if (set.daily && set.questions[0]) pinDailyQuestion(set.questions[0].id);
  }, [set]);

  if (!set.questions.length) {
    return (
      <div className="page narrow">
        <div className="card empty">
          <h2>Nothing here right now</h2>
          <p>{kind === 'review' ? 'No missed questions are due. Nice work.' : 'No questions found for this set.'}</p>
          <a className="btn" href="#/quiz">
            Back to Quiz
          </a>
        </div>
      </div>
    );
  }

  const finished = index >= set.questions.length;
  const q = set.questions[Math.min(index, set.questions.length - 1)];

  if (finished) {
    const right = answers.filter(Boolean).length;
    const missed = set.questions.filter((_, i) => answers[i] === false);
    return (
      <div className="page narrow">
        <div className="card stack" style={{ padding: 28 }}>
          <div className="small faint">{set.title}</div>
          <h1 style={{ margin: 0 }}>
            {right}/{set.questions.length} correct
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {right === set.questions.length
              ? 'Clean sweep. These move further out in your review schedule.'
              : `${missed.length} missed question${missed.length > 1 ? 's' : ''} will come back tomorrow.`}
          </p>
          {missed.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {missed.map((m) => (
                <li key={m.id} className="small">
                  {m.prompt.split('\n')[0].replace(/[*`]/g, '').slice(0, 110)}
                  {m.lesson && getLesson(m.lesson) && (
                    <>
                      {' '}
                      · <a href={`#/learn/${m.lesson}`}>{getLesson(m.lesson)!.title}</a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="row">
            <a className="btn" href="#/quiz">
              Back to Quiz
            </a>
            {(kind === 'practice' || kind === 'reps') && (
              <button className="btn primary" onClick={() => navigate(`/quiz/${kind}?${new URLSearchParams({ ...Object.fromEntries(query), n: String(Date.now()) })}`)}>
                {kind === 'reps' ? 'Another round' : 'Another set'}
              </button>
            )}
            <a className="btn ghost" href="#/">
              Today
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="row" style={{ marginBottom: 14 }}>
        <a href="#/quiz" className="small muted">
          ← Quiz
        </a>
        <div className="spacer" />
        <strong className="small">{set.title}</strong>
        {set.questions.length > 1 && (
          <div className="progress-dots" aria-label={`Question ${index + 1} of ${set.questions.length}`}>
            {set.questions.map((_, i) => (
              <span key={i} className={answers[i] === true ? 'done' : answers[i] === false ? 'bad' : i === index ? 'current' : ''} />
            ))}
          </div>
        )}
      </div>
      <QuizCard
        key={q.id}
        q={q}
        reveal={alreadyAnswered}
        onAnswer={(correct) => {
          setAnswers((a) => {
            const next = [...a];
            next[index] = correct;
            return next;
          });
          recordAnswer(q.id, correct, { daily: set.daily });
        }}
        footer={
          set.daily ? (
            <a className="btn primary" href="#/">
              Back to Today <Icon name="send" />
            </a>
          ) : (
            <button className="btn primary" onClick={() => setIndex((i) => i + 1)} autoFocus>
              {index + 1 < set.questions.length ? 'Next question' : 'See results'} <Icon name="send" />
            </button>
          )
        }
      />
    </div>
  );
}
