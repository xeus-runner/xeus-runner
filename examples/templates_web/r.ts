// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'r',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = `x <- "Hello from R!"
print(x)`;
kernel.execute({ code });
