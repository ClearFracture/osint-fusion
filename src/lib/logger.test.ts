import { describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  it('writes namespaced messages to console', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('test', 'hello', { value: 1 });
    expect(infoSpy).toHaveBeenCalledWith('[osint-fusion:test]', 'hello', { value: 1 });
    infoSpy.mockRestore();
  });
});
