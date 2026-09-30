import { Icon } from '../components/Icon';
import { DifficultyPill } from '../components/ui';
import { allProblems } from '../lib/content';
import { dueProblems, dueQuestions } from '../lib/planner';
import { dueLabel, todayStr } from '../lib/srs';
import { useAppState } from '../lib/store';

export function Review() {
  const s = useAppState();
  const today = todayStr();
  const dueP = dueProblems(s, today);
  const dueQ = dueQuestions(s, today);
  const upcoming = allProblems()
    .filter((p) => s.problems[p.id]?.srs && s.problems[p.id].srs!.due > today)
    .sort((a, b) => s.problems[a.id].srs!.due.localeCompare(s.problems[b.id].srs!.due))
    .slice(0, 12);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Review</h1>
          <p>
            Spaced repetition: after you solve a problem, rate how it felt. It comes back just before you would forget it, and
            each clean re-solve pushes it further out.
          </p>
        </div>
      </div>

      <div className="section-title">Problems due ({dueP.length})</div>
      {dueP.length ? (
        <div className="plist">
          {dueP.map((p) => (
            <a key={p.id} className="plist-row" href={`#/problems/${p.id}?mode=review`}>
              <span className="status-icon due">
                <Icon name="review" />
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="ptitle">{p.title}</div>
                <div className="ptopic">{p.topic}</div>
              </div>
              <span className="small faint due-col">{dueLabel(s.problems[p.id].srs, today)}</span>
              <DifficultyPill d={p.difficulty} />
            </a>
          ))}
        </div>
      ) : (
        <div className="card muted">
          No problems due.{' '}
          {Object.keys(s.problems).length ? 'Come back tomorrow.' : <a href="#/problems">Solve your first problem</a>}
        </div>
      )}

      <div className="section-title">Quiz questions due ({dueQ.length})</div>
      <div className="card row">
        <span className="muted" style={{ flex: 1 }}>
          {dueQ.length ? `${dueQ.length} question${dueQ.length > 1 ? 's' : ''} you missed or are due to reconfirm.` : 'Nothing due.'}
        </span>
        {dueQ.length > 0 && (
          <a className="btn primary" href="#/quiz/review">
            Start
          </a>
        )}
      </div>

      {upcoming.length > 0 && (
        <>
          <div className="section-title">Coming up</div>
          <div className="plist">
            {upcoming.map((p) => (
              <a key={p.id} className="plist-row" href={`#/problems/${p.id}`}>
                <span className="status-icon solved">
                  <Icon name="check" />
                </span>
                <div className="ptitle">{p.title}</div>
                <span className="small faint due-col">{dueLabel(s.problems[p.id].srs, today)}</span>
                <DifficultyPill d={p.difficulty} />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
