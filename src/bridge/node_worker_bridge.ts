import type { Worker } from 'node:worker_threads';
import type { ILock } from '@emscripten-forge/mambajs';
import { PromiseDelegate } from '@lumino/coreutils';
import type { IXeusKernel } from '../defs';
import type { IXeusKernelImplOptions } from '../impl';
import type { IBridge } from './bridge';

/**
 * Bridge to kernel impl running in node worker.
 */
export class NodeWorkerBridge implements IBridge {
  protected async createWorker(_options: IXeusKernelImplOptions): Promise<Worker> {
    // Dynamic import so that browser bundles do not contain a static import of a node module.
    const { Worker } = await import('node:worker_threads');
    return new Worker(new URL('./node_worker_impl.js', import.meta.url));
  }

  dispose(): void {
    // Remove listeners first so that terminating the worker is not reported as an error.
    this._worker?.removeAllListeners();
    this._worker?.terminate();
    this._worker = undefined;
  }

  async envLock(): Promise<ILock | undefined> {
    if (this._envLockDelegate === undefined) {
      const { worker } = this; // Throws if no worker, before the delegate is stored.
      this._envLockDelegate = new PromiseDelegate<ILock | undefined>();
      worker.postMessage({ envLock: true });
    }
    return this._envLockDelegate.promise;
  }

  async initialize(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
    onError: IXeusKernel.IOnError,
  ): Promise<void> {
    this._worker = await this.createWorker(options);
    return this.initWorker(options, onMessage, onError);
  }

  protected initWorker(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
    onError: IXeusKernel.IOnError,
  ): Promise<void> {
    const promiseDelegate = new PromiseDelegate<void>();
    const { worker } = this;
    worker.on('message', (data: any) => {
      if (data === 'ready') {
        promiseDelegate.resolve();
      } else if (typeof data === 'object' && data !== null && 'envLockReply' in data) {
        this._envLockDelegate?.resolve(data.envLockReply);
        this._envLockDelegate = undefined;
      } else {
        onMessage(data);
      }
    });
    const fail = (err: Error) => {
      promiseDelegate.reject(err);
      onError(err);
    };
    worker.on('error', fail);
    worker.on('exit', (code: number) => fail(new Error(`Worker exited with code ${code}`)));
    worker.postMessage({ initialize: options });
    return promiseDelegate.promise;
  }

  async sendMessage(msg: any): Promise<void> {
    this.worker.postMessage({ msg: msg.msg });
  }

  protected get worker(): Worker {
    if (this._worker === undefined) {
      throw new Error('Worker does not exist');
    }
    return this._worker;
  }

  protected _worker?: Worker;
  private _envLockDelegate?: PromiseDelegate<ILock | undefined>;
}
