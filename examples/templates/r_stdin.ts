// :title: Stdin
// :note: only in web worker with cross-origin headers
// :not-main:

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'r',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
await kernel.execute({ code: 'name <- readline("What is your name?")' });
await kernel.execute({ code: 'name' });
