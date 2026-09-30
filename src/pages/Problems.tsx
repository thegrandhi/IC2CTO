import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { DifficultyPill, StatusIcon } from '../components/ui';
import { allProblems } from '../lib/content';
import { TOPICS } from '../lib/content/problems';
import { dueLabel, isDue, todayStr } from '../lib/srs';
import { useAppState } from '../lib/store';
import type { Difficulty, Problem } from '../lib/types';
import { navigate, useRoute } from '../router';

type StatusFilter = 'all' | 'todo' | 'solved' | 'due' | 'starred';

export function Problems() {
  const s = useAppState();
  const route = useRoute();
  const today = todayStr();
  const [q, setQ] = useState('');
  const [diff, setDiff] = useState<Difficulty | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const topic = route.query.get('topic') ?? 'all';
  const setTopic = (t: string) => navigate(t === 'all' ? '/problems' : `/problems?topic=${encodeURIComponent(t)}`);

  const problems = allProblems();
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return problems.filter((p) => {
      const prog = s.problems[p.id];
      if (diff !== 'all' && p.difficulty !== diff) return false;
      if (topic !== 'all' && p.topic !== topic) return false;
      if (status === 'todo' && prog?.status === 'solved') return false;
      if (status === 'solved' && prog?.status !== 'solved') return false;
      if (status === 'due' && !isDue(prog?.srs, today)) return false;
      if (status === 'starred' && !prog?.starred) return false;
      if (needle) {
        const hay = `${p.title} ${p.topic} ${p.tags.join(' ')} ${p.lc ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [problems, s.problems, q, diff, status, topic, today]);

  const groups = useMemo(() => {
    const map = new Map<string, Problem[]>();
    for (const p of filtered) map.set(p.topic, [...(map.get(p.topic) ?? []), p]);
    return [...map.entries()];
  }, [filtered]);

  const solvedCount = problems.filter((p) => s.problems[p.id]?.status === 'solved').length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Problems</h1>
          <p>
            {problems.length} problems across {new Set(problems.map((p) => p.topic)).size} patterns · {solvedCount} solved. Run
            them in Python or JavaScript, offline.
          </p>
        </div>
      </div>

      <div className="filters">
        <input className="input" placeholder="Search title, pattern, tag…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search problems" />
        <select className="select" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Pattern">
          <option value="all">All patterns</option>
          {TOPICS.filter((t) => problems.some((p) => p.topic === t)).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="seg" role="group" aria-label="Difficulty">
          {(['all', 'Easy', 'Medium', 'Hard'] as const).map((d) => (
            <button key={d} className={diff === d ? 'on' : ''} onClick={() => setDiff(d)}>
              {d === 'all' ? 'All' : d}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Status">
          {(
            [
              ['all', 'Any'],
              ['todo', 'To do'],
              ['solved', 'Solved'],
              ['due', 'Due'],
              ['starred', '★'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={status === k ? 'on' : ''} onClick={() => setStatus(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty">No problems match these filters.</div>
      ) : (
        <div className="plist">
          {groups.map(([t, list]) => (
            <div key={t}>
              <div className="plist-group">
                <span>{t}</span>
                <span>
                  {list.filter((p) => s.problems[p.id]?.status === 'solved').length}/{list.length}
                </span>
              </div>
              {list.map((p) => {
                const prog = s.problems[p.id];
                const due = isDue(prog?.srs, today);
                return (
                  <a key={p.id} className="plist-row" href={`#/problems/${p.id}${due ? '?mode=review' : ''}`}>
                    <StatusIcon status={prog?.status} due={due} />
                    <div style={{ minWidth: 0 }}>
                      <div className="ptitle">
                        {p.title}
                        {prog?.starred && <Icon name="star" size={12} className="faint" />}
                      </div>
                      <div className="ptopic">{p.tags.slice(0, 3).join(' · ')}</div>
                    </div>
                    <span className="small faint due-col">{prog?.srs ? dueLabel(prog.srs, today) : ''}</span>
                    <DifficultyPill d={p.difficulty} />
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
