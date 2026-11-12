// Simple Haskell example

import { FileLogger, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'haskell',
  logger: new FileLogger({ filename: 'xeus-runner.log' }),
  worker: process.argv.includes('--worker'),
});
const code = `main :: IO ()
main = putStrLn "Hello from Haskell!"
main`;
const ret = await kernel.execute({ code });
console.log(ret);
console.log(`isWorker: ${kernel.isWorker}`);
kernel.dispose();
