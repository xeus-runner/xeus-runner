import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusKernel } from '../defs';
import type { IXeusKernelImplOptions } from '../impl';
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
    onError: IXeusKernel.IOnError,
  ): Promise<void> {
    this._worker = this.createWorker(options);
    this.handleWorkerErrors(onError);
    return this.initWorker(options, onMessage);
  }

  protected handleWorkerErrors(onError?: IXeusKernel.IOnError): void {
    this.worker.onerror = (event: ErrorEvent) => onError?.(new Error(event.message));
  }

  protected abstract initWorker(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
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
