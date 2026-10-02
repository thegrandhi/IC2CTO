import { useEffect, useMemo, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { CategoryPill, DifficultyPill, Heatmap, ProgressBar } from '../components/ui';
import { allProblems, getQuizCategory } from '../lib/content';
import {
  categoryStats,
  daysSinceLastDesign,
  dueProblems,
  dueQuestions,
  nextLesson,
  nextProblem,
  pickDailyQuestion,
  randomProblem,
  suggestedDesign,
  topicStats,
} from '../lib/planner';
import { addDays, todayStr } from '../lib/srs';
import { activityTotal, dayActivity, pinDailyQuestion, streak, useAppState } from '../lib/store';
import { PYTHON_AVAILABLE } from '../lib/types';
import { navigate } from '../router';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late-night session';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

interface WorkoutItem {
  key: string;
  kicker: string;
  title: ReactNode;
  detail?: ReactNode;
  done: boolean;
  action: { label: string; href: string };
}

export function Today() {
  const s = useAppState();
  const today = todayStr();
  const daily = pickDailyQuestion(s, today);

  useEffect(() => {
    if (daily) pinDailyQuestion(daily.id);
  }, [daily]);

  const act = dayActivity(s, today);
  const dueP = dueProblems(s, today);
  const dueQ = dueQuestions(s, today);
  const next = nextProblem(s);
  const lesson = nextLesson(s);
  const design = suggestedDesign(s);
  const sinceDesign = daysSinceLastDesign(s, today);
  const solved = allProblems().filter((p) => s.problems[p.id]?.status === 'solved').length;
  const dailyLog = s.daily[today];
  const cat = daily ? getQuizCategory(daily.category) : undefined;

  const items: WorkoutItem[] = [];
  items.push({
    key: 'reps',
    kicker: 'Quick reps · 3 min · tap-only',
    title: 'Code drills + system design',
    detail: 'Fill-in-the-blank code, order the lines, and design questions. Built for a phone on the bus or between sets.',
    done: act.quiz >= 6,
    action: { label: act.quiz >= 6 ? 'Again' : 'Go', href: '#/quiz/reps' },
  });
  if (daily) {
    items.push({
      key: 'daily',
      kicker: 'Daily question · 2 min',
      title: (
        <span className="row" style={{ gap: 8 }}>
          {cat && <CategoryPill color={cat.color}>{cat.title}</CategoryPill>}
          <span>System design rep</span>
        </span>
      ),
      detail:
        dailyLog?.correct === undefined ? 'One question, then the reasoning behind the answer.' : dailyLog.correct ? 'Nailed it.' : 'Missed. It will come back for review.',
      done: dailyLog?.correct !== undefined,
      action: { label: dailyLog?.correct !== undefined ? 'See answer' : 'Answer', href: '#/quiz/daily' },
    });
  }
  if (dueP.length) {
    items.push({
      key: 'review',
      kicker: `Warm-up · ${dueP.length} problem${dueP.length > 1 ? 's' : ''} due`,
      title: dueP[0].title,
      detail: 'Re-solve it from a blank editor. Spaced repetition makes the pattern stick.',
      done: false,
      action: { label: 'Review', href: `#/problems/${dueP[0].id}?mode=review` },
    });
  } else {
    items.push({
      key: 'review',
      kicker: 'Warm-up',
      title: 'No problem reviews due',
      detail: act.reviews ? `${act.reviews} review${act.reviews > 1 ? 's' : ''} done today.` : 'Solved problems come back here on a schedule.',
      done: act.reviews > 0 || Object.keys(s.problems).length > 0,
      action: { label: 'Browse', href: '#/problems' },
    });
  }
  if (next) {
    items.push({
      key: 'problem',
      kicker: `Main set · ${next.topic}`,
      title: (
        <span className="row" style={{ gap: 8 }}>
          <span>{next.title}</span>
          <DifficultyPill d={next.difficulty} />
        </span>
      ),
      detail: act.problems ? `${act.problems} solved today.` : 'Next unsolved problem on the roadmap.',
      done: act.problems > 0,
      action: { label: 'Start', href: `#/problems/${next.id}` },
    });
  }
  if (dueQ.length) {
    items.push({
      key: 'quiz-review',
      kicker: 'Missed questions',
      title: `${dueQ.length} question${dueQ.length > 1 ? 's' : ''} to retry`,
      detail: 'Questions you got wrong come back until they stick.',
      done: false,
      action: { label: 'Retry', href: '#/quiz/review' },
    });
  }
  if (lesson) {
    items.push({
      key: 'lesson',
      kicker: `Learn · ${lesson.minutes} min read`,
      title: lesson.title,
      detail: lesson.summary,
      done: act.lessons > 0,
      action: { label: 'Read', href: `#/learn/${lesson.id}` },
    });
  }
  if (design) {
    const due = sinceDesign === null || sinceDesign >= 7;
    items.push({
      key: 'design',
      kicker: due ? 'Weekly · mock design interview' : `Design · last session ${sinceDesign}d ago`,
      title: design.title,
      detail: `${design.minutes}-minute structured session with a whiteboard and a self-review rubric.`,
      done: act.designs > 0 || !due,
      action: { label: 'Practice', href: `#/design/${design.id}` },
    });
  }

  const doneCount = items.filter((i) => i.done).length;
  const days = useMemo(() => {
    // 18 weeks ending this week (columns are weeks, rows Sun–Sat).
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - end.getDay() - 7 * 17);
    const out: string[] = [];
    for (let d = todayStr(start); d <= today; d = addDays(d, 1)) out.push(d);
    return out;
  }, [today]);
  const level = (d: string) => {
    const t = activityTotal(s.activity[d]);
    return t === 0 ? 0 : t < 3 ? 1 : t < 6 ? 2 : 3;
  };
  const topics = topicStats(s);
  const cats = categoryStats(s);
  const st = streak(s, today);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{greeting()}</h1>
          <p>
            {doneCount === items.length
              ? 'Workout complete. See you tomorrow.'
              : `${doneCount} of ${items.length} done in today's workout.`}
          </p>
        </div>
        <div className="row">
          <a className="btn primary" href="#/quiz/reps">
            <Icon name="flame" /> Quick reps
          </a>
          <button
            className="btn"
            onClick={() => {
              const p = randomProblem(s, 'Medium');
              if (p) navigate(`/problems/${p.id}?mode=mock`);
            }}
          >
            <Icon name="clock" /> Mock interview
          </button>
          <button
            className="btn"
            onClick={() => {
              const p = randomProblem(s);
              if (p) navigate(`/problems/${p.id}`);
            }}
          >
            <Icon name="shuffle" /> Random problem
          </button>
        </div>
      </div>

      {!PYTHON_AVAILABLE && (
        <div className="callout small" style={{ marginBottom: 16 }}>
          You're using a preview. Code runs in JavaScript only, and the preview doesn't work offline. The installed app adds Python and
          offline use.
        </div>
      )}

      <div className="hero">
        <div className="stat">
          <div className="label">Streak</div>
          <div className="value">
            {st} <small>day{st === 1 ? '' : 's'}</small>
          </div>
        </div>
        <div className="stat">
          <div className="label">Solved</div>
          <div className="value">
            {solved} <small>/ {allProblems().length}</small>
          </div>
        </div>
        <div className="stat">
          <div className="label">Due</div>
          <div className="value">{dueP.length + dueQ.length}</div>
        </div>
        <div className="stat">
          <div className="label">Answered</div>
          <div className="value">{Object.keys(s.questions).length}</div>
        </div>
      </div>

      <div className="section-title">Today's workout</div>
      <div className="workout">
        {items.map((item) => (
          <div key={item.key} className={`workout-item ${item.done ? 'done' : ''}`}>
            <div className="check">{item.done && <Icon name="check" />}</div>
            <div style={{ minWidth: 0 }}>
              <div className="kicker">{item.kicker}</div>
              <div className="title">{item.title}</div>
              {item.detail && <div className="muted small">{item.detail}</div>}
            </div>
            <a className={`btn ${item.done ? '' : 'primary'}`} href={item.action.href}>
              {item.action.label}
            </a>
          </div>
        ))}
      </div>

      <div className="section-title">Activity</div>
      <div className="card">
        <Heatmap days={days} levelOf={level} />
        <div className="muted small" style={{ marginTop: 8 }}>
          {Object.values(s.activity).filter((a) => activityTotal(a) > 0).length} active days so far. A day counts when you solve, review,
          answer, read or design something.
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Coding roadmap</h3>
          <p className="muted small" style={{ marginTop: 0 }}>
            Problems solved per pattern.
          </p>
          {topics.map((t) => (
            <a key={t.topic} className="topic-row" href={`#/problems?topic=${encodeURIComponent(t.topic)}`} style={{ color: 'inherit' }}>
              <span>{t.topic}</span>
              <ProgressBar value={t.solved} max={t.total} />
              <span className="count">
                {t.solved}/{t.total}
              </span>
            </a>
          ))}
        </div>
        <div className="card">
          <h3>System design mastery</h3>
          <p className="muted small" style={{ marginTop: 0 }}>
            Questions whose latest answer was correct, per subject.
          </p>
          {cats.map((c) => (
            <a key={c.id} className="topic-row" href={`#/quiz/practice?category=${c.id}`} style={{ color: 'inherit' }}>
              <span>{c.title}</span>
              <ProgressBar value={c.mastered} max={c.total} color={`var(--${c.color})`} />
              <span className="count">
                {c.mastered}/{c.total}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
