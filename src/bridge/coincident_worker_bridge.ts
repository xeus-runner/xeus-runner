import type { ILock } from '@emscripten-forge/mambajs';
import coincident from 'coincident/window/main';
import type { IXeusKernel } from '../defs';
import type { ICoincidentWorkerKernel, IXeusKernelImplOptions } from '../impl';
import { WorkerBridge } from './worker_bridge';

/**
 * Bridge to kernel implementation in web worker using coincident for communication between threads.
 */
export class CoincidentWorkerBridge extends WorkerBridge {
  protected createWorker(_options: IXeusKernelImplOptions): Worker {
    const { Worker: patchedWorker } = coincident();
    const originalWorker = globalThis.Worker;
    globalThis.Worker = patchedWorker;
    const worker = new Worker(new URL('./coincident_worker_impl.js', import.meta.url));
    globalThis.Worker = originalWorker;
    return worker;
  }

  override dispose(): void {
    (this._remoteKernel as any) = null;
    super.dispose();
  }

  async envLock(): Promise<ILock | undefined> {
    return await this._remoteKernel?.envLock();
  }

  protected async initWorker(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
  ): Promise<void> {
    const { worker } = this;
    worker.onmessage = (event: MessageEvent) => onMessage(event.data);
    this._remoteKernel = (worker as any).proxy as ICoincidentWorkerKernel;

    return this._remoteKernel.initialize(options);
  }

  async sendMessage(msg: any): Promise<void> {
    if (this._remoteKernel === undefined) {
      throw new Error('Remote kernel does not exist');
    }
    await this._remoteKernel.processMessage(msg);
  }

  private _remoteKernel?: ICoincidentWorkerKernel;
}
