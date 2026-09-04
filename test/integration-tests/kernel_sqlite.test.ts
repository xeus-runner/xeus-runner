import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Sqlite kernel', () => {
  [false, true].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'sqlite', worker });
        await kernel.execute('%CREATE mydb.db mydb');
        const executeReturn = await kernel.execute('SELECT sqlite_version()');
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed };
      }, worker);

      const lines = output.executeReturn.stdout.split('\n');
      expect(lines).toHaveLength(5);
      expect(lines[1]).toMatch('sqlite_version()');
      expect(lines[3]).toMatch(/\s+\d+\.\d+\.\d+\s+/);

      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
    });
  });
});
