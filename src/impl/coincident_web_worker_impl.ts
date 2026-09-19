import type { ILock } from '@emscripten-forge/mambajs';
import coincident from 'coincident/window/worker';
import type { IXeusKernelImplOptions } from './options';
import { WebWorkerXeusKernelImpl } from './web_worker_impl';

/**
 * Coincident web worker as seen from main UI thread.
 */
export interface ICoincidentWebWorkerKernel {
  envLock(): Promise<ILock | undefined>;
  initialize(options: IXeusKernelImplOptions): Promise<void>;
  onmessage: (event: any) => void;
  processMessage: (msg: any) => Promise<void>;
}

/**
 * Kernel implementation that runs in a web worker and use coincident for communication with main
 * thread.
 */
class CoincidentWebWorkerXeusKernelImpl extends WebWorkerXeusKernelImpl {
  initProxy(proxy: ICoincidentWebWorkerKernel): void {
    // Functions in web worker that are called from main thread.
    proxy.envLock = this.envLock.bind(this);
    proxy.initialize = this.initialize.bind(this);
    proxy.processMessage = this.processMessage.bind(this);

    // Functions in main thread that are called by web worker,
    (this as any).onmessage = proxy.onmessage.bind(proxy);
  }
}

const coincidentWorker = await coincident();
const proxy = coincidentWorker.proxy as ICoincidentWebWorkerKernel;

const { window } = coincidentWorker;
if (globalThis.crossOriginIsolated && window) {
  // Patch window proxy onto globalThis so that e.g. pyjs can access it from within web worker.
  (globalThis as any).window = window;
}

const worker = new CoincidentWebWorkerXeusKernelImpl();
worker.initProxy(proxy);
