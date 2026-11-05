export interface ILogger {
  log(level: ILogger.Level, ...msg: any[]): void;
}

export class ConsoleLogger implements ILogger {
  constructor(readonly prefix: string = '') {}

  log(level: ILogger.Level, ...msg: any[]): void {
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
}

export namespace ILogger {
  export enum Level {
    Error,
    Warning,
    Info,
    Debug,
  }

  export type ILogCallback = (level: Level, ...msg: any[]) => void;
}
