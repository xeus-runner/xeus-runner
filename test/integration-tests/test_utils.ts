import type { Page, TestInfo } from '@playwright/test';
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

const coiByTitle = new Map<string, boolean>();

const testBase = base.extend({
  page: async ({ page }, use, testInfo) => {
    const coi = coiByTitle.get(testInfo.title) ?? false;
    await page.goto(`http://localhost:${coi ? 4501 : 4500}/`);
    await use(page);
  },
});

type TestCallback = (args: { page: Page }, testInfo: TestInfo) => Promise<void> | void;

function testProxy(name: string, fn: TestCallback): void;
function testProxy(name: string, opts: { coi?: boolean }, fn: TestCallback): void;
function testProxy(...args: any[]) {
  if (args.length > 1 && typeof args[1] === 'object' && args[1] !== null) {
    coiByTitle.set(args[0], args[1].coi ?? false);
    return (testBase as any)(args[0], ...args.slice(2));
  }
  return (testBase as any)(...args);
}

type TestWithCoi = typeof testBase &
  ((name: string, opts: { coi?: boolean }, fn: TestCallback) => void);

export const test = new Proxy(testProxy, {
  get(_, prop) {
    return (testBase as any)[prop];
  },
}) as TestWithCoi;
