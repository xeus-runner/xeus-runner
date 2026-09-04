import { createKernelType, XeusKernel } from 'xeus-runner';

(globalThis as any).createKernelType = createKernelType;
(globalThis as any).XeusKernel = XeusKernel;
