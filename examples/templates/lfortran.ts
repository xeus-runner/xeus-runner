// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'lfortran',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = `real :: a, b, result
a = 5.7
b = 0.5
result = a + b
print '(A, F6.2)', "Hello from LFortran, the sum is ", result`;
kernel.execute({ code });
