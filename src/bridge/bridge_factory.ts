import type { IXeusKernel } from '../defs';
import type { IBridge } from './bridge';
import { CoincidentWebWorkerBridge } from './coincident_web_worker_bridge';
import { WebMainBridge } from './web_main_bridge';

export class BridgeFactory {
  createBridge(options: IXeusKernel.IOptions): IBridge {
    if (options.worker) {
      return new CoincidentWebWorkerBridge();
    } else {
      return new WebMainBridge();
    }
  }
}
