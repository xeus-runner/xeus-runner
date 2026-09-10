import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Python kernel', () => {
  [false, true].forEach(async (worker) => {
    test(`runs, worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'python', worker });
        const code = 'a = -47; print("Hello from Python!", a)';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from Python! -47\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
    });

    test(`creates images, worker: ${worker}`, async ({ page }) => {
      await page.evaluate(async (worker) => {
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
      }, worker);

      // First execute.
      await page.waitForTimeout(2000);
      //expect(page.locator('#target > #execute-0')).toHaveAttribute('class', 'xr-execute');

      const code0 = page.locator('#target > #execute-0 > #code-0');
      expect(await code0.textContent()).toMatch(/^import matplotlib\.pyplot as plt/);
      expect(code0).toHaveAttribute('class', 'xr-code');

      // Matplotlib image.
      const childImages0 = page.locator('#target > #execute-0 > div.xr-image > *');
      expect(childImages0).toHaveCount(1);
      expect(await childImages0.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);

      // Second execute.
      expect(page.locator('#target > #execute-1')).toHaveAttribute('class', 'xr-execute');

      const code1 = page.locator('#target > #execute-1 > #code-1');
      expect(await code1.textContent()).toMatch(/^from IPython import display/);
      expect(code1).toHaveAttribute('class', 'xr-code');

      // IPython image.
      const childImages1 = page.locator('#target > #execute-1 > div.xr-image > *');
      expect(childImages1).toHaveCount(1);
      expect(await childImages1.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });

    test(`creates html and javascript, worker: ${worker}`, async ({ page }) => {
      await page.evaluate(async (worker) => {
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
      }, worker);

      // Wait for plot to be added to DOM.
      await page.locator('#target > #execute-1 > div.xr-html > *').waitFor();

      // First execute.
      expect(page.locator('#target > #execute-0')).toHaveAttribute('class', 'xr-execute');

      const code0 = page.locator('#target > #execute-0 > #code-0');
      expect(await code0.textContent()).toMatch(/^from bokeh.io import output_notebook/);
      expect(code0).toHaveAttribute('class', 'xr-code');

      // Bokeh logo image and text.
      const logo = page.locator('#target > #execute-0 > div.xr-html > div');
      expect(logo.locator('> a.bk-notebook-logo')).toHaveAttribute('href', 'https://bokeh.org');
      expect(logo.locator('> span')).toHaveText(/^BokehJS .* successfully loaded.$/);

      // Second execute.
      expect(page.locator('#target > #execute-1')).toHaveAttribute('class', 'xr-execute');

      const code1 = page.locator('#target > #execute-1 > #code-1');
      expect(await code1.textContent()).toMatch(/^from bokeh.layouts import layout/);
      expect(code1).toHaveAttribute('class', 'xr-code');

      // Bokeh plot.
      const children = page.locator('#target > #execute-1 > div.xr-html > *');
      expect(children).toHaveCount(1);
      expect(children.nth(0)).toHaveAttribute('data-root-id');
    });
  });
});
