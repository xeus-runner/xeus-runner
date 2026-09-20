import type { IXeusKernel } from '../defs';
import type { IBridge } from './bridge';
import { CoincidentWebWorkerBridge } from './coincident_web_worker_bridge';
import { ComlinkWebWorkerBridge } from './comlink_web_worker_bridge';
import { WebMainBridge } from './web_main_bridge';

export class BridgeFactory {
  createBridge(options: IXeusKernel.IOptions): IBridge {
    if (options.worker) {
      if (globalThis.crossOriginIsolated) {
        return new CoincidentWebWorkerBridge();
      } else {
        return new ComlinkWebWorkerBridge();
      }
    } else {
      return new WebMainBridge();
    }
  }
}
