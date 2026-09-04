import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Lua kernel', () => {
  [false].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'lua', worker });
        const code = 'print("Hello from Lua!")';
        return await kernel.execute(code);
      }, worker);
      expect(output.stdout).toBe('Hello from Lua!\n');
      expect(output.stderr).toBeUndefined();
    });
  });
});
