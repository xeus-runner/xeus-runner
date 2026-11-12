// Simple C++ example

import { FileLogger, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'cpp',
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  worker: process.argv.includes('--worker'),
});
const code = `#include <iostream>
float f = 1.23;
std::cout << "Hello from C++! " << f << std::endl;`;
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
