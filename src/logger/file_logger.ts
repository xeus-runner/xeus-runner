import type { Logger } from './logger';
import { LogLevel } from './logger';

/**
 * Logger to a file, for node only.
 * Default max log level is LogLevel.Info
 */
export class FileLogger implements Logger {
  constructor(options: FileLoggerOptions) {
    const g = globalThis as any;
    this._fs = g.process.getBuiltinModule('node:fs');
    this._format = g.process.getBuiltinModule('node:util').format;
    this.filename = options.filename;
    this.maxLevel = options.maxLevel ?? LogLevel.Info;
    this._fs.writeFileSync(this.filename, '');
  }

  log(level: LogLevel, ...msg: any[]): void {
    if (level <= this.maxLevel) {
      this._fs.appendFileSync(this.filename, `${this._format(...msg)}\n`);
    }
  }

  readonly filename: string;
  readonly maxLevel: LogLevel;
  private _fs: any;
  private _format: (...msg: any[]) => string;
}

export interface FileLoggerOptions {
  filename: string;
  maxLevel?: LogLevel;
}
