import { describe, expect, it, vi } from 'vitest';
import { checkCubeReadiness } from './readiness';
import * as s3Repository from './aws/s3Repository';

describe('checkCubeReadiness', () => {
  it('returns ready when manifest status is ready', async () => {
    vi.spyOn(s3Repository, 'getJsonObject').mockImplementation(async (_client, key) => {
      if (key.endsWith('_manifest.json')) {
        return { status: 'ready' };
      }
      return null;
    });
    vi.spyOn(s3Repository, 'listKeys').mockResolvedValue([]);

    const result = await checkCubeReadiness({} as never, 'req-1', 'building');
    expect(result.status).toBe('ready');
  });

  it('returns failed when manifest reports failure', async () => {
    vi.spyOn(s3Repository, 'getJsonObject').mockImplementation(async (_client, key) => {
      if (key.endsWith('_manifest.json')) {
        return { status: 'failed', error_message: 'Pipeline error' };
      }
      return null;
    });
    vi.spyOn(s3Repository, 'listKeys').mockResolvedValue([]);

    const result = await checkCubeReadiness({} as never, 'req-1', 'building');
    expect(result.status).toBe('failed');
    expect(result.manifest?.error_message).toBe('Pipeline error');
  });
});
