import type { ILock } from '@emscripten-forge/mambajs';
import type { Remote } from 'comlink';
import { proxy, wrap } from 'comlink';
import type { IXeusKernel } from '../defs';
import type { IComlinkWebWorkerKernel, IXeusKernelImplOptions } from '../impl';
import type { ILogger } from '../logger';
import { WebWorkerBridge } from './web_worker_bridge';

/**
 * Bridge to kernel implementation in web worker using comlink for communication between threads.
 */
export class ComlinkWebWorkerBridge extends WebWorkerBridge {
  protected createWorker(_options: IXeusKernelImplOptions): Worker {
    return new Worker(new URL('./comlink_web_worker_impl.js', import.meta.url), { type: 'module' });
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
    logCallback?: ILogger.ILogCallback,
  ): Promise<void> {
    const { worker } = this;

    // Avoid use of comlink for messages coming from worker.
    worker.onmessage = (event) => onMessage(event.data);

    this._remoteKernel = wrap(worker) as Remote<IComlinkWebWorkerKernel>;
    return this._remoteKernel.initialize(options, logCallback ? proxy(logCallback) : undefined);
  }

  async sendMessage(msg: any): Promise<void> {
    await this._remoteKernel?.processMessage(msg);
  }

  private _remoteKernel?: Remote<IComlinkWebWorkerKernel>;
}
