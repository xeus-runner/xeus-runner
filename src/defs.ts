import type { ILock } from '@emscripten-forge/mambajs';
import type { KernelType } from './kernel_type';
import type { Logger } from './logger';
import type { MessageHandler } from './message_handler';

export interface XeusKernelOptions {
  /**
   * Requested language/kernel such as `python`, `cpp` or `cpp23`.
   * See :func:`~createKernelType` for more details.
   */
  type: string | KernelType;

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
  logger?: Logger;

  /**
   * Handler for messages from the kernel. Default is a `TextMessageHandler`.
   */
  messageHandler?: MessageHandler;
}

/**
 * Options passed to XeusKernel.execute()
 */
export interface ExecuteOptions {
  /**
   * Code to execute, as string.
   */
  code: string;
}

/**
 * Information returned from a XeusKernel.execute call, if it is not handled in some other way
 * such as added to the DOM.
 */
export interface ExecuteReturn {
  stdout?: string;
  stderr?: string;
}

export type OnError = (err: Error) => void;

export type OnMessage = (msg: any) => void;

/**
 * Progress of kernel installation.
 */
export interface InstallProgress {
  /**
   * Fraction of installation completed, from 0 to 1 (ready).
   */
  fraction: number;

  /**
   * Descriptive progress message.
   */
  message: string;
}

/**
 * Supported target platforms.
 */
export type Platform = 'emscripten-wasm32' | 'emscripten-wasm64';
