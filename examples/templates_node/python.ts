// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  // :worker:
});
const code = `import numpy as np
print("Hello from Python!", np.sqrt(2.0))`;
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
