// :title: Simple example

import { DOMMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'haskell',
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
const code = `main :: IO ()
main = putStrLn "Hello from Haskell!"
main`;
kernel.execute({ code });
