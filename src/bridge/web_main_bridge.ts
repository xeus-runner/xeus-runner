import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusKernel } from '../defs';
import type { IXeusKernelImplOptions } from '../impl';
import { WebMainXeusKernelImpl } from '../impl';
import type { ILogger } from '../logger';
import type { IBridge } from './bridge';

/**
 * Bridge to kernel impl running in a web browser main UI thread.
 */
export class WebMainBridge implements IBridge {
  dispose(): void {
    (this._impl as any) = null;
  }

  async envLock(): Promise<ILock | undefined> {
    return this._impl.envLock();
  }

  async initialize(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
    logCallback?: ILogger.ILogCallback,
  ): Promise<void> {
    (globalThis as any).postMessage = onMessage;
    return this._impl.initialize(options, logCallback);
  }

  async sendMessage(msg: any): Promise<void> {
    this._impl.processMessage(msg);
  }

  private _impl: WebMainXeusKernelImpl = new WebMainXeusKernelImpl();
}
