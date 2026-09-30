import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Icon } from './Icon';

export type NodeKind = 'client' | 'lb' | 'service' | 'db' | 'cache' | 'queue' | 'storage' | 'cdn' | 'note';

export interface DNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: NodeKind;
}

export interface DEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface Diagram {
  nodes: DNode[];
  edges: DEdge[];
}

export const EMPTY_DIAGRAM: Diagram = { nodes: [], edges: [] };

const KINDS: { kind: NodeKind; label: string; color: string; name: string }[] = [
  { kind: 'client', label: 'Client', color: 'var(--c1)', name: 'Client' },
  { kind: 'lb', label: 'Load balancer', color: 'var(--c4)', name: 'LB' },
  { kind: 'service', label: 'Service', color: 'var(--c6)', name: 'Service' },
  { kind: 'db', label: 'Database', color: 'var(--c2)', name: 'DB' },
  { kind: 'cache', label: 'Cache', color: 'var(--c3)', name: 'Cache' },
  { kind: 'queue', label: 'Queue', color: 'var(--c5)', name: 'Queue' },
  { kind: 'storage', label: 'Blob storage', color: 'var(--c2)', name: 'Storage' },
  { kind: 'cdn', label: 'CDN', color: 'var(--c4)', name: 'CDN' },
  { kind: 'note', label: 'Note', color: 'var(--border-strong)', name: 'Note' },
];

const W = 1400;
const H = 800;
const GRID = 10;
const snap = (v: number) => Math.round(v / GRID) * GRID;
const uid = () => Math.random().toString(36).slice(2, 9);

function borderPoint(n: DNode, towardX: number, towardY: number) {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const t = Math.min(dx ? n.w / 2 / Math.abs(dx) : Infinity, dy ? n.h / 2 / Math.abs(dy) : Infinity);
  return { x: cx + dx * t, y: cy + dy * t };
}

function Shape({ n, color, selected, pending }: { n: DNode; color: string; selected: boolean; pending: boolean }) {
  const stroke = selected || pending ? 'var(--accent)' : color;
  const fill = n.kind === 'note' ? 'var(--panel-2)' : `color-mix(in srgb, ${color} 12%, var(--panel))`;
  const sw = selected || pending ? 2.5 : 1.5;
  if (n.kind === 'db' || n.kind === 'storage') {
    const ry = 8;
    const d = `M${n.x},${n.y + ry} a${n.w / 2},${ry} 0 0,1 ${n.w},0 v${n.h - 2 * ry} a${n.w / 2},${ry} 0 0,1 ${-n.w},0 z`;
    return (
      <>
        <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} />
        <path d={`M${n.x},${n.y + ry} a${n.w / 2},${ry} 0 0,0 ${n.w},0`} fill="none" stroke={stroke} strokeWidth={sw} />
      </>
    );
  }
  if (n.kind === 'queue') {
    return (
      <>
        <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={6} fill={fill} stroke={stroke} strokeWidth={sw} />
        {[1, 2, 3].map((i) => (
          <line key={i} x1={n.x + n.w - i * 10} y1={n.y + 6} x2={n.x + n.w - i * 10} y2={n.y + n.h - 6} stroke={stroke} strokeWidth={1} opacity={0.5} />
        ))}
      </>
    );
  }
  return (
    <rect
      x={n.x}
      y={n.y}
      width={n.w}
      height={n.h}
      rx={n.kind === 'client' || n.kind === 'cdn' ? 22 : 8}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeDasharray={n.kind === 'note' ? '5 4' : undefined}
    />
  );
}

export function DiagramEditor({ value, onChange }: { value: Diagram; onChange: (d: Diagram) => void }) {
  const [sel, setSel] = useState<{ type: 'node' | 'edge'; id: string } | null>(null);
  const [connect, setConnect] = useState(false);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const d = value;

  const toSvg = (e: { clientX: number; clientY: number }) => {
    const pt = svgRef.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };

  const addNode = (kind: NodeKind) => {
    const meta = KINDS.find((k) => k.kind === kind)!;
    const w = kind === 'note' ? 180 : 140;
    const h = kind === 'note' ? 60 : 56;
    // Drop the new box into the first free grid slot within the visible area.
    const container = svgRef.current?.parentElement;
    const originX = snap(container?.scrollLeft ?? 0) + 40;
    const originY = snap(container?.scrollTop ?? 0) + 40;
    const cols = Math.max(1, Math.floor(((container?.clientWidth ?? 800) - 40) / 190));
    const overlaps = (x: number, y: number) => d.nodes.some((n) => x < n.x + n.w + 10 && n.x < x + w + 10 && y < n.y + n.h + 10 && n.y < y + h + 10);
    let slot = 0;
    let x = originX;
    let y = originY;
    while (overlaps(x, y) && slot < 200) {
      slot++;
      x = originX + (slot % cols) * 190;
      y = originY + Math.floor(slot / cols) * 100;
    }
    const node: DNode = {
      id: uid(),
      x: Math.min(x, W - w),
      y: Math.min(y, H - h),
      w,
      h,
      label: kind === 'note' ? 'Note' : meta.name,
      kind,
    };
    onChange({ ...d, nodes: [...d.nodes, node] });
    setSel({ type: 'node', id: node.id });
  };

  const removeSelected = () => {
    if (!sel) return;
    if (sel.type === 'node') {
      onChange({ nodes: d.nodes.filter((n) => n.id !== sel.id), edges: d.edges.filter((e) => e.from !== sel.id && e.to !== sel.id) });
    } else {
      onChange({ ...d, edges: d.edges.filter((e) => e.id !== sel.id) });
    }
    setSel(null);
  };

  const rename = () => {
    if (!sel) return;
    if (sel.type === 'node') {
      const n = d.nodes.find((x) => x.id === sel.id);
      if (!n) return;
      const label = prompt('Label', n.label);
      if (label !== null) onChange({ ...d, nodes: d.nodes.map((x) => (x.id === n.id ? { ...x, label } : x)) });
    } else {
      const e = d.edges.find((x) => x.id === sel.id);
      if (!e) return;
      const label = prompt('Arrow label (e.g. "HTTPS", "async", "read")', e.label ?? '');
      if (label !== null) onChange({ ...d, edges: d.edges.map((x) => (x.id === e.id ? { ...x, label } : x)) });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!svgRef.current?.closest('.diagram')?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault();
        removeSelected();
      } else if (e.key === 'Escape') {
        setConnect(false);
        setPendingFrom(null);
        setSel(null);
      } else if (e.key === 'Enter' && sel) {
        rename();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onNodeDown = (e: ReactPointerEvent, n: DNode) => {
    e.stopPropagation();
    if (connect) {
      if (!pendingFrom) setPendingFrom(n.id);
      else if (pendingFrom !== n.id) {
        const exists = d.edges.some((x) => x.from === pendingFrom && x.to === n.id);
        if (!exists) onChange({ ...d, edges: [...d.edges, { id: uid(), from: pendingFrom, to: n.id }] });
        setPendingFrom(null);
      }
      return;
    }
    setSel({ type: 'node', id: n.id });
    const p = toSvg(e);
    drag.current = { id: n.id, dx: p.x - n.x, dy: p.y - n.y, moved: false };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onMove = (e: ReactPointerEvent) => {
    const dr = drag.current;
    if (!dr) return;
    const p = toSvg(e);
    const x = Math.max(0, Math.min(W - 40, snap(p.x - dr.dx)));
    const y = Math.max(0, Math.min(H - 40, snap(p.y - dr.dy)));
    const n = d.nodes.find((k) => k.id === dr.id);
    if (!n || (n.x === x && n.y === y)) return;
    dr.moved = true;
    onChange({ ...d, nodes: d.nodes.map((k) => (k.id === dr.id ? { ...k, x, y } : k)) });
  };

  const onUp = () => {
    drag.current = null;
  };

  const nodeById = new Map(d.nodes.map((n) => [n.id, n]));
  const colorOf = (k: NodeKind) => KINDS.find((x) => x.kind === k)!.color;

  return (
    <div className="diagram" tabIndex={-1}>
      <div className="diagram-toolbar">
        {KINDS.map((k) => (
          <button key={k.kind} className="btn small" onClick={() => addNode(k.kind)} title={`Add ${k.label}`}>
            <span className="dot" style={{ background: k.color }} /> {k.label}
          </button>
        ))}
        <div className="spacer" />
        <button
          className={`btn small ${connect ? 'primary' : ''}`}
          onClick={() => {
            setConnect(!connect);
            setPendingFrom(null);
          }}
          title="Connect: click a source box, then a target box"
        >
          <Icon name="send" /> {connect ? (pendingFrom ? 'Pick target…' : 'Pick source…') : 'Connect'}
        </button>
        <button className="btn small" onClick={rename} disabled={!sel} title="Rename (Enter)">
          Label
        </button>
        <button className="btn small danger" onClick={removeSelected} disabled={!sel} title="Delete (Del)">
          <Icon name="trash" />
        </button>
        <button
          className="btn small ghost"
          onClick={() => {
            if (d.nodes.length && confirm('Clear the whole diagram?')) onChange(EMPTY_DIAGRAM);
          }}
        >
          Clear
        </button>
      </div>
      <div className="diagram-canvas">
        <svg
          ref={svgRef}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerDown={() => {
            setSel(null);
            setPendingFrom(null);
          }}
          role="img"
          aria-label="Architecture diagram"
        >
          <defs>
            <marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
            </marker>
            <marker id="dg-arrow-sel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>
          {d.edges.map((e) => {
            const a = nodeById.get(e.from);
            const b = nodeById.get(e.to);
            if (!a || !b) return null;
            const p1 = borderPoint(a, b.x + b.w / 2, b.y + b.h / 2);
            const p2 = borderPoint(b, a.x + a.w / 2, a.y + a.h / 2);
            const selected = sel?.type === 'edge' && sel.id === e.id;
            return (
              <g key={e.id}>
                <line
                  className="dg-edge-hit"
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    setSel({ type: 'edge', id: e.id });
                  }}
                  onDoubleClick={rename}
                />
                <line
                  className={`dg-edge ${selected ? 'selected' : ''}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  markerEnd={`url(#${selected ? 'dg-arrow-sel' : 'dg-arrow'})`}
                  pointerEvents="none"
                />
                {e.label && (
                  <text className="dg-edge-label" x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6} textAnchor="middle">
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {d.nodes.map((n) => {
            const selected = sel?.type === 'node' && sel.id === n.id;
            const meta = KINDS.find((k) => k.kind === n.kind)!;
            return (
              <g key={n.id} className="dg-node" onPointerDown={(e) => onNodeDown(e, n)} onDoubleClick={rename} style={{ cursor: connect ? 'crosshair' : 'move' }}>
                <Shape n={n} color={colorOf(n.kind)} selected={selected} pending={pendingFrom === n.id} />
                {n.kind !== 'note' && (
                  <text className="kind" x={n.x + n.w / 2} y={n.y + (n.kind === 'db' || n.kind === 'storage' ? 26 : 18)} textAnchor="middle">
                    {meta.label.toUpperCase()}
                  </text>
                )}
                <text x={n.x + n.w / 2} y={n.y + n.h / 2 + (n.kind === 'note' ? 4 : 10)} textAnchor="middle">
                  {n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label}
                </text>
              </g>
            );
          })}
          {!d.nodes.length && (
            <text x={40} y={60} fill="var(--faint)" fontSize={14} fontFamily="var(--font)">
              Add boxes from the toolbar, drag to arrange, Connect to draw arrows, double-click to label.
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
