import { IXeusKernel } from '../../src/defs';
import { createEnvLock } from '../../src/env_lock';

describe('DEFAULT_CHANNELS', () => {
  test('should have at least two channels', () => {
    expect(IXeusKernel.DEFAULT_CHANNELS.length).toBeGreaterThanOrEqual(2);
  });
});

describe('createEnvLock', () => {
  const params: [string, string[]][] = [
    ['xeus-cpp', ['cppinterop', 'nlohmann_json']],
    ['xeus-lfortran', []],
    ['xeus-lua', ['python', 'nlohmann_json']],
    ['xeus-octave', ['python', 'zlib']],
    ['xeus-python', ['ipython', 'pyjs-rt', 'python', 'python_abi', 'xeus-python-shell']],
    ['xeus-r', ['r-base', 'zlib']],
    ['xeus-shakespearelang', ['pyjs-rt', 'python', 'xeus-pywrap']],
    ['xeus-sqlite', []],
  ];
  params.forEach(async (param) => {
    const want = param[0];
    const expected = param[1];

    test(`should solve ${want}`, async () => {
      const envLock = await createEnvLock({ packages: [want] });
      expect(envLock.platform === 'emscripten-wasm32');

      const packageNames = Object.values(envLock.packages)
        .map((pkg) => pkg.name)
        .sort();
      expect(packageNames).toContain(want);
      expect(packageNames).toContain('emscripten-abi');
      expect(packageNames).toContain('xeus');
      expected.map((exp) => expect(packageNames).toContain(exp));
    });
  });

  test('should solve with pip packages', async () => {
    const envLock = await createEnvLock({ packages: ['xeus-python'], pipPackages: ['bokeh'] });
    expect(envLock.platform === 'emscripten-wasm32');

    const packageNames = Object.values(envLock.packages)
      .map((pkg) => pkg.name)
      .sort();
    expect(packageNames).toContain('python');
    expect(packageNames).toContain('xeus');
    expect(packageNames).toContain('xeus-python');
    expect(packageNames).not.toContain('bokeh');

    const pipPackageNames = Object.values(envLock.pipPackages)
      .map((pkg) => pkg.name)
      .sort();
    expect(pipPackageNames).toContain('bokeh');
    expect(pipPackageNames).toContain('jinja2');
    expect(pipPackageNames).toContain('narwhals');
    expect(pipPackageNames).toContain('xyzservices');
  });

  test('should throw if unknown package', async () => {
    const packages = ['unknown'];
    await expect(createEnvLock({ packages })).rejects.toThrow('Cannot solve the request');
  });

  test('should throw if unknown pip package', async () => {
    const packages = ['xeus-python'];
    const pipPackages = ['unknown'];
    await expect(createEnvLock({ packages, pipPackages })).rejects.toThrow(
      "Cannot install 'unknown' from PyPI",
    );
  });

  test('should throw if no packages specified', async () => {
    const packages: string[] = [];
    await expect(createEnvLock({ packages })).rejects.toThrow('No packages specified');
  });

  test('should throw if no channels specified', async () => {
    const packages: string[] = ['xeus-python'];
    const channels: string[] = [];
    await expect(createEnvLock({ packages, channels })).rejects.toThrow('No channels specified');
  });

  test('should write to logger', async () => {
    const LOG: string[] = [];
    function customLogger(text: string): void {
      LOG.push(text);
    }

    const logger = customLogger;
    await createEnvLock({ packages: ['xeus-python'], logger });

    expect(LOG[0]).toMatch(/^mambajs /);
    expect(LOG[2]).toMatch(/^Solving environment...$/);
    expect(LOG[3]).toMatch(/^Solving took [0-9.]+ seconds$/);
    expect(LOG[4]).toMatch(/^ {2}Name /);
    expect(LOG[5]).toMatch(/^----------/);
    LOG.slice(6).map((line) => expect(line).toMatch(/ {2}(conda-forge|emscripten-forge-4x)/));
  });
});
