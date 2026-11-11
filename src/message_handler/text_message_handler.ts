import type { IXeusKernel } from '../defs';
import { BaseMessageHandler } from './base_message_handler';

/**
 * Handles text-only messages from the kernel, returning then via `toExecuteReturn`.
 */
export class TextMessageHandler extends BaseMessageHandler {
  stderr(requestId: string, text: string): void {
    if (text.length > 0) {
      const prev = this._stderrs.get(requestId);
      if (prev !== undefined) {
        text = prev + text;
      }
      this._stderrs.set(requestId, text);
    }
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
