import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('LFortran kernel', () => {
  [false].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'fortran', worker });
        const code = `real :: a, b, result
a = 5.7
b = 0.5
result = a + b
print '(A, F6.2)', "Hello from LFortran, the sum is ", result
`;
        return await kernel.execute(code);
      }, worker);
      expect(output.stdout).toBe('Hello from LFortran, the sum is   6.20\n');
      expect(output.stderr).toBeUndefined();
    });
  });
});
