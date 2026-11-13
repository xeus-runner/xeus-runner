import { XeusKernel } from '@xeus-runner/xeus-runner';

describe('Lua kernel', () => {
  it.each([false, true])('runs, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'lua', worker });
    const code = 'print("Hello from Lua!")';
    const executeReturn = await kernel.execute({ code });
    kernel.dispose();

    expect(executeReturn.stdout).toBe('Hello from Lua!\n');
    expect(executeReturn.stderr).toBeUndefined();
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });

  it.each([false, true])('writes errors to stderr, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'lua', worker });
    const raiseReturn = await kernel.execute({
      code: 'error("Some error")\nprint("Not reached")',
    });
    const assertReturn = await kernel.execute({
      code: 'assert(1 == 2, "Some assert")\nprint("Not reached")',
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
