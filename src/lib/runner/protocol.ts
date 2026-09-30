import type { ExecReport, RawResult, RunSpec, TestCase } from '../types';

export type WorkerRequest =
  | { type: 'init'; pyodideUrl?: string }
  | { type: 'run'; id: number; code: string; spec: RunSpec; tests: TestCase[] }
  | { type: 'exec'; id: number; code: string };

export type WorkerResponse =
  | { type: 'loading'; message: string }
  | { type: 'ready'; version: string }
  | { type: 'init-error'; error: string }
  | { type: 'prepared'; id: number; error?: string; stdout: string }
  | { type: 'result'; id: number; index: number; result: RawResult }
  | { type: 'done'; id: number }
  | { type: 'exec-result'; id: number; report: ExecReport }
  | { type: 'fatal'; error: string };
