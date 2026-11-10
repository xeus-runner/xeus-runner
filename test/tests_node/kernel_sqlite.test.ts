import { XeusKernel } from 'xeus-runner';

describe('Sqlite kernel', () => {
  it.each([false, true])('runs, worker: %s', async (worker) => {
    const kernel = new XeusKernel({ type: 'sqlite', worker });
    await kernel.execute({ code: '%CREATE mydb.db mydb' });
    const executeReturn = await kernel.execute({ code: 'SELECT sqlite_version()' });
    kernel.dispose();

    expect(executeReturn.stdout).not.toBeUndefined();
    const lines = executeReturn.stdout!.split('\n');
    expect(lines).toHaveLength(5);
    expect(lines[1]).toMatch('sqlite_version()');
    expect(lines[3]).toMatch(/\s+\d+\.\d+\.\d+\s+/);

    expect(executeReturn.stderr).toBeUndefined();
    expect(kernel.isWorker).toEqual(worker);
    expect(kernel.isDisposed).toBeTruthy();
  });
});
