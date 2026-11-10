// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'octave',
  channels: ['standard-4x'], // Until xeus-octave for 6x is available
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = 'printf("Hello from Octave!")';
kernel.execute({ code });
