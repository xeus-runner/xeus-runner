import { createKernelType, DOMMessageHandler, XeusKernel } from 'xeus-runner';

(globalThis as any).createKernelType = createKernelType;
(globalThis as any).DOMMessageHandler = DOMMessageHandler;
(globalThis as any).XeusKernel = XeusKernel;
