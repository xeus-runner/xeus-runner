import type { InstallProgress } from '../defs';
import { BaseMessageHandler } from './base_message_handler';

/**
 * Writes stdout and stderr messages from the kernel to process.stdout and process.stderr as they
 * are received, and optionally shows kernel installation progress on process.stdout, for node only.
 *
 * @category Message handlers
 */
export class TerminalMessageHandler extends BaseMessageHandler {
  constructor(options: TerminalMessageHandlerOptions = {}) {
    super();
    this._showProgress = options.showProgress ?? false;
  }

  progress(progress: InstallProgress): void {
    if (!this._showProgress) {
      return;
    }
    const { fraction, message } = progress;
    const width = 30;
    const n = Math.round(fraction * width);
    const percent = Math.round(fraction * 100)
      .toString()
      .padStart(3);
    const line = `${'█'.repeat(n)}${'░'.repeat(width - n)} ${percent}% ${message}`;
    if (process.stdout.isTTY) {
      process.stdout.write(`\r${line}\x1b[K${fraction >= 1 ? '\n' : ''}`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  }

  stderr(_requestId: string, text: string): void {
    process.stderr.write(text);
  }

  stdout(_requestId: string, text: string): void {
    process.stdout.write(text);
  }

  private readonly _showProgress: boolean;
}

/** @category Message handlers */
export interface TerminalMessageHandlerOptions {
  /**
   * Whether to show kernel installation progress on process.stdout. Default is `false`.
   */
  showProgress?: boolean;
}
