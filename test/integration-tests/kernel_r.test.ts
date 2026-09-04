import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('R kernel', () => {
  [false].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'r', worker });
        return await kernel.execute('x <- "Hello from R!"\nprint(x)');
      }, worker);
      expect(output.stdout).toBe('[1] "Hello from R!"\n');
      expect(output.stderr).toBeUndefined();
    });
  });
});
