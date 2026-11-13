import { XeusKernel } from '@xeus-runner/xeus-runner';

describe('Octave kernel', () => {
  it.each([false, true])('runs, worker: %s', async (worker) => {
    const kernel = new XeusKernel({
      type: 'octave',
      worker,
    });
    const code = 'printf("Hello from Octave!")';
    const executeReturn = await kernel.execute({ code });
    kernel.dispose();

    expect(executeReturn.stdout).toBe('Hello from Octave!'); // No terminating \n
    expect(executeReturn.stderr).toBeUndefined();
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });

  it.each([false, true])('writes errors to stderr, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'octave', worker });
    const raiseReturn = await kernel.execute({
      code: 'error("Some error")\nprintf("Not reached")',
    });
    const assertReturn = await kernel.execute({
      code: 'assert(1 == 2, "Some assert")\nprintf("Not reached")',
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
