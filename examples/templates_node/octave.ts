// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'octave',
  channels: ['standard-4x'], // Until xeus-octave for 6x is available
  // :worker:
});
const code = 'printf("Hello from Octave!")';
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
