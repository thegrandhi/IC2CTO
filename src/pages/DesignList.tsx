import { DifficultyPill } from '../components/ui';
import { allDesigns } from '../lib/content';
import { DESIGN_STEPS } from '../lib/content/designs';
import { designDraftKey, storage, useAppState } from '../lib/store';

export function DesignList() {
  const s = useAppState();
  const designs = allDesigns();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>System design</h1>
          <p>
            Full mock interviews. Work through {DESIGN_STEPS.length} timed steps, sketch the architecture, then grade yourself
            against a reference answer and rubric.
          </p>
        </div>
      </div>
      <div className="grid cols-3">
        {designs.map((d) => {
          const attempts = s.designs[d.id] ?? [];
          const last = attempts.at(-1);
          const inProgress = !!storage.get(designDraftKey(d.id));
          return (
            <a key={d.id} className="card stack" href={`#/design/${d.id}`} style={{ color: 'inherit', gap: 8 }}>
              <div className="row">
                <DifficultyPill d={d.difficulty} />
                <span className="small faint">{d.minutes} min</span>
                <div className="spacer" />
                {inProgress && <span className="pill accent">In progress</span>}
              </div>
              <strong style={{ fontSize: '1.02rem' }}>{d.title}</strong>
              <div className="small muted" style={{ flex: 1 }}>
                {d.tags.join(' · ')}
              </div>
              <div className="small faint">
                {last
                  ? `Last score ${Math.round((last.checked.length / last.total) * 100)}% · ${attempts.length} session${attempts.length > 1 ? 's' : ''}`
                  : 'Not attempted yet'}
              </div>
            </a>
          );
        })}
      </div>
      <div className="section-title">How to practice</div>
      <div className="card md small">
        <ol style={{ margin: 0 }}>
          <li>Start the clock and talk out loud, or type as if the interviewer can only see your notes.</li>
          <li>Spend about the suggested minutes on each step. The phase bar shows where you should be.</li>
          <li>Finish, then compare each step with the reference and tick the rubric items you actually covered.</li>
          <li>Redo the same prompt a week later. Scores are tracked per session.</li>
        </ol>
      </div>
    </div>
  );
}
