// :title: Streaming output to stdout and stderr.

import { StreamMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  messageHandler: new StreamMessageHandler(),
  // :worker:
});
const code = `import numpy as np
print("Hello from Python!", np.sqrt(2.0))`;
await kernel.execute({ code });
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
