import { XeusKernel } from 'xeus-runner';

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
});
