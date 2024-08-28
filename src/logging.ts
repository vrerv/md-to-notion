import { assertNever } from "./utils"

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface Logger {
  (level: LogLevel, message: string, extraInfo?: Record<string, unknown>): void
}

export function makeConsoleLogger(name = "default", options = {
  inspectOptions: {
    depth:null,
  },
  stdout:process.stdout,
  stderr:process.stderr,
}): Logger {
  return (level, message, extraInfo) => {
    const logger = new console.Console(options)
    logger[level](`${name} ${level}:`, message, extraInfo ? extraInfo : "")
  }
}

/**
 * Transforms a log level into a comparable (numerical) value ordered by severity.
 */
export function logLevelSeverity(level: LogLevel): number {
  switch (level) {
    case LogLevel.DEBUG:
      return 20
    case LogLevel.INFO:
      return 40
    case LogLevel.WARN:
      return 60
    case LogLevel.ERROR:
      return 80
    default:
      return assertNever(level)
  }
}
