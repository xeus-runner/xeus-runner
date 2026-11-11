import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { fetchWithCache, packageUrlRegex } from '../pkg_cache.ts';

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
    await page.context().route(packageUrlRegex, async (route) => {
      const body = await fetchWithCache(route.request().url(), async () => {
        const response = await route.fetch();
        if (!response.ok()) throw new Error(`HTTP error! status: ${response.status()}`);
        return response.body();
      });
      await route.fulfill({
        body: Buffer.from(body),
        headers: {
          'access-control-allow-origin': '*',
          'cross-origin-resource-policy': 'cross-origin',
        },
      });
    });
    await use(page);
  },
});

export async function coiNavigate(page: Page, opts: { coi?: boolean }): Promise<void> {
  await page.goto(`http://localhost:${opts.coi ? 4501 : 4500}/`);
}

/**
 * Navigate to a page that is a different origin to http://localhost:4501 and import the test
 * bundle from there, so that the xeus-runner code is cross-origin to the page.
 * pageOrigin is 'http' (not cross-origin isolated), 'coi' (cross-origin isolated) or 'file'
 * (opaque origin).
 */
export async function crossOriginNavigate(
  page: Page,
  opts: { pageOrigin: 'http' | 'coi' | 'file' },
): Promise<void> {
  const urls = {
    http: 'http://localhost:4500/cross_origin.html',
    coi: 'http://127.0.0.1:4501/cross_origin.html',
    file: new URL('../dist_web/cross_origin.html', import.meta.url).href,
  };
  await page.goto(urls[opts.pageOrigin]);
  await page.evaluate(async (url) => {
    await import(url);
  }, 'http://localhost:4501/index.js');
}
