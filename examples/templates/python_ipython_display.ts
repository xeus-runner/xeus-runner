// :title: IPython display image

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  parentElement: 'target',
  showCode: true,
  // :worker:
});
const code = `from IPython import display
display.Image(filename='/share/jupyter/kernels/xpython/logo-64x64.png')`;
kernel.execute({ code });
