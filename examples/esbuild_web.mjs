import { copyFileSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const outdir = 'dist_web';

const commonOptions = {
  outdir,
  bundle: true,
  format: 'esm',
  sourcemap: false,
  minify: false,
  loader: {
    '.wasm': 'empty',
  },
  alias: { path: 'path-browserify' },
  external: ['node:*', 'fs', 'crypto'],
};

await build({
  entryPoints: ['tmp_web/*.ts'],
  ...commonOptions,
}).catch(() => process.exit(1));

cpSync('assets', outdir, { recursive: true });

const libDir = `../${outdir}`;
for (const file of readdirSync(libDir)) {
  if (file.endsWith('_web_worker_impl.js') || file === 'unpack.wasm') {
    copyFileSync(join(libDir, file), join(outdir, file));
  }
}
