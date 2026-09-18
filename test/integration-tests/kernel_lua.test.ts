import { expect } from '@playwright/test';
import { testWithCoi, workerCoiOptions } from './test_utils';

testWithCoi.describe('Lua kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    testWithCoi(`runs, worker: ${worker}, coi: ${coi}`, { coi }, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'lua', worker });
        const code = 'print("Hello from Lua!")';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from Lua!\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });
  });
});
