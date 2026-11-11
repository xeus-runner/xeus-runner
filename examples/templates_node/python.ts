// :title: Simple example

import { FileLogger, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  // :worker:
});
const code = `import numpy as np
print("Hello from Python!", np.sqrt(2.0))`;
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
