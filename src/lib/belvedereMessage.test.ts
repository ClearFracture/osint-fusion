import { describe, expect, it } from 'vitest';
import { getConfig, s3Uri } from '../config/env';
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
  it('includes a from-scratch cube contract and the request', () => {
    const { bucket, athenaDatabase, athenaTable } = getConfig();
    const message = buildAgentMessage(baseRequest);

    expect(message).toContain('Create the pipeline from scratch');
    expect(message).toContain('Do not search for or modify an existing pipeline');
    expect(message).toContain(`s3://${bucket}/`);
    expect(message).toContain(athenaDatabase);
    expect(message).toContain(athenaTable);
    expect(message).toContain('Do not create the database, create or replace the table, or add, drop, or repair partitions');
    expect(message).toContain(s3Uri('registry/schemas/index.json'));
    expect(message).toContain('Do not hard-code a list of payload schemas');
    expect(message).not.toContain('CREATE EXTERNAL TABLE');
    expect(message).not.toContain('ALTER TABLE');
    expect(message).not.toContain('geojson-feature');
    expect(message).not.toContain('bluesky-post');
    expect(message).toContain('artifact_id:string,mime_type:string,s3_uri:string,role:string');
    expect(message).toContain('pipeline_run_id:string,belvedere_chat_id:string,extractor_version:string');
    expect(message).toContain('Collection request ID: abc-123');
    expect(message).toContain('Test narrative');
    expect(message).toContain(baseRequest.cube_s3_prefix);
    expect(message).toContain(s3Uri('requests/abc-123/request.json'));
    expect(message).not.toContain('cataloged S3 destination');
  });

  it('marks missing optional fields as not provided', () => {
    const message = buildAgentMessage(baseRequest);
    expect(message).toContain('Geofence (GeoJSON):\n(not provided — do not apply a spatial filter)');
    expect(message).toContain('Time range:\n(not provided — do not apply a time filter)');
    expect(message).toContain(
      'Source types:\n(not specified — choose cataloged sources from the narrative)',
    );
  });

  it('includes selected source types as canonical ids', () => {
    const message = buildAgentMessage({
      ...baseRequest,
      topic: {
        narrative: 'Test narrative',
        source_types: ['EntityTracks', 'Demographics'],
        geofence: { type: 'Polygon', coordinates: [] },
        time_range: { start: '2026-01-01T00:00:00Z', end: '2026-02-01T00:00:00Z' },
      },
    });
    expect(message).toContain('Source types:\nEntityTracks (Entity Tracks), Demographics (Demographics)');
    expect(message).toContain('"type": "Polygon"');
    expect(message).toContain('2026-01-01T00:00:00Z to 2026-02-01T00:00:00Z');
  });
});
