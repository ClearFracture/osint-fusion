import { describe, expect, it } from 'vitest';
import { isLikelyCorsError } from './corsError';

describe('isLikelyCorsError', () => {
  it('detects failed to fetch messages', () => {
    expect(isLikelyCorsError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('detects explicit CORS messages', () => {
    expect(isLikelyCorsError(new Error('CORS policy blocked'))).toBe(true);
  });

  it('returns false for permission errors', () => {
    expect(isLikelyCorsError(new Error('Access Denied'))).toBe(false);
  });
});
