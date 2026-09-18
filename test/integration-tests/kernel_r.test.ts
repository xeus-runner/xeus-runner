import { expect } from '@playwright/test';
import { testWithCoi, workerCoiOptions } from './test_utils';

testWithCoi.describe('R kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    testWithCoi(`runs, worker: ${worker}, coi: ${coi}`, { coi }, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'r', worker });
        const code = 'x <- "Hello from R!"\nprint(x)';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe('[1] "Hello from R!"\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });

    testWithCoi(`creates images, worker: ${worker}, coi: ${coi}`, { coi }, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
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
        return [kernel.isWorker, crossOriginIsolated];
      }, worker);

      expect(output[0]).toEqual(worker);
      expect(output[1]).toEqual(coi);

      expect(page.locator('#target > #execute-0')).toHaveClass(/\bxr-execute\b/);

      const code = page.locator('#target > #execute-0 > #code-0');
      expect(await code.textContent()).toMatch(/^library\(ggplot2\)/);
      expect(code).toHaveClass(/\bxr-code\b/);

      const childImages = page.locator('#target > #execute-0 > div.xr-image > *');
      expect(childImages).toHaveCount(1);
      expect(await childImages.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });
  });
});
