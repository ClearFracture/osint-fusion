import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequest, deleteRequest, loadCatalog, loadRegistry } from './requestService';
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

  it('shows the full request narrative in the catalog', async () => {
    vi.spyOn(s3Repository, 'getJsonObject').mockImplementation(async (_client, key) => {
      if (key === 'registry/requests.json') {
        return {
          version: 1,
          requests: [
            {
              request_id: 'req-1',
              topic_summary: 'Truncated...',
              created_at: '2026-01-01T00:00:00Z',
              status: 'pending',
            },
          ],
        };
      }
      if (key === 'requests/req-1/request.json') {
        return {
          request_id: 'req-1',
          topic: { narrative: '  Full collection narrative that must stay visible  ' },
          created_at: '2026-01-01T00:00:00Z',
          status: 'pending',
          cube_s3_prefix: 's3://bucket/requests/req-1/cube/',
        };
      }
      return null;
    });

    const catalog = await loadCatalog({} as never);
    expect(catalog.requests[0].topic_summary).toBe(
      'Full collection narrative that must stay visible',
    );
  });

  it('keeps the stored topic summary when the request record is missing', async () => {
    vi.spyOn(s3Repository, 'getJsonObject').mockImplementation(async (_client, key) => {
      if (key === 'registry/requests.json') {
        return {
          version: 1,
          requests: [
            {
              request_id: 'req-1',
              topic_summary: 'Stored summary',
              created_at: '2026-01-01T00:00:00Z',
              status: 'pending',
            },
          ],
        };
      }
      return null;
    });

    const catalog = await loadCatalog({} as never);
    expect(catalog.requests[0].topic_summary).toBe('Stored summary');
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
