/**
 * Yungul, asili olmayan (dependency-free) leveled logger.
 * Production-da bunu bir log toplayici (meselen Logtail, Axiom) ile
 * evezlemek asandir - butun cagrilar bu tek noqteden kecir.
 */
type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function currentLevel(): LogLevel {
  const fromEnv = (typeof process !== "undefined" ? process.env?.LOG_LEVEL : undefined) as
    | LogLevel
    | undefined;
  return fromEnv && fromEnv in LEVEL_ORDER ? fromEnv : "info";
}

interface LogContext {
  [key: string]: unknown;
  restaurantId?: string;
  userId?: string;
  requestId?: string;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel()];
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  if (!shouldLog(level)) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
};
