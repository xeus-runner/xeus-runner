import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusKernel } from '../defs';
import type { IXeusKernelImplOptions } from '../impl';
import type { ILogger } from '../logger';

/**
 * Bridge from XeusKernel to kernel implementation (impl), encapsulating communication between the
 * two.  If the kernel impl is in the main thread then communication is via simple function calls,
 * if it is in a web worker it is via message handling.
 */
export interface IBridge {
  /**
   * Dispose the bridge and its impl.
   */
  dispose(): void;

  /**
   * Environment lock file used by the kernel.
   */
  envLock(): Promise<ILock | undefined>;

  /**
   * Initialise the kernel impl.
   *
   * @param options Options to initialize the impl.
   * @param onMessage Handler for messages sent from the impl to the XeusKernel.
   * @param logCallback Optional callback for logging from the impl.
   * @param onError Optional callback for errors from the impl, such as a worker crashing.
   */
  initialize(
    options: IXeusKernelImplOptions,
    onMessage: IXeusKernel.IOnMessage,
    onError: IXeusKernel.IOnError,
    logCallback?: ILogger.ILogCallback,
  ): Promise<void>;

  /**
   * Send message to kernel impl.
   *
   * @param msg Message to send.
   */
  sendMessage(msg: any): Promise<void>;
}
