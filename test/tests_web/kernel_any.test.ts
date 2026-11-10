import { expect } from '@playwright/test';
import { coiNavigate, test, workerCoiOptionsAll } from './test_utils';

test.describe('Kernel', () => {
  workerCoiOptionsAll.forEach(({ worker, coi }) => {
    test(`uses worker and coi correctly, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'python', worker });
        await kernel.ready;
        return [kernel.isWorker, crossOriginIsolated];
      }, worker);

      expect(output[0]).toEqual(worker);
      expect(output[1]).toEqual(coi);
    });
  });
});
