import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusWorkerKernel } from '@jupyterlite/xeus-core';
import { expose } from 'comlink';
import type { XeusKernelImplOptions } from './options';
import { WebWorkerXeusKernelImpl } from './web_worker_impl';

/**
 * Proxy for the ComlinkWebWorkerXeusKernelImpl running in a web worker, as seen from the main UI
 * thread.
 */
export interface ComlinkWebWorkerProxy extends IXeusWorkerKernel {
  envLock(): Promise<ILock | undefined>;
  initialize(options: XeusKernelImplOptions): Promise<void>;
}

class ComlinkWebWorkerXeusKernelImpl extends WebWorkerXeusKernelImpl {}

const worker = new ComlinkWebWorkerXeusKernelImpl();
expose(worker);
