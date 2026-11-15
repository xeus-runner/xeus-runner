// :title: Simple example

import { DOMMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'r',
  messageHandler: new DOMMessageHandler({ targetElement: 'target', progressElement: 'progress' }),
  // :worker:
});
const code = `x <- "Hello from R!"
print(x)`;
kernel.execute({ code });
