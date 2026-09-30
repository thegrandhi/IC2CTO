import type { Difficulty } from '../types';
import { extractFences, parseBullets, parseMeta, splitDoc } from './markdown';

export interface DesignStep {
  key: string;
  title: string;
  minutes: number;
  /** What to cover in this step (shown while practicing). */
  guide: string[];
}

/** The interview framework every design session follows. */
export const DESIGN_STEPS: DesignStep[] = [
  {
    key: 'requirements',
    title: 'Requirements',
    minutes: 5,
    guide: [
      'Functional: the 3–5 core features in scope. Say explicitly what is out of scope.',
      'Non-functional: scale (DAU, QPS), latency, availability vs consistency, durability.',
      'Ask about read/write ratio, data size, and who the clients are.',
    ],
  },
  {
    key: 'estimation',
    title: 'Estimation',
    minutes: 5,
    guide: [
      'Requests per second (average and peak). 1 day ≈ 10^5 seconds.',
      'Storage per year, bandwidth, and the size of the hot working set (cache).',
      'Only estimate what will change a design decision.',
    ],
  },
  {
    key: 'api',
    title: 'API',
    minutes: 5,
    guide: [
      'List the endpoints (REST/gRPC) or events with their inputs and outputs.',
      'Cover pagination, idempotency keys, auth, and rate limits where relevant.',
    ],
  },
  {
    key: 'data model',
    title: 'Data model',
    minutes: 5,
    guide: [
      'The main entities, their key fields, and the relationships between them.',
      'Choose a store for each (SQL, KV, wide-column, blob, search) and say why.',
      'Primary keys, indexes, and partition keys follow from the access patterns.',
    ],
  },
  {
    key: 'high-level design',
    title: 'High-level design',
    minutes: 10,
    guide: [
      'Draw the boxes: clients, load balancer, services, caches, queues, databases, storage, CDN.',
      'Walk through the main read path and the main write path end to end.',
    ],
  },
  {
    key: 'deep dives',
    title: 'Deep dives',
    minutes: 12,
    guide: [
      'Pick the 2–3 hardest parts: scaling hotspots, consistency, fan-out, failure handling.',
      'For each one, give options, tradeoffs, and a decision.',
    ],
  },
  {
    key: 'wrap-up',
    title: 'Wrap-up',
    minutes: 3,
    guide: [
      'Bottlenecks and single points of failure, and how you would find them (metrics, alerts).',
      'What you would build next with more time.',
    ],
  },
];

export interface DesignPrompt {
  id: string;
  title: string;
  difficulty: Difficulty;
  minutes: number;
  tags: string[];
  prompt: string;
  clarifying: string[];
  /** Reference notes keyed by DESIGN_STEPS[].key. */
  reference: Record<string, string>;
  rubric: string[];
}

export function parseDesign(id: string, md: string): DesignPrompt {
  const file = `design/${id}.md`;
  const doc = splitDoc(md);
  const { fences, rest } = extractFences(doc.preamble);
  const metaFence = fences.find((f) => f.lang === 'meta');
  if (!metaFence) throw new Error(`${file}: missing meta block`);
  const meta = parseMeta(metaFence.code);
  const reference: Record<string, string> = {};
  for (const step of DESIGN_STEPS) {
    const text = doc.sections.get(step.key);
    if (!text) throw new Error(`${file}: missing "## ${step.title}" reference section`);
    reference[step.key] = text;
  }
  const rubric = parseBullets(doc.sections.get('rubric') ?? '');
  if (rubric.length < 5) throw new Error(`${file}: rubric needs at least 5 items`);
  return {
    id,
    title: doc.title,
    difficulty: (meta.get('difficulty')?.[0] ?? 'Medium') as Difficulty,
    minutes: Number(meta.get('minutes')?.[0] ?? 45),
    tags: (meta.get('tags')?.[0] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    prompt: rest,
    clarifying: parseBullets(doc.sections.get('clarifying questions') ?? ''),
    reference,
    rubric,
  };
}
