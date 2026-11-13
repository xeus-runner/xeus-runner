import { XeusKernel } from '@xeus-runner/xeus-runner';

describe('R kernel', () => {
  it.each([false, true])('runs, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'r', worker });
    const code = 'x <- "Hello from R!"\nprint(x)';
    const executeReturn = await kernel.execute({ code });
    kernel.dispose();

    expect(executeReturn.stdout).toBe('[1] "Hello from R!"\n');
    expect(executeReturn.stderr).toBeUndefined();
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });

  it.each([false, true])('writes errors to stderr, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'r', worker });
    const raiseReturn = await kernel.execute({
      code: 'stop("Some error")\nprint("Not reached")',
    });
    const assertReturn = await kernel.execute({
      code: 'stopifnot("Some assert" = 1 == 2)\nprint("Not reached")',
    });
    kernel.dispose();

    expect(raiseReturn.stdout).toBeUndefined();
    expect(raiseReturn.stderr).toMatch(/Some error/);
    expect(assertReturn.stdout).toBeUndefined();
    expect(assertReturn.stderr).toMatch(/Some assert/);
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });
});
