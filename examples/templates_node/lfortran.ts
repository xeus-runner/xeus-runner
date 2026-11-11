// :title: Simple example

import { FileLogger, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'lfortran',
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  // :worker:
});
const code = `real :: a, b, result
a = 5.7
b = 0.5
result = a + b
print '(A, F6.2)', "Hello from LFortran, the sum is ", result`;
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
