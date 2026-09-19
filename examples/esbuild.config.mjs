import { build } from 'esbuild';

const commonOptions = {
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  sourcemap: false,
  minify: false,
  loader: {
    '.wasm': 'file',
  },
};

build({
  entryPoints: ['tmp/*.ts'],
  ...commonOptions,
}).catch(() => process.exit(1));

// Also bundle webworkers.
build({
  entryPoints: ['../lib/impl/coincident_web_worker_impl.js'],
  ...commonOptions,
}).catch(() => process.exit(1));
