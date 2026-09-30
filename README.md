# Code Gym

A gym for coding interviews and system design that works **fully offline**: on a laptop without Wi-Fi, on a plane, or on your phone between sets.

- **138 coding problems** across 18 patterns (arrays, two pointers, sliding window, trees, graphs, DP, …). Solve them in **Python or JavaScript** right in the browser, with instant tests, hints, explanations and reference solutions in both languages.
- **Quick Reps**: 3-minute, tap-only sessions built for a phone. Fill-in-the-blank code, "order the lines" drills and system design questions, with no typing needed.
- **Daily question**: one system design question a day across Databases, Infrastructure, APIs, Theory and Product, followed by the reasoning behind the answer. Missed questions come back on a spaced-repetition schedule.
- **27 bite-size lessons** on the fundamentals (caching, sharding, replication, CAP, queues, rate limiting, …). Each links to its quiz questions.
- **12 mock design interviews** (URL shortener, chat, news feed, video streaming, ride sharing, …): a 45-minute timer with a step-by-step framework, a whiteboard for boxes and arrows, and a reference answer and rubric to grade yourself.
- **Spaced repetition** for problems you've solved, plus streaks, a daily workout, an activity heatmap, per-pattern progress, a timed mock-interview mode, a code playground, and backup/restore.

Everything, including the Python runtime, is cached on the device. Nothing is sent anywhere, and progress is stored in the browser.

## Quick start

```bash
npm install        # also copies the Python runtime (Pyodide) into public/pyodide
npm run dev        # http://localhost:5173
```

Production build with offline support (the service worker only runs in a build):

```bash
npm run build
npm run preview    # http://localhost:4173, then open it once and it works offline afterwards
```

## Put it on your phone

Installing a web app with offline support requires HTTPS, so host it once. This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that tests, builds and publishes to **GitHub Pages**:

1. Push to the default branch.
2. In the repository, go to **Settings → Pages → Build and deployment → Source: GitHub Actions** (one time).
3. Open `https://<your-user>.github.io/<repo>/` on your phone:
   - **iPhone (Safari):** Share → **Add to Home Screen**.
   - **Android (Chrome):** menu → **Install app**.
4. Open it once while online so it can cache everything (about 15 MB, most of it Python). After that it runs offline.

Progress lives on each device. Use **Settings → Export backup / Restore from file** to move it between devices.

## How it works

| Piece | Tech |
|---|---|
| App | React + TypeScript, built with Vite |
| Editor | CodeMirror 6 |
| Python | [Pyodide](https://pyodide.org) (CPython compiled to WebAssembly) in a Web Worker |
| JavaScript | A sandboxed Web Worker |
| Offline | Service worker (vite-plugin-pwa / Workbox) precaches the app, the content and Pyodide |
| Storage | `localStorage` (progress, drafts, notes, backups as JSON) |

User code always runs in a worker. If a test makes no progress for 5 seconds (8 for Python), the worker is killed and restarted, so infinite loops show up as *Time Limit Exceeded* instead of freezing the page.

The same test harness runs in the browser and in CI:

- `src/lib/runner/harness.py` runs in Pyodide and under your local `python3`.
- `src/lib/runner/jsHarness.ts` runs in the JS worker and under Node.

## Adding content

All content is Markdown under `content/`; the app picks up new files automatically.

### Coding problems: `content/problems/<id>.md`

````markdown
# Two Sum

```meta
difficulty: Easy                      # Easy | Medium | Hard
topic: Arrays & Hashing               # one of TOPICS in src/lib/content/problems.ts
tags: hash map
signature: twoSum(nums: int[], target: int) -> int[]
compare: exact                        # exact | unordered | unorderedDeep | float
time: O(n)
space: O(n)
```

Problem statement in Markdown…

## Hints
- First hint
- Second hint

## Solution
Explanation…

```python
class Solution:
    def twoSum(self, nums, target): ...
```

```javascript
function twoSum(nums, target) { ... }
```

## Tests
```jsonl
{"in": [[2, 7, 11, 15], 9], "out": [0, 1]}
{"in": [[3, 2, 4], 6]}
```
````

- Types: `int`, `float`, `bool`, `string`, `char`, arrays of those (`int[][]`), `ListNode`, `TreeNode` (level order with `null`s), `ListNodeCycle` (`[values, pos]`), `TreeNodeRef` (a node found by value), `GraphNode` (adjacency list).
- Design-style problems (like LRU Cache) use `class: LRUCache(capacity: int)` plus one `method:` line per method, and tests of the form `{"ops": [...], "args": [...]}`.
- `mutates: board` judges a parameter that's modified in place, instead of the return value.
- The first 3 tests are shown as examples (change this with `examples: N`).
- **Leave `out` off** and run `npm run fill`. The Python reference solution computes the expected output, and the JavaScript reference must agree. Then run `npm test`.

### Quiz questions: `content/quiz/<category>.md`

````markdown
::: mcq my-question-id
lesson: caching                       # optional: links to content/lessons/caching.md
Question text…

- [ ] wrong
- [x] right                           # several [x] make it "select all that apply"
???
Explanation shown after answering.
:::
````

Other types:

- `order` lists `1. item` lines in the correct order.
- `match` uses `- left => right` pairs.
- `lines` holds a code fence whose lines get shuffled.
- `blank` holds a code fence with `{{answer}}` gaps, plus an optional `- extra: a | b` line of distractor tokens.

### Lessons and design prompts

See any file in `content/lessons/` or `content/design/`. Design prompts need the sections Requirements, Estimation, API, Data model, High-level design, Deep dives, Wrap-up and Rubric.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build (with service worker) |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests, plus every reference solution run against every test in both languages |
| `npm run fill` | Fill in missing expected outputs in problem tests |

Set `BASE_PATH=/sub/path/` when building for hosting under a sub-path (the Pages workflow does this automatically).

## Project layout

```
content/            problems, quiz, lessons, design prompts (Markdown)
scripts/            copy-pyodide, fill-expected, Python test runner
src/lib/content/    Markdown parsers for all content types
src/lib/runner/     Python + JS harnesses, workers, watchdog, output comparison
src/lib/            store (localStorage), spaced repetition, daily planner
src/pages/          Today, Problems, Problem workspace, Review, Quiz, Learn, Design, Playground, Settings
src/components/     code editor, quiz cards, diagram editor, UI bits
```
