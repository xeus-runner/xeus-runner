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
};

build({
  entryPoints: ['tmp_web/*.ts'],
  ...commonOptions,
}).catch(() => process.exit(1));
