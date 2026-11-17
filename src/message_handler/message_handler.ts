import type { ExecuteReturn, InstallProgress } from '../defs';

/**
 * Handles messages received from a kernel, in a simpler format that the full Jupyter messaging
 * protocol.
 *
 * @category Message handlers
 */
export interface MessageHandler {
  code(requestId: string, language: string, code: string): void;

  /**
   * Handle the MIME bundle of a display_data, update_display_data or execute_result message.
   * Return true if handled.
   */
  mimeBundle(requestId: string, data: { [mimeType: string]: unknown }): boolean;

  progress(progress: InstallProgress): void;

  stderr(requestId: string, text: string): void;

  stdin(requestId: string, prompt: string, password: boolean): Promise<string | undefined>;

  stdout(requestId: string, text: string): void;

  toExecuteReturn(requestId: string): ExecuteReturn;
}
