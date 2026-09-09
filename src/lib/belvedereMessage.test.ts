import { describe, expect, it } from 'vitest';
import { buildAgentMessage } from './belvedereMessage';
import type { CollectionRequest } from '../types/request';

const baseRequest: CollectionRequest = {
  request_id: 'abc-123',
  topic: { narrative: 'Test narrative' },
  created_at: '2026-01-01T00:00:00Z',
  status: 'pending',
  cube_s3_prefix: 's3://cf-hackathon/osint-fusion-app/requests/abc-123/cube/',
};

describe('buildAgentMessage', () => {
  it('includes request id and narrative', () => {
    const message = buildAgentMessage(baseRequest);
    expect(message).toContain('Collection request ID: abc-123');
    expect(message).toContain('Test narrative');
    expect(message).toContain('registry/schemas/index.json');
  });

  it('marks missing optional fields as not provided', () => {
    const message = buildAgentMessage(baseRequest);
    expect(message).toContain('Geofence (GeoJSON):\n(not provided)');
    expect(message).toContain('Time range:\n(not provided)');
  });
});
