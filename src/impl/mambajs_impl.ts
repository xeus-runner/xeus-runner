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
import { XeusRemoteKernelBase } from '@jupyterlite/xeus-core';
import { createEnvLock } from '../env_lock';
import { indexOfBytes } from '../utils';
import type { IXeusKernelImplOptions } from './options';

/**
 * Xeus kernel implementation that uses mambajs to obtain packages.
 */
export abstract class MambajsXeusKernelImpl extends XeusRemoteKernelBase {
  protected async defaultDynamicModuleImport(url: string) {
    // Dynamic module import in the main UI thread that is equivalent to `importScripts(url)`
    // in a web worker. Care is needed to set up `globalThis.createXeusModule` in the way that
    // the base kernel impl classes expect it to be. Some of the details here depend on how the
    // emscripten-compiled `xpython.js` (and similar) set up their exports, so it may well change
    // with different emscripten flags and/or version.

    const oldModule = (globalThis as any).module;
    const oldExports = (globalThis as any).exports;

    const Module = {};
    (globalThis as any).module = Module;
    (globalThis as any).exports = {};

    console.debug('==> importing kernel');
    await import(url); // Need async lock here.

    (globalThis as any).createXeusModule = (Module as any).exports;

    (globalThis as any).module = oldModule;
    (globalThis as any).exports = oldExports;
  }

  protected async dynamicModuleImport(url: string): Promise<void> {
    return this.defaultDynamicModuleImport(url);
  }

  get emscriptenMajorVersion(): number {
    return this._emscriptenMajorVersion;
  }

  async envLock(): Promise<ILock | undefined> {
    return this._envLock;
  }

  override async initialize(options: IXeusKernelImplOptions): Promise<void> {
    // Need to determine kernelSpec to add to the options that are passed to base class
    // initialize function, so need to solve for and obtain emscripten-forge packages before
    // calling super.initialize.
    console.debug('==> IXeusKernelImplOptions', options);

    const { envLock, kernelType, untarjsBaseUrl } = options;
    const { packageName: kernelPackageName, specName: kernelSpecName } = kernelType;

    const unpackWasmUrl = untarjsBaseUrl
      ? new URL('unpack.wasm', untarjsBaseUrl).href
      : 'unpack.wasm';
    console.debug('==> unpackWasmUrl', unpackWasmUrl);
    const locateWasm = () => unpackWasmUrl;
    this._untarjs = await initUntarJS(locateWasm);
    if (this._untarjs === undefined) {
      throw new Error('Failed to load untarjs');
    }

    if (envLock !== undefined) {
      console.debug('==> using supplied envLock');
      this._envLock = envLock;
    } else {
      const { channels } = options;
      const packages = options.packages ?? [];
      this._envLock = await createEnvLock({ packages: [kernelPackageName, ...packages], channels });
    }

    if (kernelPackageName === 'xeus-python') {
      this._pythonVersion = getPythonVersion(this._envLock);
      console.debug('==> python version', this._pythonVersion);
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
    console.debug('==> kernelSpec path', kernelSpecPath);
    console.debug('==> kernelSpec', kernelSpec);

    // Add kernelSpec to options before as it is needed in super.initialize
    options.kernelSpec = kernelSpec;
    console.debug('==> emscriptenMajorVersion', this._emscriptenMajorVersion);

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

    if (globalThis.crossOriginIsolated && this._pythonVersion !== undefined) {
      // The pyodide-http package adds extra code if crossOriginIsolated is true that creates a
      // web worker and SharedArrayBuffer which causes our kernel initialisation to fail and is also
      // an unnecessary use of resources. So patch out the crossOriginIsolated code.
      const { FS } = this.Module;
      // get correct python version, can probably get it from elsewhere?
      const version = `${this._pythonVersion[0]}.${this._pythonVersion[1]}`;
      const filename = `/lib/python${version}/site-packages/pyodide_http/_streaming.py`;
      if (FS.isFile(FS.stat(filename).mode)) {
        const contents = FS.readFile(filename, { encoding: 'utf8' });
        const newContents = contents.replace(
          'from js import crossOriginIsolated',
          'crossOriginIsolated = False',
        );
        FS.writeFile(filename, newContents);
        console.log('==> applied patch to file', filename);
      }
    }
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
        verbose: true,
      });
    }

    await loadSharedLibs({
      sharedLibs: this._installedData!.sharedLibs,
      prefix: '/',
      Module: this.Module,
      logger: console,
    });
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

    const blobUrl = URL.createObjectURL(jsBlob);
    await this.dynamicModuleImport(blobUrl);
    URL.revokeObjectURL(blobUrl);
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

  protected maybePatchJs(name: string, array: Uint8Array): Uint8Array {
    console.debug('==> maybePatch', name);
    // Export extra symbols from kernel JS modules.  Should be upstreamed.
    if (
      name.endsWith('/xlua.js') ||
      name.endsWith('/xhaskell.js') ||
      name.endsWith('/xlfortran.js')
    ) {
      const encoder = new TextEncoder();
      const find = encoder.encode('Module["FS"]=FS;') as Uint8Array;
      let index = indexOfBytes(array, find);
      if (index >= 0) {
        const toInsert = ['getDylinkMetadata', 'loadDynamicLibrary', 'LDSO'];
        const insert = encoder.encode(toInsert.map((s) => `Module["${s}"]=${s};`).join(''));
        const patched = new Uint8Array(array.length + insert.length);
        index += find.length;
        patched.set(array.subarray(0, index));
        patched.set(insert, index);
        patched.set(array.subarray(index), index + insert.length);
        console.debug('==> patched', name);
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
    console.debug('==> patching fetch');
    (globalThis as any)._originalFetch = globalThis.fetch;
    globalThis.fetch = this.patchedFetch.bind(globalThis, this._blobCache);
  }

  protected async patchedFetch(
    blobCache: Map<string, Blob>,
    url: URL | RequestInfo,
  ): Promise<Response> {
    const urlStr = url.toString();
    const urlBasename = urlStr.split('/').pop() ?? urlStr;
    const blob = blobCache.get(urlBasename);
    if (blob !== undefined) {
      console.debug('==> patched fetch', urlStr);
      const blobUrl = URL.createObjectURL(blob);
      const response = await (globalThis as any)._originalFetch!(blobUrl);
      // Each blob is only needed once, so delete it after use.
      // This could change if we support dynamic addition/removal of packages while kernel running.
      URL.revokeObjectURL(blobUrl);
      blobCache.delete(urlBasename);
      return response;
    }

    console.debug('==> normal fetch', urlStr);
    return await (globalThis as any)._originalFetch!(url);
  }

  protected async uninstall(_options: IUninstallationCommandOptions): Promise<void> {
    // Not implemented.
  }

  protected unpatchFetch() {
    console.debug('==> unpatching fetch');
    globalThis.fetch = (globalThis as any)._originalFetch;
    delete (globalThis as any)._originalFetch;
  }

  protected _blobCache = new Map<string, Blob>();
  protected _emscriptenMajorVersion: number = 0;
  protected _envLock?: ILock;
  protected _installedData?: IInstalledData;
  protected _pythonVersion?: number[];
  protected _untarjs?: IUnpackJSAPI;
}
