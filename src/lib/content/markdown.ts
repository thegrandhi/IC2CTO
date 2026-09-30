// Small, dependency-free helpers for reading the Markdown content files in /content.

export interface Fence {
  lang: string;
  info: string;
  code: string;
}

export interface Doc {
  title: string;
  /** Text between the H1 and the first `## ` heading. */
  preamble: string;
  /** `## Heading` sections keyed by lower-cased heading text. */
  sections: Map<string, string>;
}

const FENCE_RE = /^(\s*)(`{3,}|~{3,})(.*)$/;

/** Iterates lines, reporting whether each line is inside a fenced code block. */
function* linesWithFenceState(md: string): Generator<{ line: string; inFence: boolean; isFenceLine: boolean }> {
  let open: string | null = null;
  for (const line of md.split('\n')) {
    const m = FENCE_RE.exec(line);
    if (m) {
      const marker = m[2];
      if (open === null) {
        open = marker;
        yield { line, inFence: true, isFenceLine: true };
        continue;
      }
      if (marker[0] === open[0] && marker.length >= open.length && m[3].trim() === '') {
        open = null;
        yield { line, inFence: true, isFenceLine: true };
        continue;
      }
    }
    yield { line, inFence: open !== null, isFenceLine: false };
  }
}

export function splitDoc(md: string): Doc {
  let title = '';
  const preamble: string[] = [];
  const sections = new Map<string, string>();
  let current: string[] = preamble;
  let currentKey: string | null = null;

  const flush = () => {
    if (currentKey !== null) sections.set(currentKey, current.join('\n').trim());
  };

  for (const { line, inFence } of linesWithFenceState(md.replace(/\r\n/g, '\n'))) {
    if (!inFence) {
      const h1 = /^# (.+)$/.exec(line);
      if (h1 && !title && currentKey === null) {
        title = h1[1].trim();
        continue;
      }
      const h2 = /^## (.+)$/.exec(line);
      if (h2) {
        flush();
        currentKey = h2[1].trim().toLowerCase();
        current = [];
        continue;
      }
    }
    current.push(line);
  }
  flush();
  return { title, preamble: preamble.join('\n').trim(), sections };
}

/** Pulls fenced code blocks out of a Markdown string. */
export function extractFences(md: string): { fences: Fence[]; rest: string } {
  const fences: Fence[] = [];
  const rest: string[] = [];
  let buf: string[] | null = null;
  let info = '';
  for (const { line, isFenceLine } of linesWithFenceState(md)) {
    if (isFenceLine) {
      if (buf === null) {
        buf = [];
        info = FENCE_RE.exec(line)![3].trim();
      } else {
        fences.push({ lang: info.split(/\s+/)[0] ?? '', info, code: buf.join('\n') });
        buf = null;
      }
      continue;
    }
    if (buf !== null) buf.push(line);
    else rest.push(line);
  }
  return { fences, rest: rest.join('\n').replace(/\n{3,}/g, '\n\n').trim() };
}

/** Parses `key: value` lines. Repeated keys accumulate. */
export function parseMeta(src: string): Map<string, string[]> {
  const meta = new Map<string, string[]>();
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx < 0) throw new Error(`Bad meta line: ${line}`);
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    const list = meta.get(key) ?? [];
    list.push(value);
    meta.set(key, list);
  }
  return meta;
}

/** Top-level `- item` bullets (continuation lines are joined). */
export function parseBullets(md: string): string[] {
  const items: string[] = [];
  for (const line of md.split('\n')) {
    const m = /^[-*] (.*)$/.exec(line);
    if (m) items.push(m[1].trim());
    else if (items.length && line.trim()) items[items.length - 1] += ' ' + line.trim();
  }
  return items;
}

/** Stable short hash for ids derived from text. */
export function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
