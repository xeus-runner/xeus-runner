// Python example streaming output to stdout and stderr.

import { FileLogger, TerminalMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  messageHandler: new TerminalMessageHandler({ showProgress: process.stdout.isTTY }),
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  worker: process.argv.includes('--worker'),
});
const code = `import numpy as np
print("Hello from Python!", np.sqrt(2.0))`;
await kernel.execute({ code });
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
