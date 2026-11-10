import { NodeXeusKernelImpl } from './node_impl';

/**
 * Kernel implementation that runs in node main UI thread.
 */
export class NodeMainXeusKernelImpl extends NodeXeusKernelImpl {
  get isWorker(): boolean {
    return false;
  }
}
