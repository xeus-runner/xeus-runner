import { createKernelType, DOMMessageHandler, version, XeusKernel } from '@xeus-runner/xeus-runner';

(globalThis as any).createKernelType = createKernelType;
(globalThis as any).DOMMessageHandler = DOMMessageHandler;
(globalThis as any).version = version;
(globalThis as any).XeusKernel = XeusKernel;
