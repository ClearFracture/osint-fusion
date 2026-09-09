import { describe, expect, it } from 'vitest';
import { resolveSchemaLabel } from './schemaService';

describe('resolveSchemaLabel', () => {
  it('returns label from registry when found', () => {
    const label = resolveSchemaLabel(
      {
        version: 1,
        schemas: [{ id: 'geojson-feature', label: 'GeoJSON Feature', description: '', s3_uri: '', media_type: '' }],
      },
      'geojson-feature',
    );
    expect(label).toBe('GeoJSON Feature');
  });

  it('falls back to ref id when not in registry', () => {
    expect(resolveSchemaLabel(null, 'custom-schema')).toBe('custom-schema');
  });
});
