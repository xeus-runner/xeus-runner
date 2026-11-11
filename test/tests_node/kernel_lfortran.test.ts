import { XeusKernel } from '@xeus-runner/xeus-runner';

describe('LFortran kernel', () => {
  it.each([false, true])('runs, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'fortran', worker });
    const code = `real :: a, b, result
a = 5.7
b = 0.5
result = a + b
print '(A, F6.2)', "Hello from LFortran, the sum is ", result
`;
    const executeReturn = await kernel.execute({ code });
    kernel.dispose();

    expect(executeReturn.stdout).toBe('Hello from LFortran, the sum is   6.20\n');
    expect(executeReturn.stderr).toBeUndefined();
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });
});
