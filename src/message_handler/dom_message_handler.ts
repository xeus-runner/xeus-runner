import { CodeMirrorHighlighter } from '../code_mirror';
import type { ExecuteReturn, InstallProgress } from '../defs';
import type { MessageHandler } from './message_handler';

/**
 * Writes messages received from kernel to new div elements added to the DOM.
 */
export class DOMMessageHandler implements MessageHandler {
  constructor(options: DOMMessageHandlerOptions) {
    const { targetElement } = options;
    this._targetElement =
      targetElement instanceof Element ? targetElement : document.getElementById(targetElement)!;
    const { progressElement } = options;
    if (progressElement !== undefined) {
      this._progressElement =
        progressElement instanceof Element
          ? progressElement
          : document.getElementById(progressElement)!;
    }
    this._cssClassPrefix = options.cssClassPrefix ?? 'xr';
    this._showCode = options.showCode ?? true;
    this._codeMirror =
      this._showCode && (options.useCodeMirror ?? true) ? new CodeMirrorHighlighter() : undefined;
  }

  code(requestId: string, language: string, code: string) {
    if (this._showCode && code.length > 0) {
      const div = this._getOrCreateDiv(
        this._requestIdDiv(requestId),
        `${this._cssClassPrefix}-code`,
        `code-${requestId}`,
      );
      div.textContent += code;
      this._codeMirror?.highlight(div, language);
    }
  }

  mimeBundle(requestId: string, data: { [mimeType: string]: unknown }): boolean {
    // Only process one of the data types.
    const js = data['application/javascript'];
    if (typeof js === 'string') {
      new Function(js)();
      return true;
    }
    const html = data['text/html'];
    if (typeof html === 'string' && html.length > 0) {
      const div = this._createDiv(this._requestIdDiv(requestId), `${this._cssClassPrefix}-html`);
      div.innerHTML = html;
      return true;
    }
    const png = data['image/png'];
    if (typeof png === 'string') {
      const div = this._createDiv(this._requestIdDiv(requestId), `${this._cssClassPrefix}-image`);
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      div.appendChild(image);
      return true;
    }
    return false;
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

  progress(progress: InstallProgress): void {
    if (this._progressElement === undefined) {
      return;
    }
    if (this._progressBar === undefined) {
      this._progressBar = document.createElement('progress');
      this._progressBar.max = 1;
      this._progressBar.className = `${this._cssClassPrefix}-progress`;
      this._progressMessage = document.createElement('span');
      this._progressMessage.className = `${this._cssClassPrefix}-progress-message`;
      this._progressElement.append(this._progressBar, this._progressMessage);
    }
    this._progressBar.value = progress.fraction;
    this._progressMessage!.textContent = progress.message;
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

  toExecuteReturn(_requestId: string): ExecuteReturn {
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
  private readonly _progressElement?: Element;
  private _progressBar?: HTMLProgressElement;
  private _progressMessage?: HTMLSpanElement;
  private readonly _cssClassPrefix: string;
  private readonly _showCode: boolean;
  private readonly _codeMirror?: CodeMirrorHighlighter;
}

export interface DOMMessageHandlerOptions {
  /**
   * Target element or its string `id` to add new child divs to.
   */
  targetElement: Element | string;

  /**
   * Element or its string `id` to show kernel installation progress in. Default is no progress
   * shown.
   */
  progressElement?: Element | string;

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
