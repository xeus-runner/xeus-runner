import { ILogger } from '../logger';
import { MambajsXeusKernelImpl } from './mambajs_impl';
import type { IXeusKernelImplOptions } from './options';

/**
 * Abstract base class for kernel implementation that runs in node.
 */
export abstract class NodeXeusKernelImpl extends MambajsXeusKernelImpl {
  async dynamicModuleImportFromBlob(blob: Blob): Promise<void> {
    // Node: blob URLs aren't supported by the ESM loader. Kernel JS is CommonJS/UMD so evaluate
    // it with new Function; the sourceURL keeps stack traces short (a data URL import puts the
    // whole base64 module in every stack frame).
    const g = globalThis as any;
    const oldPostMessage = g.postMessage;

    const jsText = await blob.text();
    const module = { exports: {} as any };
    this._log(ILogger.Level.Info, 'importing kernel');
    new Function('module', 'exports', jsText)(module, module.exports);
    g.createXeusModule = module.exports;

    if (g.postMessage !== oldPostMessage) {
      g.postMessage = oldPostMessage;
    }
  }

  protected override async initializeModule(options: IXeusKernelImplOptions): Promise<any> {
    await super.initializeModule(options);
    // Send emscripten stdout/stderr to the logger rather than console.log/error.
    return {
      print: (text: string) => this._log(ILogger.Level.Info, text),
      printErr: (text: string) => this._log(ILogger.Level.Warning, text),
    };
  }
}
