import { expect } from '@playwright/test';
import { coiNavigate, test, workerCoiOptions } from './test_utils';

test.describe('R kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    test(`runs, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
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

    test(`supports stdin, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      test.skip(!(worker && coi), 'Only runs in coi-enabled worker');
      await coiNavigate(page, { coi });
      await page.evaluate(async (worker) => {
        const g = globalThis as any;
        const kernel = new g.XeusKernel({ type: 'r', parentElement: 'target', worker });
        // Do not await the cell containing stdin request.
        kernel.execute({ code: 'name <- readline("What is your name?")' });
        g.kernel = kernel;
      }, worker);

      const input = page.locator('div.xr-execute > div.xr-stdin > input').first();
      await input.fill('Alice');
      await input.press('Enter');

      await page.evaluate(async () => {
        await (globalThis as any).kernel.execute({ code: 'name' });
      });

      const stdout = page.locator('div.xr-execute > div.xr-stdout#stdout-1');
      await expect(stdout).toHaveCount(1);
      expect(await stdout.first().textContent()).toMatch(/Alice/);
    });

    test(`creates images, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
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

      await expect(page.locator('#target > #execute-0')).toHaveClass(/\bxr-execute\b/);

      const code = page.locator('#target > #execute-0 > #code-0');
      expect(await code.textContent()).toMatch(/^library\(ggplot2\)/);
      await expect(code).toHaveClass(/\bxr-code\b/);

      const childImages = page.locator('#target > #execute-0 > div.xr-image > *');
      await expect(childImages).toHaveCount(1);
      expect(await childImages.nth(0).getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    });
  });
});
