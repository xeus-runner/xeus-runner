import type { ILock } from '@emscripten-forge/mambajs';
import type { IXeusWorkerKernel } from '@jupyterlite/xeus-core';
import type { IKernelType } from '../kernel_type';

export interface IXeusKernelImplOptions extends IXeusWorkerKernel.IOptions {
  kernelType: IKernelType;
  envLock?: ILock;
  packages?: string[];
  pipPackages?: string[];
  channels?: string[];
  untarjsBaseUrl?: string;
}
