// :title: Datashader and Numba

import { DOMMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['datashader', 'pillow'],
  channels: ['standard-4x'], // Until numba for 6x is available
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});
kernel.execute({
  code: `from colorcet import bgy
import datashader as ds
import datashader.transfer_functions as tf
import pandas as pd
import numpy as np

n = 10000
rng = np.random.default_rng(9842)
image_size = 400

dists = {cat: pd.DataFrame(dict([('x', np.random.normal(x, s, n)),
                                 ('y', np.random.normal(y, s, n)),
                                 ('val', val),
                                 ('cat', cat)]))
         for x,  y,  s,  val, cat in
         [(  2,  2, 0.03, 10, "d1"),
          (  2, -2, 0.10, 20, "d2"),
          ( -2, -2, 0.50, 30, "d3"),
          ( -2,  2, 1.00, 40, "d4"),
          (  0,  0, 3.00, 50, "d5")] }

df = pd.concat(dists, ignore_index=True)
df["cat"] = df["cat"].astype("category")
cvs = ds.Canvas(plot_width=image_size, plot_height=image_size)
tf.shade(cvs.points(df, 'x', 'y'), cmap=bgy)
`,
});
