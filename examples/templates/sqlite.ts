// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'sqlite',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
await kernel.execute({ code: '%CREATE mydb.db mydb' });
await kernel.execute({ code: 'SELECT sqlite_version()' });
