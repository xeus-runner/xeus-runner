import { expect } from '@playwright/test';
import { coiNavigate, test } from './test_utils';

test.describe('version', () => {
  test('is a valid version string', async ({ page }) => {
    await coiNavigate(page, { coi: false });
    const version = await page.evaluate(() => (globalThis as any).version);
    expect(version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  });
});
