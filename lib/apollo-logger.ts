type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function resolveLevel(): LogLevel {
  const envLevel = process.env.APOLLO_LOG_LEVEL as
    | LogLevel
    | undefined;
  if (envLevel && envLevel in LEVEL_PRIORITY) return envLevel;

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const currentLevel = resolveLevel();

function formatData(data?: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return '';
  return (
    ' ' +
    Object.entries(data)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ')
  );
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

function log(
  level: LogLevel,
  event: string,
  data?: Record<string, unknown>
) {
  if (!shouldLog(level)) return;

  const tag = `[apollo] ${level.padEnd(5)} ${event}`;
  const suffix = formatData(data);
  const output = `${tag}${suffix}`;

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export const apolloLogger = {
  debug(event: string, data?: Record<string, unknown>) {
    log('debug', event, data);
  },
  info(event: string, data?: Record<string, unknown>) {
    log('info', event, data);
  },
  warn(event: string, data?: Record<string, unknown>) {
    log('warn', event, data);
  },
  error(event: string, data?: Record<string, unknown>) {
    log('error', event, data);
  },
};
