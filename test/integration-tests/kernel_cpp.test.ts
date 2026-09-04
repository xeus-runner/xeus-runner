import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('C++ kernel', () => {
  [false].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'cpp', worker });
        const code =
          '#include <iostream>\nint i = -23;\nstd::cout << "Hello from C++! " << i << std::endl;';
        return await kernel.execute(code);
      }, worker);
      expect(output.stdout).toBe('Hello from C++! -23\n');
      expect(output.stderr).toBeUndefined();
    });
  });
});
