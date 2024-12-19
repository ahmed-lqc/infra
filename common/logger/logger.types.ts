import { Type } from "di-wise";

export interface ILoggerOptions {
  hideFields: string[];
}

export interface ILoggerService {
  setContext(processName: string, context?: Record<string, unknown>): void;
  setLogId(logId: string): void;
  getLogId(): string;
  log(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  debug(message: string, context?: unknown): void;
  verbose(message: string, context?: unknown): void;
}

// Tokens for DI
export const LoggerConfigToken = Type<ILoggerOptions>("LoggerConfig");
export const LoggerServiceToken = Type<ILoggerService>("LoggerService");
