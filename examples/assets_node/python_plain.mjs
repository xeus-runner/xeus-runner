// Plain JavaScript example that imports the xeus-runner.js bundle directly, without being compiled.
// Run from the examples directory after building with:
//   node dist_node/python_plain.mjs
//   node dist_node/python_plain.mjs --worker

import { FileLogger, XeusKernel } from './xeus-runner.js';

const worker = process.argv.includes('--worker');

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  worker,
});
const code = `import numpy as np
print("Hello from Python!", np.sqrt(2.0))`;
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
