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

  it('returns ready when parquet exists without manifest', async () => {
    vi.spyOn(s3Repository, 'getJsonObject').mockResolvedValue(null);
    vi.spyOn(s3Repository, 'listKeys').mockResolvedValue([
      'requests/req-1/cube/data/source_type=SocialMedia/source_producer=BlueSky/part-0.parquet',
    ]);

    const result = await checkCubeReadiness({} as never, 'req-1', 'building');
    expect(result.status).toBe('ready');
    expect(result.hasParquet).toBe(true);
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
