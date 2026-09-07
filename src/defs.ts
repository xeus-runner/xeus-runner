import type { ILock } from '@emscripten-forge/mambajs';
import type { ISignal } from '@lumino/signaling';
import type { IKernelType } from './kernel_type';

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
     * Channels to obtain packages from.
     * If unspecified uses `DEFAULT_CHANNELS`, ignored if `envLock` is specified.
     */
    channels?: string[];

    /**
     * Whether to use web worker or not, default is `false`.
     */
    worker?: boolean;

    /**
     * Base URL to obtain the untarjs `unpack.wasm` file.
     */
    untarjsBaseUrl?: string;

    /**
     * Target element or its string `id` to add new child divs to.
     */
    parentElement?: Element | string;

    /**
     * Whether to show source code that is executed or not. Only valid if `parentElement` is set.
     */
    showCode?: boolean;

    /**
     * Prefix for CSS class names of generated `div` elementss, only used if `parentElement` set.
     * Default is `xr`.
     */
    cssClassPrefix?: string;
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

  export type IOnMessage = (msg: any) => void;

  /**
   * Default channels for packages.
   */
  export const DEFAULT_CHANNELS: string[] = [
    'https://prefix.dev/emscripten-forge-4x',
    'https://prefix.dev/conda-forge',
  ];
}
