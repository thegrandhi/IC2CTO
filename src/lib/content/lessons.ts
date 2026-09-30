import { extractFences, parseBullets, parseMeta, splitDoc } from './markdown';

export interface Lesson {
  id: string;
  title: string;
  category: string;
  summary: string;
  minutes: number;
  order: number;
  body: string;
  takeaways: string[];
  /** Markdown links for further reading (only reachable when online). */
  links: string[];
}

export function parseLesson(id: string, md: string): Lesson {
  const file = `lessons/${id}.md`;
  const doc = splitDoc(md);
  const { fences, rest } = extractFences(doc.preamble);
  const metaFence = fences.find((f) => f.lang === 'meta');
  if (!metaFence) throw new Error(`${file}: missing meta block`);
  const meta = parseMeta(metaFence.code);
  const get = (k: string) => {
    const v = meta.get(k)?.[0];
    if (v === undefined) throw new Error(`${file}: missing "${k}"`);
    return v;
  };
  // Keep the fenced code/diagram blocks that are part of the lesson body.
  const bodyFences = fences.filter((f) => f.lang !== 'meta');
  let body = rest;
  if (bodyFences.length) {
    body = doc.preamble.replace(/```meta[\s\S]*?```\n?/, '').trim();
  }
  return {
    id,
    title: doc.title,
    category: get('category'),
    summary: get('summary'),
    minutes: Number(meta.get('minutes')?.[0] ?? 3),
    order: Number(meta.get('order')?.[0] ?? 100),
    body,
    takeaways: parseBullets(doc.sections.get('key takeaways') ?? ''),
    links: parseBullets(doc.sections.get('go deeper') ?? ''),
  };
}
