// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'octave',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = 'printf("Hello from Octave!")';
kernel.execute({ code });
