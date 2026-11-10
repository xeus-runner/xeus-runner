import { ILogger } from './logger';

/**
 * Logger to the console, for both web browser and node.
 */
export class ConsoleLogger implements ILogger {
  constructor(options: ConsoleLogger.IOptions = {}) {
    this.prefix = options.prefix ?? '';
    this.maxLevel = options.maxLevel ?? ILogger.Level.Debug;
  }

  log(level: ILogger.Level, ...msg: any[]): void {
    if (level > this.maxLevel) {
      return;
    }
    switch (level) {
      case ILogger.Level.Error:
        console.error(this.prefix, ...msg);
        break;
      case ILogger.Level.Warning:
        console.warn(this.prefix, ...msg);
        break;
      case ILogger.Level.Info:
        console.info(this.prefix, ...msg);
        break;
      case ILogger.Level.Debug:
        console.debug(this.prefix, ...msg);
        break;
    }
  }

  readonly prefix: string;
  readonly maxLevel: ILogger.Level;
}

export namespace ConsoleLogger {
  export interface IOptions {
    prefix?: string;
    maxLevel?: ILogger.Level;
  }
}
