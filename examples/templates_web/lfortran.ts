// :title: Simple example

import { DOMMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'lfortran',
  messageHandler: new DOMMessageHandler({ targetElement: 'target', progressElement: 'progress' }),
  // :worker:
});
const code = `real :: a, b, result
a = 5.7
b = 0.5
result = a + b
print '(A, F6.2)', "Hello from LFortran, the sum is ", result`;
kernel.execute({ code });
