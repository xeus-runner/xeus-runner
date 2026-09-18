import { expect } from '@playwright/test';
import { testWithCoi, workerCoiOptions } from './test_utils';

testWithCoi.describe('LFortran kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    testWithCoi(`runs, worker: ${worker}, coi: ${coi}`, { coi }, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'fortran', worker });
        const code = `real :: a, b, result
a = 5.7
b = 0.5
result = a + b
print '(A, F6.2)', "Hello from LFortran, the sum is ", result
`;
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from LFortran, the sum is   6.20\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });
  });
});
