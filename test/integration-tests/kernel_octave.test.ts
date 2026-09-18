import { expect } from '@playwright/test';
import { test, testWithCoi, workerCoiOptions } from './test_utils';

test.describe('Octave kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    testWithCoi(`runs, worker: ${worker}, coi: ${coi}`, { coi }, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'octave', worker });
        const code = 'printf("Hello from Octave!")';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from Octave!'); // No terminating \n
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });
  });
});
