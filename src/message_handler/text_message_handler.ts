import type { IXeusKernel } from '../defs';
import type { IMessageHandler } from './message_handler';

/**
 * Handles text-only messages from the kernel, returning then via `toExecuteReturn`.
 */
export class TextMessageHandler implements IMessageHandler {
  code(_requestId: string, _code: string) {}

  html(_requestId: string, _html: string): boolean {
    return false;
  }

  image(_requestId: string, _buffer: string): boolean {
    return false;
  }

  javascript(_requestId: string, _jsCode: string): boolean {
    return false;
  }

  stderr(requestId: string, text: string): void {
    if (text.length > 0) {
      const prev = this._stderrs.get(requestId);
      if (prev !== undefined) {
        text = prev + text;
      }
      this._stderrs.set(requestId, text);
    }
  }

  async stdin(
    _requestId: string,
    _prompt: string,
    _password: boolean,
  ): Promise<string | undefined> {
    return undefined;
  }

  stdout(requestId: string, text: string): void {
    if (text.length > 0) {
      const prev = this._stdouts.get(requestId);
      if (prev !== undefined) {
        text = prev + text;
      }
      this._stdouts.set(requestId, text);
    }
  }

  toExecuteReturn(requestId: string): IXeusKernel.IExecuteReturn {
    const stderr = this._stderrs.get(requestId);
    this._stderrs.delete(requestId);

    const stdout = this._stdouts.get(requestId);
    this._stdouts.delete(requestId);

    return { stderr, stdout };
  }

  private _stderrs = new Map<string, string>();
  private _stdouts = new Map<string, string>();
}
