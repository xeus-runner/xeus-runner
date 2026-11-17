import type { ILock } from '@emscripten-forge/mambajs';
import type { KernelMessage } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import coincident from 'coincident/window/main';
import type { OnError, OnMessage } from '../defs';
import type { CoincidentWebWorkerProxy, XeusKernelImplOptions } from '../impl';
import { WebWorkerBridge } from './web_worker_bridge';

/**
 * Bridge to kernel implementation in web worker using coincident for communication between threads.
 */
export class CoincidentWebWorkerBridge extends WebWorkerBridge {
  protected createWorker(_options: XeusKernelImplOptions): Worker {
    return this.createModuleWorker(new URL('./coincident_web_worker_impl.js', import.meta.url));
  }

  override dispose(): void {
    (this._proxy as any) = null;
    super.dispose();
  }

  async envLock(): Promise<ILock | undefined> {
    return await this._proxy?.envLock();
  }

  override async initialize(
    options: XeusKernelImplOptions,
    onMessage: OnMessage,
    onError: OnError,
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

  protected async initWorker(options: XeusKernelImplOptions, onMessage: OnMessage): Promise<void> {
    const { worker } = this;
    worker.onmessage = (event: MessageEvent) => onMessage(event.data);
    this._proxy = (worker as any).proxy as CoincidentWebWorkerProxy;

    // Stdin request is synchronous from the web worker's point of view, blocking until the reply is
    // received. From the UI thread's point of view it is async.
    (this._proxy.processStdinRequest as any) = async (
      inputRequest: KernelMessage.IInputRequestMsg,
    ): Promise<KernelMessage.IInputReplyMsg> => {
      onMessage(inputRequest);
      this.inputDelegate = new PromiseDelegate<KernelMessage.IInputReplyMsg>();
      return await this.inputDelegate.promise;
    };

    return this._proxy.initialize(options);
  }

  async sendMessage(msg: any): Promise<void> {
    if (this._proxy === undefined) {
      throw new Error('Remote kernel does not exist');
    }

    if (msg.msg?.header?.msg_type === 'input_reply') {
      if (msg.msg?.content) {
        this.inputDelegate.resolve(msg.msg);
      } else {
        this.inputDelegate.reject('Failed to get input_reply from stdin');
      }
    } else {
      await this._proxy.processMessage(msg);
    }
  }

  private _proxy?: CoincidentWebWorkerProxy;
  protected inputDelegate = new PromiseDelegate<KernelMessage.IInputReplyMsg>();
}
