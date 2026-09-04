import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Haskell kernel', () => {
  [false].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'haskell', worker });
        const code = 'main :: IO ()\nmain = putStrLn "Hello from Haskell!"\nmain';
        return await kernel.execute(code);
      }, worker);
      expect(output.stdout).toBe('Hello from Haskell!\n');
      expect(output.stderr).toBeUndefined();
    });
  });
});
