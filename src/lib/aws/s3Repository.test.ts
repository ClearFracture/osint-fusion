import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getJsonObject, putJsonObject } from './s3Repository';

describe('s3Repository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when object is not found', async () => {
    const client = {
      send: vi.fn().mockRejectedValue({ name: 'NoSuchKey' }),
    } as unknown as S3Client;

    const result = await getJsonObject(client, 'missing.json');
    expect(result).toBeNull();
  });

  it('parses json objects from S3', async () => {
    const client = {
      send: vi.fn().mockResolvedValue({
        Body: {
          transformToString: async () => JSON.stringify({ hello: 'world' }),
        },
      }),
    } as unknown as S3Client;

    const result = await getJsonObject<{ hello: string }>(client, 'test.json');
    expect(result?.hello).toBe('world');
    expect(client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
  });

  it('writes json objects to S3', async () => {
    const client = {
      send: vi.fn().mockResolvedValue({}),
    } as unknown as S3Client;

    await putJsonObject(client, 'out.json', { saved: true });
    expect(client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });
});
