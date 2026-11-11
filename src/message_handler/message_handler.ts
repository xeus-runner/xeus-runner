import type { IXeusKernel } from '../defs';

/**
 * Handles messages received from a kernel, in a simpler format that the full Jupyter messaging
 * protocol.
 */
export interface IMessageHandler {
  code(requestId: string, language: string, code: string): void;
  html(requestId: string, html: string): boolean;
  image(requestId: string, buffer: string): boolean; // Assumes PNG, need to do more than this.
  javascript(requestId: string, jsCode: string): boolean;
  stderr(requestId: string, text: string): void;
  stdin(requestId: string, prompt: string, password: boolean): Promise<string | undefined>;
  stdout(requestId: string, text: string): void;
  toExecuteReturn(requestId: string): IXeusKernel.IExecuteReturn;
}
