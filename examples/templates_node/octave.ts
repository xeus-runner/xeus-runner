// :title: Simple example

import { FileLogger, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'octave',
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  // :worker:
});
const code = 'printf("Hello from Octave!")';
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
