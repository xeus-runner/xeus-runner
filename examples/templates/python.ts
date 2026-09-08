// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = `import numpy as np
print("Hello from Python!")
np.sqrt(2.0)`;
kernel.execute({ code });
