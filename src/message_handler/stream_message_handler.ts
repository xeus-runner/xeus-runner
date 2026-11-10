import type { IXeusKernel } from '../defs';
import type { IMessageHandler } from './message_handler';

/**
 * Writes stdout and stderr messages from the kernel to process.stdout and process.stderr as they
 * are received, for node only.
 */
export class StreamMessageHandler implements IMessageHandler {
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

  stderr(_requestId: string, text: string): void {
    process.stderr.write(text);
  }

  async stdin(
    _requestId: string,
    _prompt: string,
    _password: boolean,
  ): Promise<string | undefined> {
    return undefined;
  }

  stdout(_requestId: string, text: string): void {
    process.stdout.write(text);
  }

  toExecuteReturn(_requestId: string): IXeusKernel.IExecuteReturn {
    // Return nothing.
    return {};
  }
}
