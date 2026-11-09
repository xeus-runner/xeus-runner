/**
 * Build self-contained ESM bundles in dist_web/ suitable for uploading to a CDN.
 * The web worker bundles must be in the same directory as the main bundle as they are loaded
 * relative to it using `new URL('./<name>.js', import.meta.url)`.
 */
import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';

const outdir = 'dist_web';

await build({
  entryPoints: {
    'xeus-runner': 'src/index.ts',
    coincident_web_worker_impl: 'src/impl/coincident_web_worker_impl.ts',
    comlink_web_worker_impl: 'src/impl/comlink_web_worker_impl.ts',
  },
  outdir,
  bundle: true,
  format: 'esm',
  minify: true,
  sourcemap: true,
  // unpack.wasm is located at runtime via untarjsBaseUrl, so copy it rather than emit a hashed file.
  loader: { '.wasm': 'empty' },
  external: ['fs', 'crypto'],
  alias: { path: 'path-browserify' },
});

const require = createRequire(import.meta.url);
const untarjsDir = dirname(require.resolve('@emscripten-forge/untarjs'));
copyFileSync(join(untarjsDir, 'unpack.wasm'), join(outdir, 'unpack.wasm'));
