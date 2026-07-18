/**
 * Production monitoring seam.
 * Wire Sentry (or similar) here later — do not import SDKs until configured.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Structured console output — replace with Sentry/Datadog transport later.
  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }
  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    console.info(JSON.stringify(payload));
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      emit("debug", message, context);
    }
  },
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    emit("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    emit("error", message, context);
  },
};

function serializeUnknownError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return {
      message:
        typeof record.message === "string"
          ? record.message
          : JSON.stringify(error),
      code: record.code,
      details: record.details,
      hint: record.hint,
    };
  }

  return { message: String(error) };
}

/** Capture unexpected errors for future Sentry integration. */
export function captureException(
  error: unknown,
  context?: LogContext,
): void {
  const err = serializeUnknownError(error);

  logger.error("Unhandled exception", { ...context, error: err });

  // Sentry-ready hook (no SDK yet):
  // Sentry.captureException(error, { extra: context });
}

export function captureMessage(
  message: string,
  context?: LogContext,
): void {
  logger.info(message, context);
  // Sentry.captureMessage(message, { extra: context });
}
