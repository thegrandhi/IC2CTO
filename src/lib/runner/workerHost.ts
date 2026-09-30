import type { ExecReport, RawResult, RunSpec, TestCase } from '../types';
import type { WorkerRequest, WorkerResponse } from './protocol';

export type RunnerStatus = 'cold' | 'loading' | 'ready' | 'busy' | 'error';

export interface RunnerState {
  status: RunnerStatus;
  message: string;
  version?: string;
}

export interface RawRunReport {
  compileError?: string;
  stdout: string;
  results: RawResult[];
  /** Index of the test that exceeded the time limit, if any. */
  timedOutAt?: number;
  /** Set when the worker crashed or the run was cancelled. */
  crashed?: string;
}

interface Job {
  id: number;
  onMessage(msg: WorkerResponse): void;
  onCrash(error: string): void;
}

export interface WorkerHostOptions {
  /** Max time without progress (per test) before the worker is killed. */
  stepTimeoutMs: number;
  initTimeoutMs: number;
  /** Extra data for the worker's init message (e.g. where Pyodide lives). */
  initData?: () => Omit<Extract<WorkerRequest, { type: 'init' }>, 'type'>;
}

/**
 * Owns one Web Worker that executes user code. Because user code can loop
 * forever, every run is guarded by a watchdog: if a test makes no progress
 * within `stepTimeoutMs` the worker is terminated and a fresh one is started.
 */
export class WorkerHost {
  state: RunnerState = { status: 'cold', message: '' };
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private job: Job | null = null;
  private seq = 0;
  private listeners = new Set<() => void>();
  private createWorker: () => Worker;
  private opts: WorkerHostOptions;

  constructor(createWorker: () => Worker, opts: WorkerHostOptions) {
    this.createWorker = createWorker;
    this.opts = opts;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getState = () => this.state;

  private setState(patch: Partial<RunnerState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  start(): Promise<void> {
    if (this.ready) return this.ready;
    const worker = this.createWorker();
    this.worker = worker;
    this.setState({ status: 'loading', message: 'Starting…' });
    const ready = new Promise<void>((resolve, reject) => {
      let settled = false;
      const fail = (error: string) => {
        clearTimeout(timer);
        if (this.worker === worker) this.kill();
        this.setState({ status: 'error', message: error });
        if (!settled) {
          settled = true;
          reject(new Error(error));
        }
      };
      const timer = setTimeout(() => fail('Timed out while loading the runtime.'), this.opts.initTimeoutMs);
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        switch (msg.type) {
          case 'loading':
            this.setState({ message: msg.message });
            break;
          case 'ready':
            clearTimeout(timer);
            settled = true;
            this.setState({ status: this.job ? 'busy' : 'ready', message: '', version: msg.version });
            resolve();
            break;
          case 'init-error':
            fail(msg.error);
            break;
          case 'fatal':
            this.crash(msg.error);
            break;
          default:
            if (this.job && 'id' in msg && msg.id === this.job.id) this.job.onMessage(msg);
        }
      };
      worker.onerror = (event: ErrorEvent) => {
        event.preventDefault();
        const error = event.message || 'The code runner crashed.';
        if (!settled) fail(error);
        else this.crash(error);
      };
      worker.postMessage({ type: 'init', ...this.opts.initData?.() } satisfies WorkerRequest);
    });
    this.ready = ready;
    ready.catch(() => undefined);
    return ready;
  }

  private kill() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }

  /** Kills the worker and starts a new one in the background. */
  private restart() {
    this.kill();
    this.setState({ status: 'cold', message: '' });
    this.start().catch(() => undefined);
  }

  private crash(error: string) {
    const job = this.job;
    this.restart();
    job?.onCrash(error);
  }

  /** Stops whatever is running. */
  cancel() {
    if (this.job) this.crash('Stopped.');
  }

  get busy() {
    return this.job !== null;
  }

  async run(
    code: string,
    spec: RunSpec,
    tests: TestCase[],
    onResult?: (index: number, result: RawResult) => void,
  ): Promise<RawRunReport> {
    this.cancel();
    await this.start();
    const worker = this.worker!;
    return new Promise((resolve) => {
      const id = ++this.seq;
      const report: RawRunReport = { stdout: '', results: [] };
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = () => {
        clearTimeout(timer);
        if (this.job?.id === id) {
          this.job = null;
          if (this.state.status === 'busy') this.setState({ status: 'ready' });
        }
        resolve(report);
      };
      const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          report.timedOutAt = report.results.length;
          this.job = null;
          this.restart();
          finish();
        }, this.opts.stepTimeoutMs);
      };
      this.job = {
        id,
        onMessage: (msg) => {
          if (msg.type === 'prepared') {
            report.stdout = msg.stdout;
            if (msg.error) {
              report.compileError = msg.error;
              finish();
            } else arm();
          } else if (msg.type === 'result') {
            report.results[msg.index] = msg.result;
            onResult?.(msg.index, msg.result);
            arm();
          } else if (msg.type === 'done') {
            finish();
          }
        },
        onCrash: (error) => {
          report.crashed = error;
          finish();
        },
      };
      this.setState({ status: 'busy' });
      worker.postMessage({ type: 'run', id, code, spec, tests } satisfies WorkerRequest);
      arm();
    });
  }

  async exec(code: string, timeoutMs: number): Promise<ExecReport> {
    this.cancel();
    await this.start();
    const worker = this.worker!;
    const started = performance.now();
    return new Promise((resolve) => {
      const id = ++this.seq;
      const finish = (report: ExecReport) => {
        clearTimeout(timer);
        if (this.job?.id === id) {
          this.job = null;
          if (this.state.status === 'busy') this.setState({ status: 'ready' });
        }
        resolve(report);
      };
      const timer = setTimeout(() => {
        this.job = null;
        this.restart();
        finish({ stdout: '', error: `Time limit exceeded (${timeoutMs / 1000}s). Is there an infinite loop?`, ms: performance.now() - started });
      }, timeoutMs);
      this.job = {
        id,
        onMessage: (msg) => {
          if (msg.type === 'exec-result') finish(msg.report);
        },
        onCrash: (error) => finish({ stdout: '', error, ms: performance.now() - started }),
      };
      this.setState({ status: 'busy' });
      worker.postMessage({ type: 'exec', id, code } satisfies WorkerRequest);
    });
  }
}
