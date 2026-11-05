import { IXeusKernel } from '../../src/defs';
import { createEnvLock } from '../../src/env_lock';
import type { ILogger } from '../../src/logger';

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

  test('should support different platform and channels', async () => {
    const envLock = await createEnvLock({
      packages: ['xeus-python', 'contourpy'],
      channels: [
        'https://prefix.dev/emscripten-forge-bot/emscripten-forge-6x',
        'https://repo.prefix.dev/conda-forge',
      ],
      platform: 'emscripten-wasm64',
    });
    expect(envLock.platform === 'emscripten-wasm64');
    expect(envLock.channels).toEqual([
      'https://prefix.dev/emscripten-forge-bot/emscripten-forge-6x',
      'conda-forge',
    ]);

    const packageNames = Object.values(envLock.packages)
      .map((pkg) => pkg.name)
      .sort();
    expect(packageNames).toContain('python');
    expect(packageNames).toContain('xeus');
    expect(packageNames).toContain('xeus-python');
    expect(packageNames).toContain('contourpy');

    const matches = Object.keys(envLock.packages).filter((name) => name.startsWith('contourpy-'));
    expect(matches).toHaveLength(1);
    const contourpy = envLock.packages[matches[0]];
    expect(contourpy.channel).toEqual(
      'https://prefix.dev/emscripten-forge-bot/emscripten-forge-6x',
    );
    expect(contourpy.subdir).toEqual('emscripten-wasm64');
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
    class TestLogger implements ILogger {
      log(_level: ILogger.Level, ...msg: any[]): void {
        LOG.push(msg.join(' '));
      }
    }

    const logger = new TestLogger();
    await createEnvLock({ packages: ['xeus-python'], logger });

    expect(LOG[0]).toMatch(/^mambajs /);
    expect(LOG[2]).toMatch(/^Solving environment...$/);
    expect(LOG[3]).toMatch(/^Solving took [0-9.]+ seconds$/);
    expect(LOG[4]).toMatch(/^ {2}Name /);
    expect(LOG[5]).toMatch(/^----------/);
    LOG.slice(6).map((line) => expect(line).toMatch(/ {2}(conda-forge|emscripten-forge-4x)/));
  });
});
