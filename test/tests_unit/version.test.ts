import { version } from '../../src/version';

describe('version', () => {
  it('is a valid version string', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
  });
});
