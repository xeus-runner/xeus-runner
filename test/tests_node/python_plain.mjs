// Plain JavaScript script that imports the dist_node bundle directly, without being compiled.
// Run by kernel_python_plain.test.ts, writes the result as JSON on the last line of stdout.

import { XeusKernel } from '../../dist_node/xeus-runner.js';

const worker = process.argv.includes('--worker');

const kernel = new XeusKernel({ type: 'python', worker });
const executeReturn = await kernel.execute({ code: 'print("Hello from Python!")' });
const raiseReturn = await kernel.execute({
  code: 'raise RuntimeError("Some error")\nprint("Not reached")',
});
const assertReturn = await kernel.execute({
  code: 'assert 1 == 2, "Some assert"\nprint("Not reached")',
});
const { isWorker } = kernel;
kernel.dispose();

console.log(JSON.stringify({ executeReturn, raiseReturn, assertReturn, isWorker }));
