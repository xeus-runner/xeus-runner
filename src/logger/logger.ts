/** @category Loggers */
export interface Logger {
  log(level: LogLevel, ...msg: any[]): void;
}

/** @category Loggers */
export enum LogLevel {
  Error,
  Warning,
  Info,
  Debug,
}
