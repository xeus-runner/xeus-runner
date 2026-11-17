import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusWorkerKernel } from '@jupyterlite/xeus-core';
import type { Platform } from '../defs';
import type { KernelType } from '../kernel_type';

export interface XeusKernelImplOptions extends IXeusWorkerKernel.IOptions {
  kernelType: KernelType;
  envLock?: ILock;
  packages?: string[];
  pipPackages?: string[];
  channels?: string[];
  platform?: Platform;
  untarjsBaseUrl?: string;
  log: boolean; // Whether to post log messages to the XeusKernel.
}
