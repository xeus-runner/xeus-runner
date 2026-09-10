import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Haskell kernel', () => {
  [false, true].forEach(async (worker) => {
    test(`runs, worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'haskell', worker });
        const code = 'main :: IO ()\nmain = putStrLn "Hello from Haskell!"\nmain';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from Haskell!\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
    });
  });
});
