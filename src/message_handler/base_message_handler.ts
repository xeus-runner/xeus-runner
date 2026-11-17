import type { ExecuteReturn, InstallProgress } from '../defs';
import type { MessageHandler } from './message_handler';

/**
 * Base class for message handlers. Methods other than stderr and stdout do nothing, so subclasses
 * only need to override the ones they care about.
 *
 * @category Message handlers
 */
export abstract class BaseMessageHandler implements MessageHandler {
  code(_requestId: string, _language: string, _code: string): void {}

  mimeBundle(_requestId: string, _data: { [mimeType: string]: unknown }): boolean {
    return false;
  }

  progress(_progress: InstallProgress): void {}

  abstract stderr(requestId: string, text: string): void;

  async stdin(
    _requestId: string,
    _prompt: string,
    _password: boolean,
  ): Promise<string | undefined> {
    return undefined;
  }

  abstract stdout(requestId: string, text: string): void;

  toExecuteReturn(_requestId: string): ExecuteReturn {
    return {};
  }
}
