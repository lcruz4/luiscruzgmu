enum LogLevel {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
}

const LOG_LEVELS: Record<string, LogLevel> = {
  TRACE: LogLevel.TRACE,
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR,
  FATAL: LogLevel.FATAL,
};

const levels = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
}

const logColors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  [LogLevel.TRACE]: '\x1b[90m', // Gray
  [LogLevel.DEBUG]: '\x1b[34m', // Blue
  [LogLevel.INFO]: '\x1b[32m', // Green
  [LogLevel.WARN]: '\x1b[33m', // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  [LogLevel.FATAL]: '\x1b[35m', // Magenta
};

const baseLogger = (level: LogLevel, ...args: unknown[]) => {
  if (level < (LOG_LEVELS[process.env.LOG_LEVEL ?? 'INFO'])) {
    return;
  }
  if (process.env.NODE_ENV === 'production' && level < LogLevel.WARN) {
    return;
  }
  const color = logColors[level];
  const reset = logColors.reset;
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const now = new Date();
  const timestamp = formatter.format(now);
  let logColor = logColors.cyan;

  if (level >= LogLevel.WARN) {
    logColor = logColors[level];
  }

  let logString = `[${timestamp}] ${color}${levels[level]}${reset}: ${logColor}`;
  console.log(logString, ...args, reset);
};

export const logger = {
  trace: (...args: unknown[]) => baseLogger(LogLevel.TRACE, ...args),
  debug: (...args: unknown[]) => baseLogger(LogLevel.DEBUG, ...args),
  info: (...args: unknown[]) => baseLogger(LogLevel.INFO, ...args),
  warn: (...args: unknown[]) => baseLogger(LogLevel.WARN, ...args),
  error: (...args: unknown[]) => baseLogger(LogLevel.ERROR, ...args),
  fatal: (...args: unknown[]) => baseLogger(LogLevel.FATAL, ...args),
};
