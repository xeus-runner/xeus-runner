import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusKernel } from '../defs';
import type { IXeusKernelImplOptions } from '../impl';
import type { IBridge } from './bridge';

/**
 * Bridge to kernel implementation running in a web worker.
 */
export abstract class WebWorkerBridge implements IBridge {
  /**
   * Create a module worker. Browsers do not allow worker scripts from a different origin, so in
   * that case create a same-origin blob worker that imports the script. If the page has an opaque
   * origin, such as file://, blob workers are not allowed so a data worker is used instead.
   */
  protected createModuleWorker(url: URL): Worker {
    if (url.origin === globalThis.location.origin) {
      return new Worker(url, { type: 'module' });
    }
    const source = `import ${JSON.stringify(url.href)};`;
    if (globalThis.origin === 'null') {
      // Opaque origin such as file:// does not allow blob workers, but does allow data workers.
      return new Worker(`data:text/javascript,${encodeURIComponent(source)}`, { type: 'module' });
    }
    const blob = new Blob([source], { type: 'text/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    try {
      return new Worker(blobUrl, { type: 'module' });
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

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
    this.worker.onerror = (event: ErrorEvent) => {
      const message = event.message
        ? `Web worker error: ${event.message} (${event.filename}:${event.lineno})`
        : 'Web worker failed to load, see browser console for details';
      onError?.(new Error(message));
    };
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
