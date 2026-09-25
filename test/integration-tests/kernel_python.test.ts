import { expect } from '@playwright/test';
import { coiNavigate, test, workerCoiOptions } from './test_utils';

test.describe('Python kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    test(`runs, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'python', worker });
        const code = 'a = -47; print("Hello from Python!", a)';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from Python! -47\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });

    test(`supports different channel and platforms, worker: ${worker}, coi: ${coi}`, async ({
      page,
    }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'python',
          packages: ['contourpy'],
          channels: [
            'https://prefix.dev/emscripten-forge-bot/emscripten-forge-6x',
            'https://repo.prefix.dev/conda-forge',
          ],
          platform: 'emscripten-wasm64',
          worker,
        });
        const code0 = `from contourpy import contour_generator
cg = contour_generator(z=[[1,2],[3,4]])
cg.lines(2.5)`;
        const executeReturn0 = await kernel.execute({ code: code0 });
        const code1 = `import platform as p
print(p.system(), p.machine(), p.release())`;
        const executeReturn1 = await kernel.execute({ code: code1 });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn0, executeReturn1, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn0.stdout).toBe(`[array([[0.  , 0.75],
        [1.  , 0.25]])]`);
      expect(output.executeReturn0.stderr).toBeUndefined();
      expect(output.executeReturn1.stdout).toBe('Emscripten wasm64 6.0.8\n');
      expect(output.executeReturn1.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });

    test(`supports pyemscripten wheels from PyPI, worker: ${worker}, coi: ${coi}`, async ({
      page,
    }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'python',
          packages: ['numpy'],
          pipPackages: ['contourpy'],
          worker,
        });
        const code = `from contourpy import contour_generator

cg = contour_generator(z=[[1,2],[3,4]])
cg.filled(2.5, 3.5)`;
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe(`([array([[0.  , 1.  ],
         [0.  , 0.75],
         [1.  , 0.25],
         [1.  , 0.75],
         [0.5 , 1.  ],
         [0.  , 1.  ]])],
 [array([0, 6], dtype=uint32)])`);
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });

    test(`supports Matplotlib and IPython.display images, worker: ${worker}, coi: ${coi}`, async ({
      page,
    }) => {
      await coiNavigate(page, { coi });
      // Create PNG image MIME type.
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'python',
          packages: ['matplotlib<3.11'],
          parentElement: 'target',
          showCode: true,
          worker,
        });
        await kernel.execute({
          code: `import matplotlib.pyplot as plt
fig, ax = plt.subplots()
cs = ax.contourf([[1, 2], [3, 4]])
fig.colorbar(cs, ax=ax);`,
        });
        await kernel.execute({
          code: `from IPython import display
display.Image(filename='/share/jupyter/kernels/xpython/logo-64x64.png')`,
        });
        return [kernel.isWorker, crossOriginIsolated];
      }, worker);

      expect(output[0]).toEqual(worker);
      expect(output[1]).toEqual(coi);

      // First execute.
      expect(page.locator('#target > #execute-0')).toHaveClass(/\bxr-execute\b/);

      const code0 = page.locator('#target > #execute-0 > #code-0');
      expect(await code0.textContent()).toMatch(/^import matplotlib\.pyplot as plt/);
      expect(code0).toHaveClass(/\bxr-code\b/);

      // Matplotlib image.
      const childImages0 = page.locator('#target > #execute-0 > div.xr-image > *');
      expect(childImages0).toHaveCount(1);
      expect(await childImages0.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);

      // Second execute.
      expect(page.locator('#target > #execute-1')).toHaveClass(/\bxr-execute\b/);

      const code1 = page.locator('#target > #execute-1 > #code-1');
      expect(await code1.textContent()).toMatch(/^from IPython import display/);
      expect(code1).toHaveClass(/\bxr-code\b/);

      // IPython image.
      const childImages1 = page.locator('#target > #execute-1 > div.xr-image > *');
      expect(childImages1).toHaveCount(1);
      expect(await childImages1.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });

    test(`supports Bokeh plot, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      // Outputs html and javascript MIME types.
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'python',
          packages: ['bokeh'],
          parentElement: 'target',
          showCode: true,
          worker,
        });

        await kernel.execute({
          code: `from bokeh.io import output_notebook
output_notebook()`,
        });

        // Wait for BokehJS, this should not be necessary.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await kernel.execute({
          code: `from bokeh.layouts import layout
from bokeh.models import Div, RangeSlider, Spinner
from bokeh.plotting import figure, show

x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
y = [4, 5, 5, 7, 2, 6, 4, 9, 1, 3]

p = figure(x_range=(1, 9), height=250, sizing_mode="stretch_width")
points = p.scatter(x=x, y=y, size=30, fill_color="#21a7df")

div = Div(text="<p>Select the circle's size using this control element:</p>", width=200, height=30)

spinner = Spinner(title="Circle size", low=0, high=60, step=5, value=points.glyph.size, width=200)
spinner.js_link("value", points.glyph, "size")

range_slider = RangeSlider(title="Adjust x-axis range", start=0, end=10, step=1, value=(p.x_range.start, p.x_range.end))
range_slider.js_link("value", p.x_range, "start", attr_selector=0)
range_slider.js_link("value", p.x_range, "end", attr_selector=1)

layout = layout([[div, spinner], [range_slider], [p]], sizing_mode="stretch_width")
show(layout)
`,
        });
        return [kernel.isWorker, crossOriginIsolated];
      }, worker);

      expect(output[0]).toEqual(worker);
      expect(output[1]).toEqual(coi);

      // Wait for plot to be added to DOM.
      await page.locator('#target > #execute-1 > div.xr-html > *').waitFor();

      // First execute.
      expect(page.locator('#target > #execute-0')).toHaveClass(/\bxr-execute\b/);

      const code0 = page.locator('#target > #execute-0 > #code-0');
      expect(await code0.textContent()).toMatch(/^from bokeh.io import output_notebook/);
      expect(code0).toHaveClass(/\bxr-code\b/);

      // Bokeh logo image and text.
      const logo = page.locator('#target > #execute-0 > div.xr-html > div');
      expect(logo.locator('> a.bk-notebook-logo')).toHaveAttribute('href', 'https://bokeh.org');
      expect(logo.locator('> span')).toHaveText(/^BokehJS .* successfully loaded.$/);

      // Second execute.
      expect(page.locator('#target > #execute-1')).toHaveClass(/\bxr-execute\b/);

      const code1 = page.locator('#target > #execute-1 > #code-1');
      expect(await code1.textContent()).toMatch(/^from bokeh.layouts import layout/);
      expect(code1).toHaveClass(/\bxr-code\b/);

      // Bokeh plot.
      const children = page.locator('#target > #execute-1 > div.xr-html > *');
      expect(children).toHaveCount(1);
      expect(children.nth(0)).toHaveAttribute('data-root-id');
    });

    test(`supports async tasks, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      // Outputting to DOM as asyncio tasks continue after code cell has 'completed'.
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'python',
          parentElement: 'target',
          showCode: true,
          worker,
        });

        kernel.execute({
          code: `import asyncio

async def recv_send(event1, event2):
    print('1) waiting for event1')
    await event1.wait()
    print('2) received event1')
    await asyncio.sleep(0.5)
    event2.set()
    print('3) set event2, finished')

event1 = asyncio.Event()
event2 = asyncio.Event()
waiter_task = asyncio.create_task(recv_send(event1, event2))`,
        });

        kernel.execute({
          code: `async def send_recv(event1, event2):
    print('a) waiting at start')
    await asyncio.sleep(0.5)
    event1.set()
    print('b) set event1, waiting for event2')
    await event2.wait()
    print('c) finished')

sender_task = asyncio.create_task(send_recv(event1, event2))`,
        });

        await kernel.execute({
          code: `print(event1.is_set(), event2.is_set())
await asyncio.gather(waiter_task, sender_task)
print(event1.is_set(), event2.is_set())`,
        });
        return [kernel.isWorker, crossOriginIsolated];
      }, worker);

      expect(output[0]).toEqual(worker);
      expect(output[1]).toEqual(coi);

      // Code.
      expect(page.locator('#target > #execute-0')).toHaveClass(/\bxr-execute\b/);
      const code0 = page.locator('#target > #execute-0 > #code-0');
      expect(await code0.textContent()).toMatch(/^import asyncio/);
      expect(code0).toHaveClass(/\bxr-code\b/);

      expect(page.locator('#target > #execute-1')).toHaveClass(/\bxr-execute\b/);
      const code1 = page.locator('#target > #execute-1 > #code-1');
      expect(await code1.textContent()).toMatch(/^async def send_recv/);
      expect(code1).toHaveClass(/\bxr-code\b/);

      expect(page.locator('#target > #execute-2')).toHaveClass(/\bxr-execute\b/);
      const code2 = page.locator('#target > #execute-2 > #code-2');
      expect(await code2.textContent()).toMatch(/^print\(event1.is_set/);
      expect(code2).toHaveClass(/\bxr-code\b/);

      // Stdout.
      const stdout0 = page.locator('#target > #execute-0 > div.xr-stdout');
      expect(stdout0).toHaveText(
        '1) waiting for event1\n2) received event1\n3) set event2, finished',
      );

      const stdout1 = page.locator('#target > #execute-1 > div.xr-stdout');
      expect(stdout1).toHaveText(
        'a) waiting at start\nb) set event1, waiting for event2\nc) finished',
      );

      const stdout2 = page.locator('#target > #execute-2 > div.xr-stdout');
      expect(stdout2).toHaveText('False False\nTrue True');
    });

    test(`supports Datashader and Numba, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      test.skip(worker && coi, 'Need pyjs fix for to_js with dict_converter');

      await coiNavigate(page, { coi });
      // Output html MIME type containing image.
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'python',
          packages: ['datashader', 'pillow'],
          parentElement: 'target',
          showCode: true,
          worker,
        });
        await kernel.execute({
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
        return [kernel.isWorker, crossOriginIsolated];
      }, worker);

      expect(output[0]).toEqual(worker);
      expect(output[1]).toEqual(coi);

      expect(page.locator('#target > #execute-0')).toHaveClass(/\bxr-execute\b/);

      const code = page.locator('#target > #execute-0 > #code-0');
      expect(await code.textContent()).toMatch(/^from colorcet import bgy/);
      expect(code).toHaveClass(/\bxr-code\b/);

      // Output html containing image.
      const children = page.locator('#target > #execute-0 > div.xr-html > *');
      expect(children).toHaveCount(1);
      expect(await children.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });

    test(`supports pyjs modifying DOM, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      test.skip(worker && !coi, 'Skip if worker without coi');

      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'python',
          packages: ['pyjs'],
          parentElement: 'target',
          showCode: true,
          worker,
        });
        await kernel.execute({
          code: `from pyjs.js import window

document = window.document

div = document.createElement("div")
div.textContent = "This <div> is created by Python code using pyjs from {{ workerName }}"
div.setAttribute("style", "color: yellow; background-color: indigo; padding: 1em; font-size: 2em")
div.classList = "pyjs"

document.getElementById("target").append(div)`,
        });
        return { isWorker: kernel.isWorker, coi: crossOriginIsolated };
      }, worker);

      expect(output.isWorker).toEqual(worker);
      expect(output.coi).toEqual(coi);

      expect(page.locator('#target > #execute-0')).toHaveClass(/\bxr-execute\b/);

      const code = page.locator('#target > #execute-0 > #code-0');
      expect(await code.textContent()).toMatch(/^from pyjs.js import window/);
      expect(code).toHaveClass(/\bxr-code\b/);

      const children = page.locator('#target > div.pyjs');
      expect(children).toHaveCount(1);
      const child = children.nth(0);
      expect(await child.textContent()).toMatch(/^This <div> is created by Python code using pyjs/);
      expect(child).toHaveAttribute('style');
    });
  });
});
