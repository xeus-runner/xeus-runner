# xeus-runner

Run `xeus` WebAssembly kernels outside of JupyterLite in TypeScript/JavaScript projects.

Simple example that runs in a HTML page:

```ts
import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  parentElement: 'target',
  showCode: true,
  worker: true
});
kernel.execute({ code: `import numpy as np
print("Hello from Python!")
np.sqrt(2.0)` });
```

## Kernel languages supported

- xeus-cpp
- xeus-haskell
- xeus-lfortran
- xeus-lua
- xeus-octave
- xeus-python
- xeus-r
- xeus-shakespearelang
- xeus-sqlite

## Build

To build you need a `nodejs >= 24`.

```bash
npm install
npm run build
```

Output JavaScript is in the `lib` directory.

## Examples

To build and serve the examples locally, build the project and then:

```bash
cd examples
npm install
npm run build
npm run serve
```

Open a web browser and you can try out the various examples:

- http://localhost:4500/ - served without cross-origin isolation headers
- http://localhost:4501/ - served with cross-origin isolation headers

## Testing

To test, first build the project and then:

```bash
cd test
npm install
npx playwright install chromium
npm run build
npm run test
```

## Documentation

To build the documentation:

```bash
cd docs
micromamba create -f docs-environment
micromamba activate xeus-runner-docs
make html
```
