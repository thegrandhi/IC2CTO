// Copies the Pyodide runtime (CPython compiled to WebAssembly) from node_modules
// into public/pyodide so it is served by Vite and precached by the service worker.
// This is what lets Python run fully offline.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const src = dirname(require.resolve('pyodide/package.json'));
const dest = join(root, 'public', 'pyodide');

const files = [
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

mkdirSync(dest, { recursive: true });
let copied = 0;
for (const file of files) {
  const from = join(src, file);
  const to = join(dest, file);
  if (!existsSync(from)) {
    console.error(`[copy-pyodide] missing ${from}`);
    process.exit(1);
  }
  if (existsSync(to) && statSync(to).size === statSync(from).size && statSync(to).mtimeMs >= statSync(from).mtimeMs) {
    continue;
  }
  copyFileSync(from, to);
  copied++;
}
console.log(`[copy-pyodide] ${copied ? `copied ${copied} file(s)` : 'up to date'} -> public/pyodide`);
