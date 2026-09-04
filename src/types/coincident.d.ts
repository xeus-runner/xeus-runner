interface IMainOptions {
  transform?: any;
  encoder?: any;
  transfer?: boolean;
}

interface IMainReturn {
  Worker: typeof Worker & { proxy: typeof Proxy };
  native: boolean;
  transfer: any;
}

declare module 'coincident/main' {
  export default function coincident(options?: IMainOptions): IMainReturn;
}

declare module 'coincident/window/main' {
  export default function coincident(options?: IMainOptions): IMainReturn;
}

interface IWorkerOptions extends IMainOptions {
  minByteLength?: number;
  maxByteLength?: number;
}

interface IWorkerReturn {
  proxy: any;
  native: boolean;
  transfer: any;
  ffi_timeout: number;
  sync: boolean;
}

interface IWindowWorkerReturn extends IWorkerReturn {
  ffi: any;
  isWindowProxy: any;
  window: Window;
}

declare module 'coincident/worker' {
  export default function coincident(options?: IWorkerOptions): Promise<IWorkerReturn>;
}

declare module 'coincident/window/worker' {
  export default function coincident(options?: IWorkerOptions): Promise<IWindowWorkerReturn>;
}
