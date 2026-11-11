// :title: Simple example

import { DOMMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
const code = `import numpy as np
print("Hello from Python!")
np.sqrt(2.0)`;
kernel.execute({ code });
