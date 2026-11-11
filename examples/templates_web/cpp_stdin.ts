// :title: Stdin
// :note: only in web worker with cross-origin headers
// :not-main:

import { DOMMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'cpp',
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
const code = `#include <iostream>
#include <string>

std::string name;
std::cout << "What is your name?" << std::endl;
std::cin >> name`;
await kernel.execute({ code });
await kernel.execute({ code: 'std::cout << "Your name is " << name << std::endl;' });
