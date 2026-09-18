import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

/**
 * Worker+coi (cross origin isolation) options used for most tests.
 * If worker is false we usually don't care about coi so only test without it.
 */
export const workerCoiOptions = [
  { worker: false, coi: false },
  { worker: true, coi: false },
  { worker: true, coi: true },
];

/**
 * Full set of worker+coi options.
 */
export const workerCoiOptionsAll = [
  { worker: false, coi: false },
  { worker: false, coi: true },
  { worker: true, coi: false },
  { worker: true, coi: true },
];

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
  },
});

export async function coiNavigate(page: Page, opts: { coi?: boolean }): Promise<void> {
  await page.goto(`http://localhost:${opts.coi ? 4501 : 4500}/`);
}
