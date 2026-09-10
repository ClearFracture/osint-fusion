/**
 * Chrome injects a Performance-panel helper (reportAllChanges) when DevTools is open.
 * With React 19 dev + React DevTools performance tracks, it can throw on route updates:
 *   Cannot read properties of undefined (reading 'startTime')
 * Stack traces point at VM### anonymous scripts — not application source.
 * See README troubleshooting and https://github.com/angular/angular/issues/70464
 */
export function suppressKnownDevToolsErrors(): void {
  if (!import.meta.env.DEV) {
    return;
  }

  window.addEventListener(
    'error',
    (event) => {
      if (!isReportAllChangesStartTimeError(event.message, event.filename, event.error)) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );

  const previousOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (isReportAllChangesStartTimeError(String(message), source, error)) {
      return true;
    }
    if (typeof previousOnError === 'function') {
      return previousOnError(message, source, lineno, colno, error) ?? false;
    }
    return false;
  };
}

export function isReportAllChangesStartTimeError(
  message: string,
  source: string | undefined,
  error: unknown,
): boolean {
  const stack = error instanceof Error ? error.stack ?? '' : '';
  const mentionsStartTime = message.includes("'startTime'") || message.includes('startTime');
  const mentionsReportAllChanges = stack.includes('reportAllChanges');
  const fromInjectedScript = !source || source.startsWith('VM') || source === '';

  return mentionsStartTime && (mentionsReportAllChanges || fromInjectedScript);
}
