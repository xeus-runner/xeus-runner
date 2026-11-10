import { ILogger } from './logger';

/**
 * Logger to a file, for node only.
 */
export class FileLogger implements ILogger {
  constructor(options: FileLogger.IOptions) {
    const g = globalThis as any;
    this._fs = g.process.getBuiltinModule('node:fs');
    this._format = g.process.getBuiltinModule('node:util').format;
    this.filename = options.filename;
    this.maxLevel = options.maxLevel ?? ILogger.Level.Debug;
    this._fs.writeFileSync(this.filename, '');
  }

  log(level: ILogger.Level, ...msg: any[]): void {
    if (level <= this.maxLevel) {
      this._fs.appendFileSync(this.filename, `${this._format(...msg)}\n`);
    }
  }

  readonly filename: string;
  readonly maxLevel: ILogger.Level;
  private _fs: any;
  private _format: (...msg: any[]) => string;
}

export namespace FileLogger {
  export interface IOptions {
    filename: string;
    maxLevel?: ILogger.Level;
  }
}
