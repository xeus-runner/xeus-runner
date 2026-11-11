import { PromiseDelegate } from '@lumino/coreutils';
import { CodeMirrorNs } from '../code_mirror';
import type { IXeusKernel } from '../defs';
import type { IMessageHandler } from './message_handler';

/**
 * Writes messages received from kernel to new div elements added to the DOM.
 */
export class DOMMessageHandler implements IMessageHandler {
  constructor(options: DOMMessageHandler.IOptions) {
    const { targetElement } = options;
    this._targetElement =
      targetElement instanceof Element ? targetElement : document.getElementById(targetElement)!;
    this._cssClassPrefix = options.cssClassPrefix ?? 'xr';
    this._showCode = options.showCode ?? true;
    this._wantCodeMirror = options.useCodeMirror ?? true;
  }

  code(requestId: string, language: string, code: string) {
    if (this._showCode && code.length > 0) {
      const div = this._getOrCreateDiv(
        this._requestIdDiv(requestId),
        `${this._cssClassPrefix}-code`,
        `code-${requestId}`,
      );
      div.textContent += code;

      if (this._wantCodeMirror && CodeMirrorNs.supportsLanguage(language)) {
        if (!this._codeMirrorInitialising) {
          CodeMirrorNs.init(language).then(() => {
            this._codeMirrorInitialising = false;
            this._initCodeMirrorDelegate.resolve();
          });
        }
        this._initCodeMirrorDelegate.promise.then(() => CodeMirrorNs.applyToDiv(div, language));
      }
    }
  }

  html(requestId: string, html: string): boolean {
    if (html.length > 0) {
      const div = this._createDiv(this._requestIdDiv(requestId), `${this._cssClassPrefix}-html`);
      div.innerHTML = html;
      return true;
    }
    return false;
  }

  image(requestId: string, buffer: string): boolean {
    const div = this._createDiv(this._requestIdDiv(requestId), `${this._cssClassPrefix}-image`);
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
        `${this._cssClassPrefix}-stderr`,
        `stderr-${requestId}`,
      );
      div.textContent += text;
    }
  }

  async stdin(requestId: string, prompt: string, password: boolean): Promise<string | undefined> {
    const div = this._createDiv(this._requestIdDiv(requestId), `${this._cssClassPrefix}-stdin`);
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
        `${this._cssClassPrefix}-stdout`,
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
    return this._getOrCreateDiv(this._targetElement, `${this._cssClassPrefix}-execute`, id);
  }

  private readonly _targetElement: Element;
  private readonly _cssClassPrefix: string;
  private readonly _showCode: boolean;
  private readonly _wantCodeMirror: boolean;
  private _codeMirrorInitialising = false;
  private _initCodeMirrorDelegate = new PromiseDelegate<void>();
}

export namespace DOMMessageHandler {
  export interface IOptions {
    /**
     * Target element or its string `id` to add new child divs to.
     */
    targetElement: Element | string;

    /**
     * Prefix for CSS class names of generated `div` elements. Default is `xr`.
     */
    cssClassPrefix?: string;

    /**
     * Whether to show source code that is executed or not. Default is `true`.
     */
    showCode?: boolean;

    /**
     * Whether to use CodeMirror to syntax highlight source code. Ignored if `showCode` is
     * `false`. Default is `true`.
     */
    useCodeMirror?: boolean;
  }
}
