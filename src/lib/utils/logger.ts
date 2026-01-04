/**
 * Утилита для логирования с поддержкой окружений
 */

type LogLevel = "log" | "warn" | "error" | "info" | "debug";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Безопасное логирование - только в development режиме
 */
function safeLog(level: LogLevel, ...args: unknown[]): void {
  if (!isDevelopment) {
    return;
  }

  // В production можно интегрировать с сервисом логирования (Sentry, LogRocket и т.д.)
  switch (level) {
    case "error":
      console.error(...args);
      break;
    case "warn":
      console.warn(...args);
      break;
    case "info":
      console.info(...args);
      break;
    case "debug":
      console.debug(...args);
      break;
    default:
      console.log(...args);
  }
}

/**
 * Логгер для использования в приложении
 */
export const logger = {
  log: (...args: unknown[]) => safeLog("log", ...args),
  info: (...args: unknown[]) => safeLog("info", ...args),
  warn: (...args: unknown[]) => safeLog("warn", ...args),
  error: (...args: unknown[]) => safeLog("error", ...args),
  debug: (...args: unknown[]) => safeLog("debug", ...args),
};
