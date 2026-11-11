import { expect } from '@playwright/test';
import { coiNavigate, test, workerCoiOptions } from './test_utils';

test.describe('C++ kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    test(`runs, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'cpp',
          worker,
        });
        const code =
          '#include <iostream>\nint i = -23;\nstd::cout << "Hello from C++! " << i << std::endl;';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from C++! -23\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });

    test(`supports stdin, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      test.skip(!(worker && coi), 'Only runs in coi-enabled worker');
      await coiNavigate(page, { coi });
      await page.evaluate(async (worker) => {
        const g = globalThis as any;
        const kernel = new g.XeusKernel({
          type: 'cpp',
          parentElement: 'target',
          worker,
        });
        const code = `#include <iostream>
#include <string>

std::string name;
std::cout << "What is your name?" << std::endl;
std::cin >> name`;
        // Do not await the cell containing stdin request.
        kernel.execute({ code });
        g.kernel = kernel;
      }, worker);

      const input = page.locator('div.xr-execute > div.xr-stdin > input').first();
      await input.fill('Alice');
      await input.press('Enter');

      await page.evaluate(async () => {
        await (globalThis as any).kernel.execute({
          code: 'std::cout << "Name is " << name << std::endl;',
        });
      });

      const stdout = page.locator('div.xr-execute > div.xr-stdout#stdout-1');
      await expect(stdout).toHaveCount(1);
      expect(await stdout.first().textContent()).toBe('Name is Alice\n');
    });
  });
});
