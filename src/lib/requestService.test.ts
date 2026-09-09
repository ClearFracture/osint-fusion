import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequest, loadRegistry } from './requestService';
import * as s3Repository from './aws/s3Repository';

describe('requestService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates request and updates registry', async () => {
    const putMock = vi.spyOn(s3Repository, 'putJsonObject').mockResolvedValue();
    vi.spyOn(s3Repository, 'getJsonObject').mockResolvedValue({ version: 1, requests: [] });

    const request = await createRequest({} as never, { narrative: 'Test topic' });

    expect(request.request_id).toBeTruthy();
    expect(request.status).toBe('pending');
    expect(putMock).toHaveBeenCalled();
  });

  it('returns empty registry when index missing', async () => {
    vi.spyOn(s3Repository, 'getJsonObject').mockResolvedValue(null);
    const registry = await loadRegistry({} as never);
    expect(registry.requests).toEqual([]);
  });
});
