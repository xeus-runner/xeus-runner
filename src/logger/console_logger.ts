import type { Logger } from './logger';
import { LogLevel } from './logger';

/**
 * Logger to the console, for both web browser and node.
 * Default max log level is LogLevel.Info
 */
export class ConsoleLogger implements Logger {
  constructor(options: ConsoleLoggerOptions = {}) {
    this.prefix = options.prefix ?? '';
    this.maxLevel = options.maxLevel ?? LogLevel.Info;
  }

  log(level: LogLevel, ...msg: any[]): void {
    if (level > this.maxLevel) {
      return;
    }
    switch (level) {
      case LogLevel.Error:
        console.error(this.prefix, ...msg);
        break;
      case LogLevel.Warning:
        console.warn(this.prefix, ...msg);
        break;
      case LogLevel.Info:
        console.info(this.prefix, ...msg);
        break;
      case LogLevel.Debug:
        console.debug(this.prefix, ...msg);
        break;
    }
  }

  readonly prefix: string;
  readonly maxLevel: LogLevel;
}

export interface ConsoleLoggerOptions {
  prefix?: string;
  maxLevel?: LogLevel;
}
