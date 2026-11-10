import { parentPort } from 'node:worker_threads';
import { NodeXeusKernelImpl } from './node_impl';
import type { IXeusKernelImplOptions } from './options';

/**
 * Kernel implementation that runs in a node worker.
 */
export class NodeWorkerXeusKernelImpl extends NodeXeusKernelImpl {
  get isWorker(): boolean {
    return true;
  }
}

if (parentPort === null) {
  throw new Error('NodeWorkerXeusKernelImpl must be run in a node worker thread');
}
const port = parentPort;

// Kernel code expects browser worker globals, including postMessage to send messages to the
// main thread.
const g = globalThis as any;
g.self = g;
g.postMessage = (msg: any) => port.postMessage(msg);

const worker = new NodeWorkerXeusKernelImpl();

port.on('message', async (data: any) => {
  if (data.initialize) {
    await worker.initialize(data.initialize as IXeusKernelImplOptions, (level, ...msg) =>
      port.postMessage({ log: [level, ...msg] }),
    );
    port.postMessage('ready');
  } else if (data.envLock) {
    port.postMessage({ envLockReply: await worker.envLock() });
  } else {
    worker.processMessage(data);
  }
});
