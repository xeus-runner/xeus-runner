import type { ILock } from '@emscripten-forge/mambajs';
import type { KernelMessage } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import coincident from 'coincident/window/main';
import type { IXeusKernel } from '../defs';
import type { ICoincidentWebWorkerKernel, IXeusKernelImplOptions } from '../impl';
import { WebWorkerBridge } from './web_worker_bridge';

/**
 * Bridge to kernel implementation in web worker using coincident for communication between threads.
 */
export class CoincidentWebWorkerBridge extends WebWorkerBridge {
  protected createWorker(_options: IXeusKernelImplOptions): Worker {
    return this.createModuleWorker(new URL('./coincident_web_worker_impl.js', import.meta.url));
  }

  override dispose(): void {
    (this._remoteKernel as any) = null;
    super.dispose();
  }

  async envLock(): Promise<ILock | undefined> {
    return await this._remoteKernel?.envLock();
  }

  override async initialize(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
    onError: IXeusKernel.IOnError,
  ): Promise<void> {
    const { Worker: patchedWorker } = coincident();
    const originalWorker = globalThis.Worker;
    globalThis.Worker = patchedWorker;
    try {
      this._worker = this.createWorker(options);
    } finally {
      globalThis.Worker = originalWorker;
    }
    this.handleWorkerErrors(onError);
    return this.initWorker(options, onMessage);
  }

  protected async initWorker(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
  ): Promise<void> {
    const { worker } = this;
    worker.onmessage = (event: MessageEvent) => onMessage(event.data);
    this._remoteKernel = (worker as any).proxy as ICoincidentWebWorkerKernel;

    // Stdin request is synchronous from the web worker's point of view, blocking until the reply is
    // received. From the UI thread's point of view it is async.
    (this._remoteKernel.processStdinRequest as any) = async (
      inputRequest: KernelMessage.IInputRequestMsg,
    ): Promise<KernelMessage.IInputReplyMsg> => {
      onMessage(inputRequest);
      this.inputDelegate = new PromiseDelegate<KernelMessage.IInputReplyMsg>();
      return await this.inputDelegate.promise;
    };

    return this._remoteKernel.initialize(options);
  }

  async sendMessage(msg: any): Promise<void> {
    if (this._remoteKernel === undefined) {
      throw new Error('Remote kernel does not exist');
    }

    if (msg.msg?.header?.msg_type === 'input_reply') {
      if (msg.msg?.content) {
        this.inputDelegate.resolve(msg.msg);
      } else {
        this.inputDelegate.reject('Failed to get input_reply from stdin');
      }
    } else {
      await this._remoteKernel.processMessage(msg);
    }
  }

  private _remoteKernel?: ICoincidentWebWorkerKernel;
  protected inputDelegate = new PromiseDelegate<KernelMessage.IInputReplyMsg>();
}
