// :title: IPython display image

import { DOMMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
const code = `from IPython import display
display.Image(filename='/share/jupyter/kernels/xpython/logo-64x64.png')`;
kernel.execute({ code });
