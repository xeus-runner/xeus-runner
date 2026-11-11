import { XeusKernel } from 'xeus-runner';

describe('C++ kernel', () => {
  it.each([false, true])('runs, worker: %s', async (worker) => {
    const kernel = new XeusKernel({
      type: 'cpp',
      worker,
    });
    const code =
      '#include <iostream>\nint i = -23;\nstd::cout << "Hello from C++! " << i << std::endl;';
    const executeReturn = await kernel.execute({ code });
    kernel.dispose();

    expect(executeReturn.stdout).toBe('Hello from C++! -23\n');
    expect(executeReturn.stderr).toBeUndefined();
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });
});
