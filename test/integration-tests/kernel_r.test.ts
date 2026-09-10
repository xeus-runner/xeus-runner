import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('R kernel', () => {
  [false, true].forEach(async (worker) => {
    test(`runs, worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'r', worker });
        const code = 'x <- "Hello from R!"\nprint(x)';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed };
      }, worker);

      expect(output.executeReturn.stdout).toBe('[1] "Hello from R!"\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
    });

    test(`creates images, worker: ${worker}`, async ({ page }) => {
      await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'r',
          packages: ['r-ggplot2'],
          parentElement: 'target',
          showCode: true,
          worker,
        });
        await kernel.execute({
          code: `library(ggplot2)
data <- data.frame(
  x = 1:10,
  y = (1:10)^2
)
ggplot(data, aes(x = x, y = y)) +
  geom_point(color = "blue", size = 3) +
  labs(title = "Example ggplot2 plot") +
  theme_minimal()`,
        });
      }, worker);

      expect(page.locator('#target > #execute-0')).toHaveAttribute('class', 'xr-execute');

      const code = page.locator('#target > #execute-0 > #code-0');
      expect(await code.textContent()).toMatch(/^library\(ggplot2\)/);
      expect(code).toHaveAttribute('class', 'xr-code');

      const childImages = page.locator('#target > #execute-0 > div.xr-image > *');
      expect(childImages).toHaveCount(1);
      expect(await childImages.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });
  });
});
