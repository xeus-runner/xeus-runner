import { test as base } from '@playwright/test';

// Override page fixture to navigate to specific page.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/');
    await use(page);
  },
});
