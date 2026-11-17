interface CoincidentMainOptions {
  transform?: any;
  encoder?: any;
  transfer?: boolean;
}

interface CoincidentMainReturn {
  Worker: typeof Worker & { proxy: typeof Proxy };
  native: boolean;
  transfer: any;
}

declare module 'coincident/main' {
  export default function coincident(options?: CoincidentMainOptions): CoincidentMainReturn;
}

declare module 'coincident/window/main' {
  export default function coincident(options?: CoincidentMainOptions): CoincidentMainReturn;
}

interface CoincidentWorkerOptions extends CoincidentMainOptions {
  minByteLength?: number;
  maxByteLength?: number;
}

interface CoincidentWorkerReturn {
  proxy: any;
  native: boolean;
  transfer: any;
  ffi_timeout: number;
  sync: boolean;
}

interface CoincidentWindowWorkerReturn extends CoincidentWorkerReturn {
  ffi: any;
  isWindowProxy: any;
  window: Window;
}

declare module 'coincident/worker' {
  export default function coincident(
    options?: CoincidentWorkerOptions,
  ): Promise<CoincidentWorkerReturn>;
}

declare module 'coincident/window/worker' {
  export default function coincident(
    options?: CoincidentWorkerOptions,
  ): Promise<CoincidentWindowWorkerReturn>;
}
