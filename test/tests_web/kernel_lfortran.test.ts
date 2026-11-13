import { expect } from '@playwright/test';
import { coiNavigate, test, workerCoiOptions } from './test_utils';

test.describe('LFortran kernel', () => {
  workerCoiOptions.forEach(({ worker, coi }) => {
    test(`runs, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'fortran', worker });
        const code = `real :: a, b, result
a = 5.7
b = 0.5
result = a + b
print '(A, F6.2)', "Hello from LFortran, the sum is ", result
`;
        const executeReturn = await kernel.execute({ code });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { executeReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.executeReturn.stdout).toBe('Hello from LFortran, the sum is   6.20\n');
      expect(output.executeReturn.stderr).toBeUndefined();
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });

    // TODO: skipped as error stop crashes the kernel in exitRuntime, so execute never returns.
    test.skip(`writes errors to stderr, worker: ${worker}, coi: ${coi}`, async ({ page }) => {
      await coiNavigate(page, { coi });
      const output = await page.evaluate(async (worker) => {
        const kernel = new (globalThis as any).XeusKernel({ type: 'fortran', worker });
        const raiseReturn = await kernel.execute({
          code: 'error stop "Some error"\nprint *, "Not reached"\n',
        });
        kernel.dispose();
        const { isDisposed, isWorker } = kernel;
        return { raiseReturn, isWorker, isDisposed, coi: crossOriginIsolated };
      }, worker);

      expect(output.raiseReturn.stdout).toBeUndefined();
      expect(output.raiseReturn.stderr).toMatch(/Some error/);
      expect(output.isWorker).toEqual(worker);
      expect(output.isDisposed).toBeTruthy();
      expect(output.coi).toEqual(coi);
    });
  });
});
