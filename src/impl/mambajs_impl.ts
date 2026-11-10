import type { ILock, ISolvedPackages } from '@emscripten-forge/mambajs';
import {
  bootstrapPython,
  installPackagesToEmscriptenFS,
  loadSharedLibs,
} from '@emscripten-forge/mambajs';
import type {
  IInstallationCommandOptions,
  IInstalledData,
  IUninstallationCommandOptions,
} from '@emscripten-forge/mambajs-core';
import { computePackageUrl, getPythonVersion } from '@emscripten-forge/mambajs-core';
import type { FilesData, IUnpackJSAPI } from '@emscripten-forge/untarjs';
import { fetchByteArray, initUntarJS } from '@emscripten-forge/untarjs';
import type { IXeusWorkerLogger } from '@jupyterlite/xeus-core';
import { XeusRemoteKernelBase } from '@jupyterlite/xeus-core';
import { createEnvLock } from '../env_lock';
import { ILogger } from '../logger';
import { indexOfBytes, isNode } from '../utils';
import type { IXeusKernelImplOptions } from './options';

/**
 * Xeus kernel implementation that uses mambajs to obtain packages.
 */
export abstract class MambajsXeusKernelImpl extends XeusRemoteKernelBase {
  abstract dynamicModuleImportFromBlob(blob: Blob): Promise<void>;

  protected async dynamicModuleImportFromUrl(url: string) {
    // Dynamic module import in the main UI thread that is equivalent to `importScripts(url)`
    // in a web worker. Care is needed to set up `globalThis.createXeusModule` in the way that
    // the base kernel impl classes expect it to be. Some of the details here depend on how the
    // emscripten-compiled `xpython.js` (and similar) set up their exports, so it may well change
    // with different emscripten flags and/or version.

    const g = globalThis as any;

    const oldExports = g.exports;
    const oldModule = g.module;
    const oldPostMessage = g.postMessage;

    const Module = {};
    g.module = Module;
    g.exports = {};

    this._log(ILogger.Level.Info, 'importing kernel');
    await import(url); // Need async lock here.

    g.createXeusModule = (Module as any).exports;

    if (g.exports !== oldExports) {
      g.exports = oldExports;
    }
    if (g.module !== oldModule) {
      g.module = oldModule;
    }
    if (g.postMessage !== oldPostMessage) {
      g.postMessage = oldPostMessage;
    }
  }

  get emscriptenMajorVersion(): number {
    return this._emscriptenMajorVersion;
  }

  async envLock(): Promise<ILock | undefined> {
    return this._envLock;
  }

  override async initialize(
    options: IXeusKernelImplOptions,
    logCallback?: ILogger.ILogCallback,
  ): Promise<void> {
    this._logCallback = logCallback;

    // Need to determine kernelSpec to add to the options that are passed to base class
    // initialize function, so need to solve for and obtain emscripten-forge packages before
    // calling super.initialize.
    this._log(ILogger.Level.Debug, 'IXeusKernelImplOptions', options);

    const { envLock, kernelType, untarjsBaseUrl } = options;
    const { packageName: kernelPackageName, specName: kernelSpecName } = kernelType;

    const unpackWasmUrl = untarjsBaseUrl
      ? new URL('unpack.wasm', untarjsBaseUrl).href
      : 'unpack.wasm';
    this._log(ILogger.Level.Debug, 'unpackWasmUrl', unpackWasmUrl.slice(0, 70));
    const locateWasm = () => unpackWasmUrl;
    this._untarjs = await initUntarJS(locateWasm);
    if (this._untarjs === undefined) {
      throw new Error('Failed to load untarjs');
    }

    if (envLock !== undefined) {
      this._log(ILogger.Level.Debug, 'using supplied envLock');
      this._envLock = envLock;
    } else {
      const { channels, platform } = options;
      const packages = options.packages ?? [];
      const pipPackages = options.pipPackages ?? [];
      this._envLock = await createEnvLock({
        packages: [kernelPackageName, ...packages],
        pipPackages,
        channels,
        platform,
      });
    }

    this._log(ILogger.Level.Debug, 'envLock', this._envLock);

    if (kernelPackageName === 'xeus-python') {
      this._pythonVersion = getPythonVersion(this._envLock);
      this._log(ILogger.Level.Debug, 'python version', this._pythonVersion);
    }

    let kernelSpec: any;
    let kernelSpecPath: string | undefined;

    // Download and cache files needed to load the kernel module which are a `.js`, `.wasm` and
    // possible `.data` from the kernel package (or `xeus-pywrap`), and system shared libraries from
    // potentially any packages. To identify these files we have to download all of the environment
    // packages, so cache all of them also to avoid downloading them again later. Also need the
    // kernelSpec which comes from the kernel package.
    const pkgs: ISolvedPackages = this._envLock.packages;
    const channelInfo: ILock['channelInfo'] = this._envLock.channelInfo;

    const binRegex = /^bin\/[\w-]+\.(js|wasm|data)$/;
    const kernelSpecRegex = /^share\/jupyter\/kernels\/[^/]+\/kernel.json$/;

    // Kernels need some shared libraries, so identify and cache all found in the environment.
    // Alternatively could identify exactly which are required from the kernel package.
    const soRegex = /[\w-]+\.so(\.\d+)*$/;

    await Promise.all(
      Object.keys(pkgs).map(async (filename) => {
        const pkg = pkgs[filename];
        const isKernelSpecPkg = pkg.name === kernelPackageName;
        const isKernelBinaryPkg = pkg.name === kernelPackageName || pkg.name === 'xeus-pywrap';
        const pkgUrl = computePackageUrl(pkg, filename, channelInfo);
        const wholePkgData = await fetchByteArray(pkgUrl);
        const blob = new Blob([wholePkgData as any], { type: 'application/x-bzip2' });
        this._blobCache.set(filename, blob);
        const pkgData: FilesData = await this._untarjs!.extractData(wholePkgData);
        Object.keys(pkgData).forEach((name) => {
          if (soRegex.test(name) || (isKernelBinaryPkg && binRegex.test(name))) {
            let type = 'application/wasm';
            let array = pkgData[name];
            if (name.endsWith('.js')) {
              type = 'text/javascript';
              array = this.maybePatchJs(name, array);
            } else if (name.endsWith('.data')) {
              type = 'application/octet-stream'; // Not sure about this?
            }
            const blob = new Blob([array as any], { type });
            this._blobCache.set(name.split('/').pop()!, blob);
          }
        });
        if (isKernelSpecPkg) {
          if (kernelSpecName !== undefined) {
            kernelSpecPath = `share/jupyter/kernels/${kernelSpecName}/kernel.json`;
          } else {
            const specs = Object.keys(pkgData).filter((name) => kernelSpecRegex.test(name));
            if (specs.length === 1) {
              // One kernel spec found so use that as it is unambiguous.
              kernelSpecPath = specs[0];
            }
          }
          if (kernelSpecPath !== undefined) {
            const kernelSpecData = pkgData[kernelSpecPath];
            if (kernelSpecData !== undefined) {
              kernelSpec = JSON.parse(new TextDecoder('utf-8').decode(kernelSpecData));
            }
          }
        }
        if (pkg.name === 'emscripten-abi') {
          this._emscriptenMajorVersion = Number.parseInt(pkg.version.split('.')[0], 10);
        }
      }),
    );

    if (kernelSpec === undefined) {
      throw new Error('No kernelSpec found');
    }
    this._log(ILogger.Level.Debug, 'kernelSpec path', kernelSpecPath);
    this._log(ILogger.Level.Debug, 'kernelSpec', kernelSpec);

    // Add kernelSpec to options before as it is needed in super.initialize
    options.kernelSpec = kernelSpec;
    this._log(ILogger.Level.Debug, 'emscriptenMajorVersion', this._emscriptenMajorVersion);

    // blobCache is full, so patch fetch to use it.
    this.patchFetch();

    await super.initialize(options);

    // Patched fetch no longer needed, assuming we don't support adding/removing packages whilst the
    // kernel is running.
    this.unpatchFetch();
  }

  protected async initializeFileSystem(_options: IXeusKernelImplOptions): Promise<void> {
    if (this._envLock === undefined) {
      throw new Error('No envLock');
    }

    // Bootstrap into emscripten FS.  These packages are fetched from local blobCache via
    // patched fetch() call.
    this._installedData = await installPackagesToEmscriptenFS({
      packages: {
        packages: this._envLock.packages,
        pipPackages: this._envLock.pipPackages,
      },
      channels: this._envLock.channelInfo,
      Module: this.Module,
      untarjs: this._untarjs,
    });
  }

  protected async initializeInterpreter(options: IXeusKernelImplOptions): Promise<void> {
    const { kernelType } = options;

    if (kernelType.packageName === 'xeus-python') {
      if (this._pythonVersion === undefined) {
        throw new Error('Cannot determine python version from environment lock file');
      }
      await bootstrapPython({
        pythonVersion: this._pythonVersion,
        prefix: '/',
        Module: this.Module,
        verbose: false,
      });
    }

    if (!this.isWorker) {
      await loadSharedLibs({
        sharedLibs: this._installedData!.sharedLibs,
        prefix: '/',
        Module: this.Module,
        logger: console,
      });
    }
  }

  protected override initializeLogger(_options: IXeusKernelImplOptions): IXeusWorkerLogger {
    // Override kernel logger that forwards to this._log.
    return {
      log: (...msg: any[]) => this._log(ILogger.Level.Info, ...msg),
      warn: (...msg: any[]) => this._log(ILogger.Level.Warning, ...msg),
      error: (...msg: any[]) => this._log(ILogger.Level.Error, ...msg),
      executionCount: 0,
    };
  }

  protected async initializeModule(options: IXeusKernelImplOptions): Promise<void> {
    if (this._envLock === undefined) {
      throw new Error('No envLock');
    }

    const { kernelSpec } = options;
    const binaryName = (kernelSpec.argv as string[])[0].split('/').at(-1);
    if (binaryName === undefined) {
      throw new Error('Unable to determine kernel binary filename');
    }

    const jsName = `${binaryName}.js`;
    const jsBlob = this._blobCache.get(jsName);
    if (jsBlob === undefined) {
      throw new Error(`Cannot find cached ${jsName}`);
    }

    await this.dynamicModuleImportFromBlob(jsBlob);
  }

  protected initializeStdin(_baseUrl: string, _browsingContextId: string): void {
    // Not implemented.
  }

  protected async install(_options: IInstallationCommandOptions): Promise<void> {
    // Not implemented.
  }

  abstract get isWorker(): boolean;

  protected async listInstalledPackages(): Promise<void> {
    // Not implemented.
  }

  protected _log(level: ILogger.Level, ...msg: any[]): void {
    if (this._logCallback !== undefined) {
      this._logCallback(level, ...msg);
    }
  }

  protected maybePatchJs(name: string, array: Uint8Array): Uint8Array {
    this._log(ILogger.Level.Debug, 'maybePatch', name);
    // Export extra symbols from kernel JS modules.  Should be upstreamed.
    // Also if using node need to add readAsync,
    const needExports = ['bin/xlua.js', 'bin/xhaskell.js', 'bin/xlfortran.js'].includes(name);
    const needReadAsync = name.startsWith('bin/') && isNode();
    if (needExports || needReadAsync) {
      const encoder = new TextEncoder();
      const find = encoder.encode('Module["FS"]=FS;') as Uint8Array;
      let index = indexOfBytes(array, find);
      if (index >= 0) {
        let insertString = '';
        if (needExports) {
          const toInsert = ['getDylinkMetadata', 'loadDynamicLibrary', 'LDSO'];
          insertString = toInsert.map((s) => `Module["${s}"]=${s};`).join('');
        }
        if (needReadAsync) {
          insertString =
            insertString +
            'if(typeof readAsync==="undefined"){readAsync=async url=>{const response=await globalThis.fetch(url);if(response.ok){return response.arrayBuffer()}throw new Error(response.status+" : "+response.url)};}';
        }
        const insert = encoder.encode(insertString);
        const patched = new Uint8Array(array.length + insert.length);
        index += find.length;
        patched.set(array.subarray(0, index));
        patched.set(insert, index);
        patched.set(array.subarray(index), index + insert.length);
        this._log(ILogger.Level.Info, 'patched', name);
        return patched;
      }
    }

    return array;
  }

  async mount(
    _driveName: string,
    _mountpoint: string,
    _baseUrl: string,
    _browsingContextId: string,
  ): Promise<void> {
    // Not implemented.
  }

  protected patchFetch() {
    this._log(ILogger.Level.Info, 'patching fetch');
    (globalThis as any)._originalFetch = globalThis.fetch;
    globalThis.fetch = this.patchedFetch.bind(this, this._blobCache);
  }

  protected async patchedFetch(
    blobCache: Map<string, Blob>,
    url: URL | RequestInfo,
  ): Promise<Response> {
    const urlStr = url.toString();
    const urlBasename = urlStr.split('/').pop() ?? urlStr;
    const blob = blobCache.get(urlBasename);
    if (blob !== undefined) {
      this._log(ILogger.Level.Debug, 'patched fetch', urlStr.slice(0, 70));
      const blobUrl = URL.createObjectURL(blob);
      const response = await (globalThis as any)._originalFetch!(blobUrl);
      // Each blob is only needed once, so delete it after use.
      // This could change if we support dynamic addition/removal of packages while kernel running.
      URL.revokeObjectURL(blobUrl);
      blobCache.delete(urlBasename);
      return response;
    }

    this._log(ILogger.Level.Debug, 'normal fetch', urlStr.slice(0, 70));
    return await (globalThis as any)._originalFetch!(url);
  }

  protected async uninstall(_options: IUninstallationCommandOptions): Promise<void> {
    // Not implemented.
  }

  protected unpatchFetch() {
    this._log(ILogger.Level.Info, 'unpatching fetch');
    globalThis.fetch = (globalThis as any)._originalFetch;
    delete (globalThis as any)._originalFetch;
  }

  protected _blobCache = new Map<string, Blob>();
  protected _emscriptenMajorVersion: number = 0;
  protected _envLock?: ILock;
  protected _installedData?: IInstalledData;
  private _logCallback?: ILogger.ILogCallback;
  protected _pythonVersion?: number[];
  protected _untarjs?: IUnpackJSAPI;
}
