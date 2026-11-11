// :title: Simple example

import { DOMMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'octave',
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
const code = 'printf("Hello from Octave!")';
kernel.execute({ code });
