import harnessSource from './harness.py?raw';
import type { WorkerRequest, WorkerResponse } from './protocol';

interface PyProxyFn {
  (...args: unknown[]): unknown;
  destroy?: () => void;
}
interface Pyodide {
  FS: { writeFile(path: string, data: string): void };
  runPython(code: string): unknown;
  pyimport(name: string): Record<string, PyProxyFn>;
}

const post = (msg: WorkerResponse) => (self as unknown as Worker).postMessage(msg);

let harness: Record<string, PyProxyFn> | null = null;
const fnCache = new Map<string, PyProxyFn>();
let initPromise: Promise<void> | null = null;

async function init(pyodideUrl: string) {
  post({ type: 'loading', message: 'Loading Python runtime…' });
  const mod = (await import(/* @vite-ignore */ `${pyodideUrl}pyodide.mjs`)) as {
    loadPyodide(opts: Record<string, unknown>): Promise<Pyodide>;
  };
  const py = await mod.loadPyodide({ indexURL: pyodideUrl, stdout: () => {}, stderr: () => {} });
  py.FS.writeFile('/home/pyodide/gym_harness.py', harnessSource);
  py.runPython('import sys; sys.path.insert(0, "/home/pyodide")');
  harness = py.pyimport('gym_harness');
  const version = String(harness.gym_version());
  post({ type: 'ready', version: `Python ${version}` });
}

function call(name: string, ...args: unknown[]): string {
  let fn = fnCache.get(name);
  if (!fn) {
    fn = harness![name];
    fnCache.set(name, fn);
  }
  return String(fn(...args));
}

function isFatal(e: unknown): boolean {
  return /fatal error/i.test(String((e as Error)?.message ?? e));
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  if (msg.type === 'init') {
    initPromise ??= init(msg.pyodideUrl!).catch((e) => {
      post({ type: 'init-error', error: String((e as Error)?.message ?? e) });
      throw e;
    });
    return;
  }
  try {
    await initPromise;
  } catch {
    return;
  }
  try {
    if (msg.type === 'run') {
      const prep = JSON.parse(call('gym_prepare', msg.code, JSON.stringify(msg.spec))) as { error: string | null; stdout: string };
      post({ type: 'prepared', id: msg.id, error: prep.error ?? undefined, stdout: prep.stdout });
      if (prep.error) return;
      msg.tests.forEach((test, index) => {
        post({ type: 'result', id: msg.id, index, result: JSON.parse(call('gym_run_one', JSON.stringify(test))) });
      });
      post({ type: 'done', id: msg.id });
    } else if (msg.type === 'exec') {
      const res = JSON.parse(call('gym_exec', msg.code)) as { error: string | null; stdout: string; ms: number };
      post({ type: 'exec-result', id: msg.id, report: { stdout: res.stdout, error: res.error ?? undefined, ms: res.ms } });
    }
  } catch (e) {
    const error = String((e as Error)?.message ?? e);
    post({ type: 'fatal', error: isFatal(e) ? 'The Python runtime crashed (often a stack overflow from very deep recursion).' : error });
  }
};
