type LogLevel = "info" | "warn" | "error"

type LogPayload = Record<string, unknown>

function log(level: LogLevel, message: string, payload?: LogPayload) {
  const base = {
    level,
    message,
    timestamp: new Date().toISOString(),
  }

  const output = payload ? { ...base, ...payload } : base

  if (level === "error") {
    console.error(JSON.stringify(output))
  } else if (level === "warn") {
    console.warn(JSON.stringify(output))
  } else {
    console.log(JSON.stringify(output))
  }
}

export const logger = {
  info: (message: string, payload?: LogPayload) =>
    log("info", message, payload),

  warn: (message: string, payload?: LogPayload) =>
    log("warn", message, payload),

  error: (message: string, payload?: LogPayload) =>
    log("error", message, payload),
}