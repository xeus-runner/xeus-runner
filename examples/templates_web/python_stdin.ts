// :title: Stdin
// :note: only in web worker with cross-origin headers
// :not-main:

import { DOMMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
await kernel.execute({ code: 'name = input("What is your name?")' });
await kernel.execute({ code: 'print(name)' });
