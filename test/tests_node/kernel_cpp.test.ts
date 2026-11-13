import { XeusKernel } from '@xeus-runner/xeus-runner';

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

  it.each([false, true])('writes errors to stderr, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'cpp', worker });
    const raiseReturn = await kernel.execute({
      code: '#include <iostream>\n#include <stdexcept>\nthrow std::runtime_error("Some error");\nstd::cout << "Not reached" << std::endl;',
    });
    const assertReturn = await kernel.execute({
      code: '#include <cassert>\nassert(1 == 2 && "Some assert");\nstd::cout << "Not reached" << std::endl;',
    });
    kernel.dispose();

    // TODO: we should see the correct exception/assertion message.
    expect(raiseReturn.stdout).toBeUndefined();
    expect(raiseReturn.stderr).toMatch(/WebAssembly\.Exception/);
    expect(assertReturn.stdout).toBeUndefined();
    expect(assertReturn.stderr).toMatch(/RuntimeError: unreachable/);
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });
});
