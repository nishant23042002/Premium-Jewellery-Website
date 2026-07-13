/**
 * Single choke point for server-side diagnostic logging. Replaces scattered
 * console.* calls with timestamped, JSON-structured output so failures are
 * greppable and taggable by call site. No external service required today —
 * swapping in Sentry/Datadog later means editing the `write` function here,
 * not every call site.
 *
 * Deliberately NOT guarded with `import "server-only"` — unlike modules that
 * touch secrets/env, this is just a console wrapper with nothing unsafe to
 * leak into a client bundle, and standalone Node scripts (scripts/seed-*.ts)
 * import it transitively via connectToDatabase() outside of Next's build,
 * where the server-only guard throws even though the usage is legitimate.
 */
type LogLevel = "info" | "warn" | "error";

interface LogMeta {
  [key: string]: unknown;
}

function serializeMeta(meta?: LogMeta) {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    out[key] =
      value instanceof Error
        ? { message: value.message, stack: value.stack }
        : value;
  }
  return out;
}

function write(level: LogLevel, tag: string, message: string, meta?: LogMeta) {
  const entry = {
    time: new Date().toISOString(),
    level,
    tag,
    message,
    ...serializeMeta(meta),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (tag: string, message: string, meta?: LogMeta) =>
    write("info", tag, message, meta),
  warn: (tag: string, message: string, meta?: LogMeta) =>
    write("warn", tag, message, meta),
  error: (tag: string, message: string, meta?: LogMeta) =>
    write("error", tag, message, meta),
};
