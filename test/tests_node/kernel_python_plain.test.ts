import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('Plain JavaScript', () => {
  it.each([false, true])('runs python_plain.mjs, worker: %s', async (worker) => {
    const args = ['tests_node/python_plain.mjs', ...(worker ? ['--worker'] : [])];
    // Child process inherits NODE_OPTIONS so uses the same fetch_preload package cache.
    const { stdout } = await execFileAsync(process.execPath, args, {
      cwd: new URL('..', import.meta.url),
    });
    const lines = stdout.trim().split('\n');
    const output = JSON.parse(lines[lines.length - 1]);

    expect(output.executeReturn.stdout).toBe('Hello from Python!\n');
    expect(output.executeReturn.stderr).toBeUndefined();
    expect(output.isWorker).toEqual(worker);
  });
});
