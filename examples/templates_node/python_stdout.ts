// :title: Streaming output to stdout and stderr.

import { FileLogger, StreamMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  messageHandler: new StreamMessageHandler(),
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  // :worker:
});
const code = `import numpy as np
print("Hello from Python!", np.sqrt(2.0))`;
await kernel.execute({ code });
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
