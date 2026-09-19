import { WebXeusKernelImpl } from './web_impl';

/**
 * Kernel implementation that runs in a web browser main UI thread.
 */
export class WebMainXeusKernelImpl extends WebXeusKernelImpl {
  get isWorker(): boolean {
    return false;
  }
}
