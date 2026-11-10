// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'lua',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = 'print("Hello from Lua!")';
kernel.execute({ code });
