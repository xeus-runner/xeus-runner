import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('C++ kernel', () => {
  [false, true].forEach(async (worker) => {
    test(`runs, worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'cpp', worker });
        const code =
          '#include <iostream>\nint i = -23;\nstd::cout << "Hello from C++! " << i << std::endl;';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from C++! -23\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
    });
  });
});
