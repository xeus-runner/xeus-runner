export interface Logger {
  log(level: LogLevel, ...msg: any[]): void;
}

export enum LogLevel {
  Error,
  Warning,
  Info,
  Debug,
}
