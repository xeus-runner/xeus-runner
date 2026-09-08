// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'cpp',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = `#include <iostream>
float f = 1.23;
std::cout << "Hello from C++! " << f << std::endl;`;
kernel.execute({ code });
