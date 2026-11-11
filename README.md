# xeus-runner

Run `xeus` WebAssembly kernels outside of JupyterLite in TypeScript/JavaScript projects, both in the
browser and in Node.js.

Simple example that runs in a HTML page and add the output to the DOM:

```ts
import { DOMMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  worker: true
});
kernel.execute({ code: `import numpy as np
print("Hello from Python!")
np.sqrt(2.0)` });
```

Example of adding JavaScript direct to a HTML page will be coming shortly.

Simple example that runs in `node`:

```ts
import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  worker: true
});
const code = `import numpy as np
print("Hello from Python!", np.sqrt(2.0))`;
const ret = await kernel.execute({ code });
console.log(ret);
kernel.dispose();
```

By default nothing is logged in Node.js. To log kernel initialisation to a file pass a `FileLogger`
to the `XeusKernel` constructor, e.g. `logger: new FileLogger({ filename: 'xeus-runner.log' })`.

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

Output JavaScript is in the `lib` directory, and pre-packed bundles in `dist_node` and `dist_web`.

## Examples

To build the examples locally, build the project as above and then:

```bash
cd examples
npm install
npm run build
```

To run the browser examples use:

```ts
npm run serve
```

and then open a web browser at:

- http://localhost:4500/ - served without cross-origin isolation headers
- http://localhost:4501/ - served with cross-origin isolation headers

To run a Node.js example use, for example:

```bash
node dist_node/python_worker.js
```

## Testing

To test, first build the project as above and then:

```bash
cd test
npm install
npx playwright install chromium
npm run build
```

There are three types of tests which are `unit`, `node` and `web`, the latter requires `playwright`.
Run the separately using any of:

```bash
npm run test:unit
npm run test:node
npm run test:web
```

or run them all together using:

```bash
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
