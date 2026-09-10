import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequest, deleteRequest, loadRegistry } from './requestService';
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

  it('deletes request prefix and removes registry entry', async () => {
    vi.spyOn(s3Repository, 'deletePrefix').mockResolvedValue(5);
    vi.spyOn(s3Repository, 'getJsonObject').mockResolvedValue({
      version: 1,
      requests: [
        {
          request_id: 'req-1',
          topic_summary: 'Topic',
          created_at: '2026-01-01T00:00:00Z',
          status: 'pending',
        },
        {
          request_id: 'req-2',
          topic_summary: 'Other',
          created_at: '2026-01-02T00:00:00Z',
          status: 'ready',
        },
      ],
    });
    const putMock = vi.spyOn(s3Repository, 'putJsonObject').mockResolvedValue();

    const removed = await deleteRequest({} as never, 'req-1');

    expect(removed).toBe(5);
    expect(s3Repository.deletePrefix).toHaveBeenCalledWith(expect.anything(), 'requests/req-1');
    expect(putMock).toHaveBeenCalledWith(
      expect.anything(),
      'registry/requests.json',
      expect.objectContaining({
        requests: [expect.objectContaining({ request_id: 'req-2' })],
      }),
    );
  });
});
