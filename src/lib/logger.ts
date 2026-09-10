type LogData = Record<string, unknown>;

/** Lightweight namespaced logger for browser console diagnostics. */
export const logger = {
  debug(scope: string, message: string, data?: LogData): void {
    console.debug(`[osint-fusion:${scope}]`, message, data ?? '');
  },

  info(scope: string, message: string, data?: LogData): void {
    console.info(`[osint-fusion:${scope}]`, message, data ?? '');
  },

  warn(scope: string, message: string, data?: LogData): void {
    console.warn(`[osint-fusion:${scope}]`, message, data ?? '');
  },

  error(scope: string, message: string, data?: LogData): void {
    console.error(`[osint-fusion:${scope}]`, message, data ?? '');
  },
};
