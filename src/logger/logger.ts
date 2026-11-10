export interface ILogger {
  log(level: ILogger.Level, ...msg: any[]): void;
}

export namespace ILogger {
  export enum Level {
    Error,
    Warning,
    Info,
    Debug,
  }
}
