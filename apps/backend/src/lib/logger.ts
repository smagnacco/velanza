const API_KEY_REDACT_PATTERNS = [
  /sk-ant-[A-Za-z0-9\-_]{10,}/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /AIza[A-Za-z0-9\-_]{35,}/g,
  /ya29\.[A-Za-z0-9\-_]{20,}/g,
];

function redact(value: string): string {
  let result = value;
  for (const pattern of API_KEY_REDACT_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

function serialize(value: unknown): string {
  if (typeof value === 'string') return redact(value);
  if (value instanceof Error) return redact(`${value.message}\n${value.stack ?? ''}`);
  try {
    return redact(JSON.stringify(value));
  } catch {
    return '[unserializable]';
  }
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };

function getConfiguredLevel(): LogLevel {
  const level = process.env['LOG_LEVEL'] ?? 'info';
  if (level in LEVELS) return level as LogLevel;
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] <= LEVELS[getConfiguredLevel()];
}

function log(level: LogLevel, message: string, context?: unknown): void {
  if (!shouldLog(level)) return;
  const timestamp = new Date().toISOString();
  const contextStr = context !== undefined ? ` ${serialize(context)}` : '';
  const line = `[${timestamp}] ${level.toUpperCase()} ${redact(message)}${contextStr}`;
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  error: (message: string, context?: unknown) => log('error', message, context),
  warn: (message: string, context?: unknown) => log('warn', message, context),
  info: (message: string, context?: unknown) => log('info', message, context),
  debug: (message: string, context?: unknown) => log('debug', message, context),
};
