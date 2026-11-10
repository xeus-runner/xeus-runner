// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'cpp',
  channels: ['standard-4x'], // Until xeus-cpp for 6x is available
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = `#include <iostream>
float f = 1.23;
std::cout << "Hello from C++! " << f << std::endl;`;
kernel.execute({ code });
