import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusWorkerKernel } from '@jupyterlite/xeus-core';
import type { IXeusKernel } from '../defs';
import type { IKernelType } from '../kernel_type';

export interface IXeusKernelImplOptions extends IXeusWorkerKernel.IOptions {
  kernelType: IKernelType;
  envLock?: ILock;
  packages?: string[];
  pipPackages?: string[];
  channels?: string[];
  platform?: IXeusKernel.Platform;
  untarjsBaseUrl?: string;
}
