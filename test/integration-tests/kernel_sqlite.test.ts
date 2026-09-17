import { expect } from '@playwright/test';
import { test, workerCoiOptions } from './test_utils';

test.describe('Sqlite kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    test(`runs, worker: ${worker}, coi: ${coi}`, { coi }, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'sqlite', worker });
        await kernel.execute({ code: '%CREATE mydb.db mydb' });
        const executeReturn = await kernel.execute({ code: 'SELECT sqlite_version()' });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      const lines = output.executeReturn.stdout.split('\n');
      expect(lines).toHaveLength(5);
      expect(lines[1]).toMatch('sqlite_version()');
      expect(lines[3]).toMatch(/\s+\d+\.\d+\.\d+\s+/);

      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });
  });
});
