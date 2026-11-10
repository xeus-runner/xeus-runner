// :title: Matplotlib plot as PNG

import { XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['matplotlib'],
  parentElement: 'target',
  showCode: true,
  // :worker:
});

kernel.execute({
  code: `import matplotlib as mpl
print(f"Matplotlib backend: {mpl.get_backend()}")`,
});

const code = `import matplotlib.pyplot as plt
fig, ax = plt.subplots()
cs = ax.contourf([[1, 2], [3, 4]])
fig.colorbar(cs, ax=ax)
ax.set_title('Matplotlib contour plot as PNG image');`;
kernel.execute({ code });
