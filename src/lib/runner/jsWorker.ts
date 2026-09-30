import { execJs, prepareJs } from './jsHarness';
import type { WorkerRequest, WorkerResponse } from './protocol';

const post = (msg: WorkerResponse) => (self as unknown as Worker).postMessage(msg);

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  if (msg.type === 'init') {
    post({ type: 'ready', version: 'JavaScript' });
  } else if (msg.type === 'run') {
    const prepared = prepareJs(msg.code, msg.spec);
    post({ type: 'prepared', id: msg.id, error: prepared.error, stdout: prepared.stdout });
    if (prepared.error) return;
    msg.tests.forEach((test, index) => {
      post({ type: 'result', id: msg.id, index, result: prepared.runOne(test) });
    });
    post({ type: 'done', id: msg.id });
  } else if (msg.type === 'exec') {
    post({ type: 'exec-result', id: msg.id, report: execJs(msg.code) });
  }
};
