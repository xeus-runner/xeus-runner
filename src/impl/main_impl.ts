import { MambajsXeusKernelImpl } from './mambajs_impl';

/**
 * Kernel implementation that runs in the main browser UI thread.
 */
export class MainXeusKernelImpl extends MambajsXeusKernelImpl {
  protected async dynamicModuleImport(url: string): Promise<void> {
    return this.defaultDynamicModuleImport(url);
  }

  get isWorker(): boolean {
    return false;
  }
}
