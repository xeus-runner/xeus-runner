import { expect } from '@playwright/test';
import { crossOriginNavigate, test } from './test_utils';

const options = [
  { pageOrigin: 'http', worker: false, coi: false, origin: 'http://localhost:4500' },
  { pageOrigin: 'http', worker: true, coi: false, origin: 'http://localhost:4500' },
  { pageOrigin: 'coi', worker: false, coi: true, origin: 'http://127.0.0.1:4501' },
  { pageOrigin: 'coi', worker: true, coi: true, origin: 'http://127.0.0.1:4501' },
  { pageOrigin: 'file', worker: false, coi: false, origin: 'null' },
  { pageOrigin: 'file', worker: true, coi: false, origin: 'null' },
] as const;

test.describe('Cross-origin import', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Only runs in chromium');

  options.forEach(({ pageOrigin, worker, coi, origin }) => {
    test(`runs, pageOrigin: ${pageOrigin}, worker: ${worker}`, async ({ page }) => {
      await crossOriginNavigate(page, { pageOrigin });
      const output = await page.evaluate(async (worker) => {
        const g = globalThis as any;
        const kernel = new g.XeusKernel({
          type: 'python',
          messageHandler: new g.DOMMessageHandler({ targetElement: 'target' }),
          worker,
        });
        await kernel.execute({ code: 'print("Hello from Python!")' });
        return { isWorker: kernel.isWorker, coi: crossOriginIsolated, origin: g.origin };
      }, worker);

      expect(output.isWorker).toEqual(worker);
      expect(output.coi).toEqual(coi);
      expect(output.origin).toEqual(origin);

      const stdout = page.locator('div.xr-execute > div.xr-stdout#stdout-0');
      await expect(stdout).toHaveCount(1);
      expect(await stdout.first().textContent()).toBe('Hello from Python!\n');
    });
  });

  test('supports stdin, pageOrigin: coi, worker: true', async ({ page }) => {
    await crossOriginNavigate(page, { pageOrigin: 'coi' });
    await page.evaluate(async () => {
      const g = globalThis as any;
      const kernel = new g.XeusKernel({
        type: 'python',
        messageHandler: new g.DOMMessageHandler({ targetElement: 'target' }),
        worker: true,
      });
      // Do not await the cell containing stdin request.
      kernel.execute({ code: 'name = input("What is your name?")' });
      g.kernel = kernel;
    });

    const input = page.locator('div.xr-execute > div.xr-stdin > input').first();
    await input.fill('Alice');
    await input.press('Enter');

    await page.evaluate(async () => {
      await (globalThis as any).kernel.execute({ code: 'print(f"Name is {name}")' });
    });

    const stdout = page.locator('div.xr-execute > div.xr-stdout#stdout-1');
    await expect(stdout).toHaveCount(1);
    expect(await stdout.first().textContent()).toBe('Name is Alice\n');
  });
});
