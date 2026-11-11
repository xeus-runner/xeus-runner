import { copyFileSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

const outdir = 'dist_node';

const commonOptions = {
  outdir,
  bundle: true,
  format: 'esm',
  sourcemap: false,
  minify: false,
  loader: {
    '.wasm': 'empty',
  },
  platform: 'node',
  external: ['xeus-runner'],
};

await build({
  entryPoints: ['tmp_node/*.ts'],
  ...commonOptions,
}).catch(() => process.exit(1));

cpSync('assets_node', outdir, { recursive: true });

const libDir = `../${outdir}`;
for (const file of readdirSync(libDir)) {
  if (file.endsWith('node_worker_impl.js') || file === 'unpack.wasm' || file === 'xeus-runner.js') {
    copyFileSync(join(libDir, file), join(outdir, file));
  }
}
