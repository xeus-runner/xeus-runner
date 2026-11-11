import type { IXeusKernel } from '../defs';
import type { IMessageHandler } from './message_handler';

/**
 * Base class for message handlers. Methods other than stderr and stdout do nothing, so subclasses
 * only need to override the ones they care about.
 */
export abstract class BaseMessageHandler implements IMessageHandler {
  code(_requestId: string, _language: string, _code: string): void {}

  html(_requestId: string, _html: string): boolean {
    return false;
  }

  image(_requestId: string, _buffer: string): boolean {
    return false;
  }

  javascript(_requestId: string, _jsCode: string): boolean {
    return false;
  }

  abstract stderr(requestId: string, text: string): void;

  async stdin(
    _requestId: string,
    _prompt: string,
    _password: boolean,
  ): Promise<string | undefined> {
    return undefined;
  }

  abstract stdout(requestId: string, text: string): void;

  toExecuteReturn(_requestId: string): IXeusKernel.IExecuteReturn {
    return {};
  }
}
