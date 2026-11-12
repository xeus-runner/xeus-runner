// Simple Octave example

import { FileLogger, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'octave',
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  worker: process.argv.includes('--worker'),
});
const code = 'printf("Hello from Octave!")';
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
