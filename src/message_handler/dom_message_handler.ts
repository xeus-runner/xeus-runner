import { PromiseDelegate } from '@lumino/coreutils';
import { CodeMirrorNs } from '../code_mirror';
import type { IXeusKernel } from '../defs';
import type { IMessageHandler } from './message_handler';

/**
 * Writes messages received from kernel to new div elements added to the DOM.
 */
export class DOMMessageHandler implements IMessageHandler {
  constructor(
    readonly parentElement: Element,
    readonly cssClassPrefix: string,
    readonly showCode: boolean,
    readonly language: string,
  ) {
    this._wantCodeMirror = true;
  }

  code(requestId: string, code: string) {
    if (code.length > 0) {
      const div = this._getOrCreateDiv(
        this._requestIdDiv(requestId),
        `${this.cssClassPrefix}-code`,
        `code-${requestId}`,
      );
      div.textContent += code;

      if (this._wantCodeMirror && CodeMirrorNs.supportsLanguage(this.language)) {
        if (!this._codeMirrorInitialising) {
          CodeMirrorNs.init(this.language).then(() => {
            this._codeMirrorInitialising = false;
            this._initCodeMirrorDelegate.resolve();
          });
        }
        this._initCodeMirrorDelegate.promise.then(() =>
          CodeMirrorNs.applyToDiv(div, this.language),
        );
      }
    }
  }

  html(requestId: string, html: string): boolean {
    if (html.length > 0) {
      const div = this._createDiv(this._requestIdDiv(requestId), `${this.cssClassPrefix}-html`);
      div.innerHTML = html;
      return true;
    }
    return false;
  }

  image(requestId: string, buffer: string): boolean {
    const div = this._createDiv(this._requestIdDiv(requestId), `${this.cssClassPrefix}-image`);
    const image = new Image();
    image.src = buffer;
    div.appendChild(image);
    return true;
  }

  javascript(_requestId: string, jsCode: string): boolean {
    const func = new Function(jsCode);
    func();
    return true;
  }

  stderr(requestId: string, text: string): void {
    if (text.length > 0) {
      const div = this._getOrCreateDiv(
        this._requestIdDiv(requestId),
        `${this.cssClassPrefix}-stderr`,
        `stderr-${requestId}`,
      );
      div.textContent += text;
    }
  }

  async stdin(requestId: string, prompt: string, password: boolean): Promise<string | undefined> {
    const div = this._createDiv(this._requestIdDiv(requestId), `${this.cssClassPrefix}-stdin`);
    if (prompt.length > 0) {
      const promptNode = document.createElement('div');
      promptNode.textContent = prompt;
      div.appendChild(promptNode);
    }
    const input = document.createElement('input');
    if (password) {
      input.type = 'password';
    }
    div.appendChild(input);
    input.focus();

    return new Promise<string | undefined>((resolve) => {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          input.disabled = true;
          resolve(input.value);
        }
      });
    });
  }

  stdout(requestId: string, text: string): void {
    if (text.length > 0) {
      const div = this._getOrCreateDiv(
        this._requestIdDiv(requestId),
        `${this.cssClassPrefix}-stdout`,
        `stdout-${requestId}`,
      );
      div.textContent += text;
    }
  }

  toExecuteReturn(_requestId: string): IXeusKernel.IExecuteReturn {
    // Return nothing.
    return {};
  }

  private _createDiv(parent: Element, className: string, id?: string): HTMLDivElement {
    const div = document.createElement('div');
    div.classList = className;
    if (id !== undefined) {
      div.id = id;
    }
    parent.appendChild(div);
    return div;
  }

  private _getOrCreateDiv(parent: Element, className: string, id: string): HTMLDivElement {
    let element = parent.querySelector(`#${id}`);
    if (!element) {
      element = this._createDiv(parent, className, id);
    }
    return element as HTMLDivElement;
  }

  /**
   * Get or create a div that contains all output for a specific requestId.
   */
  private _requestIdDiv(requestId: string): HTMLDivElement {
    const id = `execute-${requestId}`;
    return this._getOrCreateDiv(this.parentElement, `${this.cssClassPrefix}-execute`, id);
  }

  private _wantCodeMirror: boolean;
  private _codeMirrorInitialising = false;
  private _initCodeMirrorDelegate = new PromiseDelegate<void>();
}
