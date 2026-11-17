import type { ILock } from '@emscripten-forge/mambajs';
import type { Remote } from 'comlink';
import { wrap } from 'comlink';
import type { OnMessage } from '../defs';
import type { ComlinkWebWorkerProxy, XeusKernelImplOptions } from '../impl';
import { WebWorkerBridge } from './web_worker_bridge';

/**
 * Bridge to kernel implementation in web worker using comlink for communication between threads.
 *
 * @category Bridges
 */
export class ComlinkWebWorkerBridge extends WebWorkerBridge {
  protected createWorker(_options: XeusKernelImplOptions): Worker {
    return this.createModuleWorker(new URL('./comlink_web_worker_impl.js', import.meta.url));
  }

  override dispose(): void {
    (this._proxy as any) = null;
    super.dispose();
  }

  async envLock(): Promise<ILock | undefined> {
    return await this._proxy?.envLock();
  }

  protected async initWorker(options: XeusKernelImplOptions, onMessage: OnMessage): Promise<void> {
    const { worker } = this;

    // Avoid use of comlink for messages coming from worker.
    worker.onmessage = (event) => onMessage(event.data);

    this._proxy = wrap(worker) as Remote<ComlinkWebWorkerProxy>;
    return this._proxy.initialize(options);
  }

  async sendMessage(msg: any): Promise<void> {
    await this._proxy?.processMessage(msg);
  }

  private _proxy?: Remote<ComlinkWebWorkerProxy>;
}
