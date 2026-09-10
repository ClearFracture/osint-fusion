import { describe, expect, it } from 'vitest';
import { isReportAllChangesStartTimeError } from './suppressKnownDevToolsErrors';

describe('isReportAllChangesStartTimeError', () => {
  it('matches the known Chrome DevTools stack', () => {
    expect(
      isReportAllChangesStartTimeError(
        "Cannot read properties of undefined (reading 'startTime')",
        'VM1899:2',
        new Error('at et.reportAllChanges (<anonymous>:2:19429)'),
      ),
    ).toBe(true);
  });

  it('does not match application errors', () => {
    expect(
      isReportAllChangesStartTimeError(
        'Access Denied',
        'http://localhost:5173/src/main.tsx',
        new Error('at loadRegistry'),
      ),
    ).toBe(false);
  });
});
