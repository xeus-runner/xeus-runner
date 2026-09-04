import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Python kernel', () => {
  [false].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'python', worker });
        const code = 'a = -47; print("Hello from Python!", a)';
        return await kernel.execute(code);
      }, worker);
      expect(output.stdout).toBe('Hello from Python! -47\n');
      expect(output.stderr).toBeUndefined();
    });
  });
});
