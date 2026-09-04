import { MambajsXeusKernelImpl } from './mambajs_impl';

/**
 * Abstract base class for kernel implementation that runs in a web worker, potentially subclassed
 * for different communication implementations such as comlink and coincident.
 */
export abstract class WorkerXeusKernelImpl extends MambajsXeusKernelImpl {
  get isWorker(): boolean {
    return true;
  }
}
