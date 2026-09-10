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
      expect(page.locator('#target > #execute-0')).toHaveAttribute('class', 'xr-execute');

      const code0 = page.locator('#target > #execute-0 > #code-0');
      expect(await code0.textContent()).toMatch(/^import matplotlib\.pyplot as plt/);
      expect(code0).toHaveAttribute('class', 'xr-code');

      // Matplotlib image.
      const childImages0 = page.locator('#target #execute-0 div.xr-image').locator('> *');
      expect(childImages0).toHaveCount(1);
      expect(await childImages0.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);

      // Second execute.
      expect(page.locator('#target > #execute-1')).toHaveAttribute('class', 'xr-execute');

      const code1 = page.locator('#target > #execute-1 > #code-1');
      expect(await code1.textContent()).toMatch(/^from IPython import display/);
      expect(code1).toHaveAttribute('class', 'xr-code');

      // IPython image.
      const childImages1 = page.locator('#target #execute-1 div.xr-image').locator('> *');
      expect(childImages1).toHaveCount(1);
      expect(await childImages1.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });
  });
});
