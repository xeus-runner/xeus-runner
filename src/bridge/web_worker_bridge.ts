import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusKernel } from '../defs';
import type { IXeusKernelImplOptions } from '../impl';
import type { ILogger } from '../logger';
import type { IBridge } from './bridge';

/**
 * Bridge to kernel implementation running in a web worker.
 */
export abstract class WebWorkerBridge implements IBridge {
  protected abstract createWorker(options: IXeusKernelImplOptions): Worker;

  dispose(): void {
    this._worker?.terminate();
    this._worker = undefined;
  }

  abstract envLock(): Promise<ILock | undefined>;

  async initialize(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
    logCallback?: ILogger.ILogCallback,
  ): Promise<void> {
    this._worker = this.createWorker(options);
    return this.initWorker(options, onMessage, logCallback);
  }

  protected abstract initWorker(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
    logCallback?: ILogger.ILogCallback,
  ): Promise<void>;

  abstract sendMessage(msg: any): Promise<void>;

  protected get worker(): Worker {
    if (this._worker === undefined) {
      throw new Error('Worker does not exist');
    }
    return this._worker;
  }

  protected _worker?: Worker;
}
