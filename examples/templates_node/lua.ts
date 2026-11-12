// Simple Lua example

import { FileLogger, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'lua',
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  worker: process.argv.includes('--worker'),
});
const code = 'print("Hello from Lua!")';
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
