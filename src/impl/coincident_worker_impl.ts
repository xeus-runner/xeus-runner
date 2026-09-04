import type { ILock } from '@emscripten-forge/mambajs';
import coincident from 'coincident/worker';
import type { IXeusKernelImplOptions } from './options';
import { WorkerXeusKernelImpl } from './worker_impl';

/**
 * Coincident web worker as seen from main UI thread.
 */
export interface ICoincidentWorkerKernel {
  envLock(): Promise<ILock | undefined>;
  initialize(options: IXeusKernelImplOptions): Promise<void>;
  onmessage: (event: any) => void;
  processMessage: (msg: any) => Promise<void>;
}

/**
 * Kernel implementation that runs in a web worker and use coincident for communication with main
 * thread.
 */
class CoincidentWorkerXeusKernelImpl extends WorkerXeusKernelImpl {
  initProxy(proxy: ICoincidentWorkerKernel): void {
    // Functions in web worker that are called from main thread.
    proxy.envLock = this.envLock.bind(this);
    proxy.initialize = this.initialize.bind(this);
    proxy.processMessage = this.processMessage.bind(this);

    // Functions in main thread that are called by web worker,
    (this as any).onmessage = proxy.onmessage.bind(proxy);
  }
}

const coincidentWorker = await coincident();
const proxy = coincidentWorker.proxy as ICoincidentWorkerKernel;

const worker = new CoincidentWorkerXeusKernelImpl();
worker.initProxy(proxy);
