import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusWorkerKernel } from '@jupyterlite/xeus-core';
import { expose } from 'comlink';
import { WebWorkerXeusKernelImpl } from './web_worker_impl';

/**
 * Kernel implementation that runs in a web worker and use comlink for communication with main
 * thread.
 */
export interface IComlinkWebWorkerKernel extends IXeusWorkerKernel {
  envLock(): Promise<ILock | undefined>;
}

class ComlinkWebWorkerXeusKernelImpl extends WebWorkerXeusKernelImpl {}

const worker = new ComlinkWebWorkerXeusKernelImpl();
expose(worker);
