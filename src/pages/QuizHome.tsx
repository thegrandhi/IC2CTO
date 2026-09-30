import { Icon } from '../components/Icon';
import { CategoryPill, ProgressBar } from '../components/ui';
import { allQuestions, getQuizCategory, quizCategories } from '../lib/content';
import { categoryStats, dueQuestions, pickDailyQuestion } from '../lib/planner';
import { todayStr } from '../lib/srs';
import { useAppState } from '../lib/store';

export function QuizHome() {
  const s = useAppState();
  const today = todayStr();
  const daily = pickDailyQuestion(s, today);
  const dailyLog = s.daily[today];
  const due = dueQuestions(s, today);
  const stats = categoryStats(s);
  const answered = Object.values(s.questions);
  const seen = answered.reduce((a, q) => a + q.seen, 0);
  const correct = answered.reduce((a, q) => a + q.correct, 0);
  const cat = daily ? getQuizCategory(daily.category) : undefined;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Quiz</h1>
          <p>
            Two-minute system design reps: {allQuestions().length} questions across {quizCategories().length} subjects. Each answer
            comes with the reasoning. Missed questions come back until they stick.
          </p>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card stack" style={{ borderTop: '3px solid var(--accent)' }}>
          <div className="row">
            <Icon name="quiz" size={18} />
            <strong>Daily question</strong>
            <div className="spacer" />
            {cat && <CategoryPill color={cat.color}>{cat.title}</CategoryPill>}
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {dailyLog?.correct === undefined
              ? 'A new question every day. Keep your streak alive.'
              : dailyLog.correct
                ? 'Done for today, and you got it right. Come back tomorrow for the next one.'
                : "Done for today. You missed this one, so it's queued for review."}
          </p>
          <div>
            <a className={`btn ${dailyLog?.correct === undefined ? 'primary' : ''}`} href="#/quiz/daily">
              {dailyLog?.correct === undefined ? "Answer today's question" : 'Revisit it'}
            </a>
          </div>
        </div>
        <div className="card stack">
          <div className="row">
            <Icon name="review" size={18} />
            <strong>Missed questions</strong>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {due.length
              ? `${due.length} question${due.length > 1 ? 's are' : ' is'} due for another try.`
              : 'Nothing due. Questions you miss show up here on a schedule.'}
          </p>
          <div className="row">
            <a className={`btn ${due.length ? 'primary' : ''}`} href="#/quiz/review" aria-disabled={!due.length}>
              Retry {due.length || ''}
            </a>
            <span className="small faint">
              {seen ? `Lifetime accuracy ${Math.round((correct / seen) * 100)}% over ${seen} answers` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="section-title">Subjects</div>
      <div className="grid cols-3">
        {stats.map((c) => {
          const meta = quizCategories().find((x) => x.id === c.id)!;
          return (
            <a key={c.id} className="card cat-card" href={`#/quiz/practice?category=${c.id}`} style={{ ['--cat' as string]: `var(--${c.color})` }}>
              <div className="row">
                <strong>{c.title}</strong>
                <div className="spacer" />
                <span className="small faint">{c.total} q</span>
              </div>
              <div className="small muted" style={{ minHeight: 40 }}>
                {meta.description}
              </div>
              <ProgressBar value={c.mastered} max={c.total} />
              <div className="small faint">
                {c.mastered} mastered · {c.seen - c.mastered} to firm up · {c.total - c.seen} new
              </div>
            </a>
          );
        })}
      </div>

      <div className="row" style={{ marginTop: 18 }}>
        <a className="btn" href="#/quiz/practice?size=10">
          <Icon name="shuffle" /> Mixed set of 10
        </a>
      </div>
    </div>
  );
}
