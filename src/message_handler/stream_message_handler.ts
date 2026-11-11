import { BaseMessageHandler } from './base_message_handler';

/**
 * Writes stdout and stderr messages from the kernel to process.stdout and process.stderr as they
 * are received, for node only.
 */
export class StreamMessageHandler extends BaseMessageHandler {
  stderr(_requestId: string, text: string): void {
    process.stderr.write(text);
  }

  stdout(_requestId: string, text: string): void {
    process.stdout.write(text);
  }
}
