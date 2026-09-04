import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Octave kernel', () => {
  [false].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'octave', worker });
        const code = 'printf("Hello from Octave!")';
        return await kernel.execute(code);
      }, worker);
      expect(output.stdout).toBe('Hello from Octave!'); // No terminating \n
      expect(output.stderr).toBeUndefined();
    });
  });
});
