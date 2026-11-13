import { expect } from '@playwright/test';
import { coiNavigate, test, workerCoiOptions } from './test_utils';

test.describe('Octave kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    test(`runs, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({
          type: 'octave',
          worker,
        });
        const code = 'printf("Hello from Octave!")';
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from Octave!'); // No terminating \n
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });

    test(`writes errors to stderr, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'octave', worker });
        const raiseReturn = await kernel.execute({
          code: 'error("Some error")\nprintf("Not reached")',
        });
        const assertReturn = await kernel.execute({
          code: 'assert(1 == 2, "Some assert")\nprintf("Not reached")',
        });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { raiseReturn, assertReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.raiseReturn.stdout).toBeUndefined();
      expect(output.raiseReturn.stderr).toMatch(/Some error/);
      expect(output.assertReturn.stdout).toBeUndefined();
      expect(output.assertReturn.stderr).toMatch(/Some assert/);
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });
  });
});
