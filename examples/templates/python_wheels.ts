// :title: Using pyemscripten wheels from PyPI

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  pipPackages: ['contourpy'],
  parentElement: 'target',
  showCode: true,
  // :worker:
});

kernel.execute({
  code: `import contourpy

contourpy.__version__`,
});

kernel.execute({
  code: `cg = contourpy.contour_generator(z=[[1,2],[3,4]])
cg.filled(2.5, 3.5)`,
});
