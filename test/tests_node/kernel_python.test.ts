import { jest } from '@jest/globals';
import { StreamMessageHandler, XeusKernel } from '@xeus-runner/xeus-runner';

describe('Python kernel', () => {
  it.each([false, true])('runs, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'python', worker });
    const code = 'a = -47; print("Hello from Python!", a)';
    const executeReturn = await kernel.execute({ code });
    kernel.dispose();

    expect(executeReturn.stdout).toBe('Hello from Python! -47\n');
    expect(executeReturn.stderr).toBeUndefined();
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });

  it.each([false, true])('writes errors to stderr, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'python', worker });
    const raiseReturn = await kernel.execute({
      code: 'raise RuntimeError("Some error")\nprint("Not reached")',
    });
    const assertReturn = await kernel.execute({
      code: 'assert 1 == 2, "Some assert"\nprint("Not reached")',
    });
    kernel.dispose();

    expect(raiseReturn.stdout).toBeUndefined();
    expect(raiseReturn.stderr).toMatch(/RuntimeError: Some error/);
    expect(assertReturn.stdout).toBeUndefined();
    expect(assertReturn.stderr).toMatch(/AssertionError: Some assert/);
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });

  it.each([false, true])('runs with StreamMessageHandler, worker: %s', async (worker) => {
    const kernel = new XeusKernel({
      type: 'python',
      worker,
      messageHandler: new StreamMessageHandler(),
    });
    // Wait for kernel to start before mocking stdout/stderr, as xeus-python writes some
    // unconditional debug output to console.log during initialisation. If using a worker this
    // output is piped to the main thread asynchronously so may still arrive after the mocking
    // starts, hence only the end of stdout/stderr is checked below.
    await kernel.ready;

    let stdout = '';
    let stderr = '';
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation((text) => {
      stdout += text;
      return true;
    });
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation((text) => {
      stderr += text;
      return true;
    });

    const code = 'import sys; print("Hello from Python!"); print("Error", file=sys.stderr)';
    const executeReturn = await kernel.execute({ code });
    kernel.dispose();

    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();

    expect(executeReturn).toEqual({});
    expect(stdout).toMatch(/Hello from Python!\n$/);
    expect(stderr).toMatch(/Error\n$/);
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });

  it.each([false, true])('accepts envLock, worker: %s', async (worker) => {
    const kernel0 = new XeusKernel({ type: 'python', packages: ['numpy'], worker });
    const envLock = await kernel0.envLock();
    kernel0.dispose();

    const kernel1 = new XeusKernel({ type: 'python', envLock, worker });
    const executeReturn = await kernel1.execute({ code: 'import numpy; print(numpy.__name__)' });
    const envLock1 = await kernel1.envLock();
    kernel1.dispose();

    expect(executeReturn.stdout).toBe('numpy\n');
    expect(executeReturn.stderr).toBeUndefined();
    expect(envLock1).toEqual(envLock);
    expect(kernel1.isWorker).toEqual(worker);
  });
});
