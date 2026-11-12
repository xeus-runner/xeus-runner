// Simple R example

import { FileLogger, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'r',
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  worker: process.argv.includes('--worker'),
});
const code = `x <- "Hello from R!"
print(x)`;
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
