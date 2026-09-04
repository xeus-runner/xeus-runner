import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Lua kernel', () => {
  [false, true].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'lua', worker });
        const code = 'print("Hello from Lua!")';
        const executeReturn = await kernel.execute(code);
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from Lua!\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
    });
  });
});
