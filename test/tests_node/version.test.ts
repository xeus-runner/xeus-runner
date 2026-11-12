import { version } from '@xeus-runner/xeus-runner';

describe('version', () => {
  it('is a valid version string', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  });
});
