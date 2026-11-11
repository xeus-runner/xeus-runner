// :title: Simple example

import { DOMMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'cpp',
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
const code = `#include <iostream>
float f = 1.23;
std::cout << "Hello from C++! " << f << std::endl;`;
kernel.execute({ code });
