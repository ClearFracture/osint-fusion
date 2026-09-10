import { describe, expect, it } from 'vitest';
import { isoToDatetimeLocal } from './dateTimeLocal';

describe('isoToDatetimeLocal', () => {
  it('formats ISO timestamps for datetime-local inputs', () => {
    const formatted = isoToDatetimeLocal('2026-01-15T14:30:00.000Z');
    expect(formatted).toMatch(/2026-01-15T\d{2}:30/);
  });

  it('returns empty string for invalid input', () => {
    expect(isoToDatetimeLocal('not-a-date')).toBe('');
  });
});
