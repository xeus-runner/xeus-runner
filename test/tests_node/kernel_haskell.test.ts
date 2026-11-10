import { XeusKernel } from 'xeus-runner';

describe('Haskell kernel', () => {
  it.each([false, true])('runs, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'haskell', worker });
    const code = 'main :: IO ()\nmain = putStrLn "Hello from Haskell!"\nmain';
    const executeReturn = await kernel.execute({ code });
    kernel.dispose();

    expect(executeReturn.stdout).toBe('Hello from Haskell!\n');
    expect(executeReturn.stderr).toBeUndefined();
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });
});
