import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Difficulty } from '../lib/types';
import { Icon } from './Icon';

export function DifficultyPill({ d }: { d: Difficulty }) {
  return <span className={`pill ${d.toLowerCase()}`}>{d}</span>;
}

export function CategoryPill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="pill cat" style={{ ['--cat' as string]: `var(--${color})` }}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function StatusIcon({ status, due }: { status?: 'attempted' | 'solved'; due?: boolean }) {
  if (due)
    return (
      <span className="status-icon due" title="Due for review">
        <Icon name="review" />
      </span>
    );
  if (status === 'solved')
    return (
      <span className="status-icon solved" title="Solved">
        <Icon name="check" />
      </span>
    );
  if (status === 'attempted')
    return (
      <span className="status-icon attempted" title="Attempted">
        <Icon name="half" />
      </span>
    );
  return <span className="status-icon" />;
}

export function Modal({ children, onClose, label }: { children: ReactNode; onClose?: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref}>
        {children}
      </div>
    </div>
  );
}

export function formatClock(totalSec: number): string {
  const sign = totalSec < 0 ? '-' : '';
  const s = Math.abs(Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${sign}${h}:${String(m).padStart(2, '0')}:${sec}` : `${sign}${m}:${sec}`;
}

export function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Stopwatch that only counts while the page is visible. */
export function useStopwatch(running = true) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);
  return [sec, setSec] as const;
}

export function Heatmap({ days, levelOf }: { days: string[]; levelOf: (d: string) => number }) {
  return (
    <div className="heatmap" aria-label="Activity over the last weeks">
      {days.map((d) => {
        const l = levelOf(d);
        return <span key={d} className={l ? `l${l}` : undefined} title={d} />;
      })}
    </div>
  );
}
