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
});
