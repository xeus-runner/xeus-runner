import type { ILock } from '@emscripten-forge/mambajs';
import type { KernelMessage } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { type ISignal, Signal } from '@lumino/signaling';
import { CoincidentWorkerBridge, type IBridge, MainBridge } from './bridge';
import type { IXeusKernel } from './defs';
import type { IXeusKernelImplOptions } from './impl';
import { createKernelType, type IKernelType } from './kernel_type';
import { DOMMessageHandler, type IMessageHandler, TextMessageHandler } from './message_handler';
import { removeAnsiEscapeCodes } from './utils';

export class XeusKernel implements IXeusKernel {
  constructor(options: IXeusKernel.IOptions) {
    const { cssClassPrefix, parentElement, showCode, type, worker } = options;
    this._isWorker = worker ?? false;

    console.debug('==> XeusKernel isWorker', this._isWorker);
    console.debug('==> XeusKernel crossOriginIsolated', globalThis.crossOriginIsolated);

    this._kernelType = typeof type === 'string' ? createKernelType(type) : type;

    if (parentElement !== undefined) {
      if (parentElement instanceof Element) {
        this._parentElement = parentElement;
      } else {
        this._parentElement = document.getElementById(parentElement) ?? undefined;
      }
    }
    this._cssClassPrefix = cssClassPrefix ?? 'xr';
    this._showCode = showCode ?? false;

    this._messageHandler = this.createMessageHandler();

    this._bridge = this.createBridge(options);
    this.initialize(options); // Will set ready when done.
  }

  protected createBridge(options: IXeusKernel.IOptions): IBridge {
    if (options.worker) {
      return new CoincidentWorkerBridge();
    } else {
      return new MainBridge();
    }
  }

  protected createMessageHandler(): IMessageHandler {
    if (this._parentElement === undefined) {
      return new TextMessageHandler();
    } else {
      return new DOMMessageHandler(this._parentElement, this._cssClassPrefix, this._showCode);
    }
  }

  get disposed(): ISignal<this, void> {
    return this._disposed;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._bridge.dispose();
    this._isDisposed = true;
    this._disposed.emit(void 0);
  }

  async envLock(): Promise<ILock | undefined> {
    await this.ready;
    return await this._bridge.envLock();
  }

  async execute(options: IXeusKernel.IExecuteOptions): Promise<IXeusKernel.IExecuteReturn> {
    const requestId = this._nextRequestId();

    const msg: KernelMessage.IExecuteRequestMsg = {
      channel: 'shell',
      content: {
        code: options.code,
      },
      header: {
        msg_type: 'execute_request',
        msg_id: requestId,
        session: '',
        username: '',
        version: '5.0',
        date: '',
      },
      parent_header: {},
      metadata: {},
      buffers: [],
    };
    await this.sendMessage(msg);

    return this._messageHandler.toExecuteReturn(requestId);
  }

  protected async initialize(options: IXeusKernel.IOptions) {
    const { channels, envLock, packages, untarjsBaseUrl } = options;

    if (envLock !== undefined) {
      if (options.channels !== undefined) {
        console.warn("Ignoring 'channels' as using 'envLock'");
      }
      if (options.packages !== undefined) {
        console.warn("Ignoring 'packages' as using 'envLock'");
      }
    }

    const implOptions: IXeusKernelImplOptions = {
      kernelType: this._kernelType,
      envLock,
      channels,
      packages,
      baseUrl: '',
      untarjsBaseUrl,
      kernelId: 'unique',
      mountDrive: false,
      kernelSpec: undefined, // This is completed in the impl when the env is solved and loaded.
      browsingContextId: '',
    };
    this._bridge
      .initialize(implOptions, this.receiveMessage.bind(this))
      .then(this._ready.resolve.bind(this._ready));
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  get isWorker(): boolean {
    return this._isWorker;
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * Process message received from kernel implementation.
   */
  protected receiveMessage(msg: any) {
    // Don't like using lastParentMsgId, but _stream messages do not have a parent_header.
    const requestId: string | undefined = msg.parent_header?.msg_id ?? this._latestRequestId;
    console.debug('==> processWorkerMessage', msg, requestId);
    const { channel, content, header } = msg;
    const msgType = header?.msg_type;
    const messageHandler = this._messageHandler;

    if (requestId !== undefined) {
      if (channel === 'iopub') {
        if (msgType === 'stream' && content.text) {
          // Might need to be more careful checking message properties.
          if (content.name === 'stdout') {
            messageHandler.stdout(requestId, content.text);
          } else {
            messageHandler.stderr(requestId, content.text);
          }
        } else if (msgType === 'execute_input' && content.code) {
          messageHandler.code(requestId, content.code);
        } else if (msgType === 'display_data' || msgType === 'execute_result') {
          const { data } = content; // data is an nbformat.IMimeBundle
          let handled = false;
          // Only process one of the data types. Might be better if messageHandler advertises what
          // it accepts.
          if (!handled && 'text/html' in data) {
            handled = messageHandler.html(requestId, data['text/html']);
          }
          if (!handled && 'text/plain' in data) {
            // Could be text/html too.
            const text = data['text/plain'];
            messageHandler.stdout(requestId, text);
          }
        } else if (msgType === 'error') {
          const { ename, evalue, traceback } = content;
          if (ename !== undefined) {
            messageHandler.stderr(requestId, `${ename}\n`);
          }
          if (evalue !== undefined) {
            messageHandler.stderr(requestId, `${evalue}\n`);
          }
          if (traceback !== undefined) {
            messageHandler.stderr(
              requestId,
              traceback.map((text: string) => removeAnsiEscapeCodes(text)).join('\n'),
            );
          }
        }
      } else if (channel === undefined && '_stream' in msg) {
        const content = msg._stream;
        if (content.text) {
          if (content.name === 'stdout') {
            messageHandler.stdout(requestId, content.text);
          } else {
            messageHandler.stderr(requestId, content.text);
          }
        }
      }
    }

    if (msgType === 'status') {
      if (content.execution_state === 'busy') {
        this._latestRequestId = requestId;
      } else if (content.execution_state === 'idle' && requestId !== undefined) {
        const executeDelegate = this._executeDelegates.get(requestId);
        if (executeDelegate !== undefined) {
          executeDelegate.resolve();
          this._executeDelegates.delete(requestId);
        }
        // Reset _latestParentMsgId?
      }
    }
  }

  /**
   * Send message to kernel implementation.
   */
  protected async sendMessage(msg: KernelMessage.IMessage): Promise<void> {
    await this.ready;

    if (msg.header.msg_type === 'input_reply') {
      // Not implemented.
    } else {
      const { msg_id } = msg.header;
      const executeDelegate = new PromiseDelegate<void>();
      this._executeDelegates.set(msg_id, executeDelegate);
      await this._bridge.sendMessage({ msg });
      await executeDelegate.promise;
    }
  }

  private _nextRequestId(): string {
    this._requestIndex++;
    return `${this._requestIndex}`;
  }

  private _kernelType: IKernelType;
  private _parentElement?: Element;
  private _cssClassPrefix: string;
  private _showCode: boolean;

  private _isDisposed = false;
  private _isWorker: boolean;
  private _disposed = new Signal<this, void>(this);
  private _ready = new PromiseDelegate<void>();
  private _bridge: IBridge;

  private _executeDelegates: Map<string, PromiseDelegate<void>> = new Map();
  private _requestIndex = -1; // Last request index used.
  private _latestRequestId?: string;
  private _messageHandler: IMessageHandler;
}
