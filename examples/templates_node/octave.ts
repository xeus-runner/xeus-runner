// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'octave',
  // :worker:
});
const code = 'printf("Hello from Octave!")';
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
