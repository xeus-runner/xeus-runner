import type { ILock } from '@emscripten-forge/mambajs';
import type { OnError, OnMessage } from '../defs';
import type { XeusKernelImplOptions } from '../impl';

/**
 * Bridge from XeusKernel to kernel implementation (impl), encapsulating communication between the
 * two.  If the kernel impl is in the main thread then communication is via simple function calls,
 * if it is in a web worker it is via message handling.
 */
export interface Bridge {
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
   * @param onError Optional callback for errors from the impl, such as a worker crashing.
   */
  initialize(options: XeusKernelImplOptions, onMessage: OnMessage, onError: OnError): Promise<void>;

  /**
   * Send message to kernel impl.
   *
   * @param msg Message to send.
   */
  sendMessage(msg: any): Promise<void>;
}
