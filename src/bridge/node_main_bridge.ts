import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusKernel } from '../defs';
import type { IXeusKernelImplOptions } from '../impl';
import { NodeMainXeusKernelImpl } from '../impl';
import type { IBridge } from './bridge';

/**
 * Bridge to kernel impl running in node main UI thread.
 */
export class NodeMainBridge implements IBridge {
  dispose(): void {
    // Restore globals changed in initialize.
    const g = globalThis as any;
    g.postMessage = this._oldPostMessage;
    if (this._setSelf) {
      delete g.self;
    }
    (this._impl as any) = null;
  }

  async envLock(): Promise<ILock | undefined> {
    return this._impl.envLock();
  }

  async initialize(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
    _onError: IXeusKernel.IOnError,
  ): Promise<void> {
    const g = globalThis as any;
    this._oldPostMessage = g.postMessage;
    this._setSelf = g.self === undefined;
    if (this._setSelf) {
      g.self = g;
    }
    g.postMessage = onMessage;
    return this._impl.initialize(options);
  }

  async sendMessage(msg: any): Promise<void> {
    this._impl.processMessage(msg);
  }

  private _impl: NodeMainXeusKernelImpl = new NodeMainXeusKernelImpl();
  private _oldPostMessage?: any;
  private _setSelf = false;
}
