// Two kernels accessing this at the same time will cause problems.
// Need to check if another kernel is requesting the code mirror resources to avoid doing it twice.

declare const CodeMirror: any;

const CODE_MIRROR_VERSION = '6.65.7';
const CODE_MIRROR_BASE = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODE_MIRROR_VERSION}`;

/**
 * Syntax highlights code in div elements using CodeMirror, loading it from a CDN on first use.
 */
export class CodeMirrorHighlighter {
  /**
   * Highlight the code in a div, if the language is supported. Loads CodeMirror if necessary.
   */
  highlight(div: HTMLDivElement, language: string): void {
    if (!this.supportsLanguage(language)) {
      return;
    }
    this._ready ??= this._init(language);
    // If CodeMirror fails to load, leave the code unhighlighted.
    this._ready.then(
      () => this._applyToDiv(div, language),
      () => {},
    );
  }

  supportsLanguage(language: string): boolean {
    return language !== 'shakespearelang';
  }

  private _applyToDiv(div: HTMLDivElement, language: string): void {
    const CodeMirror = (globalThis as any).CodeMirror;
    div.classList.add('cm-s-default');
    CodeMirror.runMode(div.textContent, getLanguage(language), div, {
      lineNumbers: false,
      theme: 'default',
    });
  }

  private async _init(language: string): Promise<void> {
    language = getLanguage(language);
    await Promise.all([
      loadStylesheet(`${CODE_MIRROR_BASE}/codemirror.min.css`),
      loadScript(`${CODE_MIRROR_BASE}/codemirror.min.js`),
    ]);
    await loadScript(`${CODE_MIRROR_BASE}/addon/runmode/runmode.min.js`);
    await loadScript(`${CODE_MIRROR_BASE}/mode/${language}/${language}.min.js`);
  }

  private _ready?: Promise<void>;
}

function getLanguage(input: string): string {
  input = input.toLowerCase();
  const mapping = new Map<string, string>([
    ['c', 'clike'],
    ['c++', 'clike'],
    ['lfortran', 'fortran'],
    ['sqlite', 'sql'],
    // shakespearelang not supported
  ]);
  return mapping.get(input) ?? input;
}

async function loadScript(url: string): Promise<void> {
  await import(url);
}

// Function to load a stylesheet dynamically
async function loadStylesheet(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
    document.head.appendChild(link);
  });
}
