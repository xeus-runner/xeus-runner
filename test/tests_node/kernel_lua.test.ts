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
});
