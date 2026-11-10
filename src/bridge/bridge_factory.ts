import type { IXeusKernel } from '../defs';
import { isNode } from '../utils';
import type { IBridge } from './bridge';
import { CoincidentWebWorkerBridge } from './coincident_web_worker_bridge';
import { ComlinkWebWorkerBridge } from './comlink_web_worker_bridge';
import { NodeMainBridge } from './node_main_bridge';
import { NodeWorkerBridge } from './node_worker_bridge';
import { WebMainBridge } from './web_main_bridge';

export class BridgeFactory {
  createBridge(options: IXeusKernel.IOptions): IBridge {
    if (isNode()) {
      if (options.worker) {
        return new NodeWorkerBridge();
      } else {
        return new NodeMainBridge();
      }
    } else {
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
}
