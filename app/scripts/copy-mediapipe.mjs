// Copies the MediaPipe wasm runtime into public/ so the face check is self-hosted
// (no third-party CDN at the booth). Runs on `npm install`.
import { cpSync, mkdirSync, existsSync } from 'node:fs';

const src = 'node_modules/@mediapipe/tasks-vision/wasm';
const dest = 'public/mediapipe/wasm';
if (!existsSync(src)) process.exit(0);
mkdirSync(dest, { recursive: true });
for (const f of [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
]) {
  cpSync(`${src}/${f}`, `${dest}/${f}`);
}
console.log('MediaPipe wasm copied to', dest);
