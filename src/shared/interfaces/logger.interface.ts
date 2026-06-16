export interface ILogger {
  log(tag: string, message: string, context?: any): void;
  error(tag: string, message: string, error?: any): void;
  warn(tag: string, message: string, context?: any): void;
  debug?(tag: string, message: string, context?: any): void;
  verbose?(tag: string, message: string, context?: any): void;
}
