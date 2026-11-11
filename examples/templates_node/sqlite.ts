// :title: Simple example

import { FileLogger, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'sqlite',
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  // :worker:
});
await kernel.execute({ code: '%CREATE mydb.db mydb' });
const ret = await kernel.execute({ code: 'SELECT sqlite_version()' });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
