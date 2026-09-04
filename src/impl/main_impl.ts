import { MambajsXeusKernelImpl } from './mambajs_impl';

/**
 * Kernel implementation that runs in the main browser UI thread.
 */
export class MainXeusKernelImpl extends MambajsXeusKernelImpl {
  get isWorker(): boolean {
    return false;
  }
}
