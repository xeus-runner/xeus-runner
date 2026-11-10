// :title: Simple example

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'haskell',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = `main :: IO ()
main = putStrLn "Hello from Haskell!"
main`;
kernel.execute({ code });
