// :title: Simple example

import { DOMMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'sqlite',
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
await kernel.execute({ code: '%CREATE mydb.db mydb' });
await kernel.execute({ code: 'SELECT sqlite_version()' });
