import type { ILock } from '@emscripten-forge/mambajs';
import type { ISignal } from '@lumino/signaling';
import type { IKernelType } from './kernel_type';
import type { ILogger } from './logger';
import type { IMessageHandler } from './message_handler';

export interface IXeusKernel {
  /**
   * Signal emitted when the kernel is disposed.
   */
  disposed: ISignal<this, void>;

  /**
   * Dispose of the kernel.
   */
  dispose(): void;

  /**
   * Environment lock file used by the kernel.
   */
  envLock(): Promise<ILock | undefined>;

  /**
   * Execute code in the kernel.
   * Returns a promise that resolves when the execution is complete containing the text-only returns
   * from the kernel if they have not already been handled in some other way by an IMessageHandler.
   *
   * @param options
   */
  execute(options: IXeusKernel.IExecuteOptions): Promise<IXeusKernel.IExecuteReturn>;

  /**
   * Whether the kernel is disposed.
   */
  isDisposed: boolean;

  /**
   * Whether kernel is running in a web worker or the main UI thread.
   */
  isWorker: boolean;

  /**
   * Promise that resolves when the kernel is ready to be used.
   */
  ready: Promise<void>;
}

export namespace IXeusKernel {
  export interface IOptions {
    /**
     * Requested language/kernel such as `python`, `cpp` or `cpp23`.
     * See :func:`~createKernelType` for more details.
     */
    type: string | IKernelType;

    /**
     * Environment lock file. If specified, `packages` and `channels` will be ignored.
     */
    envLock?: ILock;

    /**
     * List of emscripten-forge packages to install, can include version specifiers.
     * Ignored if `envLock` is specified.
     */
    packages?: string[];

    /**
     * List of PyPI packages to install, can include version specifiers.
     * Ignored if `envLock` is specified.
     */
    pipPackages?: string[];

    /**
     * Channels to obtain packages from such as 'https://prefix.dev/emscripten-forge/6x'
     * or 'conda-forge'.
     * Also accepts the following aliases:
     *
     * - 'standard' to use the latest stable emscripten-forge channel, currently 'standard-6x'.
     * - 'standard-4x' to use the emscripten-forge channel built using emscripten version 4.
     * - 'standard-6x' to use the emscripten-forge channel built using emscripten version 6.
     *
     * If unspecified uses 'standard'.
     * Ignored if `envLock` is specified.
     */
    channels?: string[];

    /**
     * Target platform of the environment, default is `emscripten-wasm32`.
     * Ignored if `envLock` is specified.
     */
    platform?: Platform;

    /**
     * Whether to use web worker or not, default is `false`.
     */
    worker?: boolean;

    /**
     * Base URL to obtain the untarjs `unpack.wasm` file. Default is the URL of the xeus-runner
     * module, which is correct for the `dist_node` and `dist_web` bundles as they contain
     * `unpack.wasm`. If bundling `lib` yourself then set this to wherever `unpack.wasm` is served.
     */
    untarjsBaseUrl?: string;

    /**
     * Logger for kernel initialisation and execution.
     */
    logger?: ILogger;

    /**
     * Handler for messages from the kernel. Default is a `TextMessageHandler`.
     */
    messageHandler?: IMessageHandler;
  }

  /**
   * Options passed to IXeusKernel.execute()
   */
  export interface IExecuteOptions {
    /**
     * Code to execute, as string.
     */
    code: string;
  }

  /**
   * Information returned from a XeusKernel.execute call, if it is not handled in some other way
   * such as added to the DOM.
   */
  export interface IExecuteReturn {
    stdout?: string;
    stderr?: string;
  }

  export type IOnError = (err: Error) => void;

  export type IOnMessage = (msg: any) => void;

  /**
   * Supported target platforms.
   */
  export type Platform = 'emscripten-wasm32' | 'emscripten-wasm64';
}
