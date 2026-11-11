import type { ILock } from '@emscripten-forge/mambajs';
import type { KernelMessage } from '@jupyterlab/services';
import { PromiseDelegate, UUID } from '@lumino/coreutils';
import type { ISignal } from '@lumino/signaling';
import { Signal } from '@lumino/signaling';
import type { IBridge } from './bridge';
import { BridgeFactory } from './bridge';
import type { IXeusKernel } from './defs';
import type { IXeusKernelImplOptions } from './impl';
import type { IKernelType } from './kernel_type';
import { createKernelType } from './kernel_type';
import { ConsoleLogger, ILogger } from './logger';
import type { IMessageHandler } from './message_handler';
import { TextMessageHandler } from './message_handler';
import { isNode, removeAnsiEscapeCodes } from './utils';

export class XeusKernel implements IXeusKernel {
  constructor(options: IXeusKernel.IOptions) {
    const { logger, messageHandler, type, worker } = options;
    this._isWorker = worker ?? false;

    this._logger =
      logger ??
      (isNode() ? undefined : new ConsoleLogger({ prefix: '>>>', maxLevel: ILogger.Level.Debug }));

    this._log(ILogger.Level.Debug, 'XeusKernel isWorker', this._isWorker);
    this._log(
      ILogger.Level.Debug,
      'XeusKernel crossOriginIsolated',
      globalThis.crossOriginIsolated,
    );

    this._kernelType = typeof type === 'string' ? createKernelType(type) : type;
    this._messageHandler = messageHandler ?? new TextMessageHandler();
    this._bridge = this.createBridge(options);
    this.initialize(options); // Will set ready when done.
  }

  protected createBridge(options: IXeusKernel.IOptions): IBridge {
    return new BridgeFactory().createBridge(options);
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
    const { channels, envLock, packages, pipPackages, platform } = options;

    if (envLock !== undefined) {
      if (options.channels !== undefined) {
        this._log(ILogger.Level.Warning, "Ignoring 'channels' as using 'envLock'");
      }
      if (options.packages !== undefined) {
        this._log(ILogger.Level.Warning, "Ignoring 'packages' as using 'envLock'");
      }
      if (options.pipPackages !== undefined) {
        this._log(ILogger.Level.Warning, "Ignoring 'pipPackages' as using 'envLock'");
      }
      if (options.platform !== undefined) {
        this._log(ILogger.Level.Warning, "Ignoring 'platform' as using 'envLock'");
      }
    }

    const implOptions: IXeusKernelImplOptions = {
      kernelType: this._kernelType,
      envLock,
      channels,
      packages,
      pipPackages,
      platform,
      baseUrl: '',
      untarjsBaseUrl: options.untarjsBaseUrl ?? import.meta.url,
      kernelId: 'unique',
      mountDrive: false,
      kernelSpec: undefined, // This is completed in the impl when the env is solved and loaded.
      browsingContextId: '',
      log: this._logger !== undefined,
    };
    this._bridge
      .initialize(implOptions, this.receiveMessage.bind(this), this._onError.bind(this))
      .then(this._ready.resolve.bind(this._ready), this._onError.bind(this));
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
    if (msg?.log !== undefined) {
      this._log(...(msg.log as [ILogger.Level, ...any[]]));
      return;
    }

    // Don't like using lastParentMsgId, but _stream messages do not have a parent_header.
    const requestId: string | undefined = msg.parent_header?.msg_id ?? this._latestRequestId;
    this._log(ILogger.Level.Debug, 'processWorkerMessage', msg, requestId);
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
          messageHandler.code(requestId, this._kernelType.language, content.code);
        } else if (msgType === 'display_data' || msgType === 'execute_result') {
          const { data } = content; // data is an nbformat.IMimeBundle
          let handled = false;
          // Only process one of the data types. Might be better if messageHandler advertises what
          // it accepts.
          if (!handled && 'application/javascript' in data) {
            handled = messageHandler.javascript(requestId, data['application/javascript']);
          }
          if (!handled && 'text/html' in data) {
            handled = messageHandler.html(requestId, data['text/html']);
          }
          if (!handled && 'image/png' in data) {
            const buffer = `data:image/png;base64,${data['image/png']}`;
            handled = messageHandler.image(requestId, buffer);
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

    if (channel === 'stdin') {
      this._handleStdin(msg);
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
      await this._bridge.sendMessage({ msg });
    } else {
      const { msg_id } = msg.header;
      const executeDelegate = new PromiseDelegate<void>();
      this._executeDelegates.set(msg_id, executeDelegate);
      await this._bridge.sendMessage({ msg });
      await executeDelegate.promise;
    }
  }

  private async _handleStdin(inputRequest: KernelMessage.IInputRequestMsg): Promise<void> {
    const requestId = inputRequest.parent_header?.msg_id;
    const { password, prompt } = inputRequest.content;
    const value = await this._messageHandler.stdin(requestId, prompt, password);

    const content: KernelMessage.IInputReply | KernelMessage.IReplyAbortContent =
      value !== undefined ? { status: 'ok', value } : { status: 'abort' };

    const { header } = inputRequest;
    const reply: KernelMessage.IInputReplyMsg = {
      parent_header: header,
      content: content,
      channel: 'stdin',
      header: {
        date: '',
        msg_id: UUID.uuid4(),
        msg_type: 'input_reply',
        session: header.session,
        username: header.username,
        version: header.version,
      },
      metadata: {},
      buffers: [],
    };
    // Send input_reply message to kernel implementation in normal way.
    this.sendMessage(reply);
  }

  private _log(level: ILogger.Level, ...msg: any[]): void {
    if (this._logger !== undefined) {
      this._logger.log(level, ...msg);
    }
  }

  private _onError(err: Error): void {
    this._log(ILogger.Level.Error, err);
    this._ready.reject(err);
    for (const executeDelegate of this._executeDelegates.values()) {
      executeDelegate.reject(err);
    }
    this._executeDelegates.clear();
  }

  private _nextRequestId(): string {
    this._requestIndex++;
    return `${this._requestIndex}`;
  }

  private _kernelType: IKernelType;
  private _logger?: ILogger;

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
