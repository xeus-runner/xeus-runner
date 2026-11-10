import { MambajsXeusKernelImpl } from './mambajs_impl';

/**
 * Abstract base class for kernel implementation that runs in a web browser.
 */
export abstract class WebXeusKernelImpl extends MambajsXeusKernelImpl {
  async dynamicModuleImportFromBlob(blob: Blob): Promise<void> {
    // Use blob URL
    const blobUrl = URL.createObjectURL(blob);
    await this.dynamicModuleImportFromUrl(blobUrl);
    URL.revokeObjectURL(blobUrl);
  }
}
