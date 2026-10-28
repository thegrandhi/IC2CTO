import { DifficultyPill } from '../components/ui';
import { allDesigns, getInterview } from '../lib/content';
import { attemptScore, designDraftKey, interviewDraftKey, storage, useAppState } from '../lib/store';

export function DesignList() {
  const s = useAppState();
  const designs = allDesigns();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>System design</h1>
          <p>
            Mock interviews you can do on your phone. An interviewer walks you through each prompt: ask clarifying questions, estimate,
            make tradeoffs and build the request paths, then see how you scored.
          </p>
        </div>
      </div>
      <div className="grid cols-3">
        {designs.map((d) => {
          const attempts = s.designs[d.id] ?? [];
          const last = attempts.at(-1);
          const inProgress = !!storage.get(interviewDraftKey(d.id)) || !!storage.get(designDraftKey(d.id));
          const steps = getInterview(d.id)?.length;
          return (
            <a key={d.id} className="card stack" href={`#/design/${d.id}`} style={{ color: 'inherit', gap: 8 }}>
              <div className="row">
                <DifficultyPill d={d.difficulty} />
                <span className="small faint">{steps ? `${steps} decisions` : `${d.minutes} min`}</span>
                <div className="spacer" />
                {inProgress && <span className="pill accent">In progress</span>}
              </div>
              <strong style={{ fontSize: '1.02rem' }}>{d.title}</strong>
              <div className="small muted" style={{ flex: 1 }}>
                {d.tags.join(' · ')}
              </div>
              <div className="small faint">
                {last
                  ? `Last score ${Math.round(attemptScore(last) * 100)}% · ${attempts.length} session${attempts.length > 1 ? 's' : ''}`
                  : 'Not attempted yet'}
              </div>
            </a>
          );
        })}
      </div>
      <div className="section-title">How to practice</div>
      <div className="card md small">
        <ol style={{ margin: 0 }}>
          <li>
            <strong>Guided interview</strong> (about 15 minutes, tap-only): the interviewer asks, you decide, and every choice gets
            feedback on why it's right or wrong. Good on a commute.
          </li>
          <li>
            <strong>Whiteboard</strong> (45 minutes): the full free-form version. Take notes for each step, sketch the architecture,
            then grade yourself against the reference answer and rubric.
          </li>
          <li>Start with the guided interview, then do the whiteboard version of the same prompt a few days later from memory.</li>
        </ol>
      </div>
    </div>
  );
}
