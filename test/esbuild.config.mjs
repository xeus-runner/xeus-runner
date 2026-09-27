import { build } from 'esbuild';

const commonOptions = {
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  sourcemap: false,
  minify: false,
  loader: {
    '.wasm': 'empty',
  },
};

build({
  entryPoints: ['serve/*.ts'],
  ...commonOptions,
}).catch(() => process.exit(1));
