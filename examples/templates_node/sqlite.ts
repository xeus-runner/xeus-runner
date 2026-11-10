// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'sqlite',
  // :worker:
});
await kernel.execute({ code: '%CREATE mydb.db mydb' });
const ret = await kernel.execute({ code: 'SELECT sqlite_version()' });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
