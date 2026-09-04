import { expect } from '@playwright/test';
import { test } from './test_utils';

test.describe('Sqlite kernel', () => {
  [false].forEach(async (worker) => {
    test(`worker: ${worker}`, async ({ page }) => {
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'sqlite', worker });
        await kernel.execute('%CREATE mydb.db mydb');
        return await kernel.execute('SELECT sqlite_version()');
      }, worker);
      const lines = output.stdout.split('\n');
      expect(lines).toHaveLength(5);
      expect(lines[1]).toMatch('sqlite_version()');
      expect(lines[3]).toMatch(/\s+\d+\.\d+\.\d+\s+/);

      expect(output.stderr).toBeUndefined();
    });
  });
});
