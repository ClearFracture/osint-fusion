import { s3Uri } from '../../config/env';
import type { PayloadSchemaRegistry } from '../../types/cube';

export interface BootstrapSchemaDefinition {
  id: string;
  label: string;
  description: string;
  document: Record<string, unknown>;
}

/** Bootstrap payload JSON Schemas registered on first app connect. */
export const BOOTSTRAP_SCHEMAS: BootstrapSchemaDefinition[] = [
  {
    id: 'generic-object',
    label: 'Generic Object',
    description: 'Arbitrary JSON object payload',
    document: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'generic-object',
      title: 'Generic Object',
      type: 'object',
      additionalProperties: true,
    },
  },
  {
    id: 'geojson-feature',
    label: 'GeoJSON Feature',
    description: 'RFC 7946 GeoJSON Feature object',
    document: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'geojson-feature',
      title: 'GeoJSON Feature',
      type: 'object',
      required: ['type', 'geometry'],
      properties: {
        type: { const: 'Feature' },
        geometry: { type: 'object' },
        properties: { type: 'object' },
      },
    },
  },
  {
    id: 'bluesky-post',
    label: 'BlueSky Post',
    description: 'Social post record from BlueSky extractor',
    document: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'bluesky-post',
      title: 'BlueSky Post',
      type: 'object',
      properties: {
        post_id: { type: 'string' },
        author_handle: { type: 'string' },
        text: { type: 'string' },
      },
    },
  },
  {
    id: 'osm-element',
    label: 'OpenStreetMap Element',
    description: 'OpenStreetMap node, way, or relation',
    document: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'osm-element',
      title: 'OSM Element',
      type: 'object',
      properties: {
        osm_id: { type: 'string' },
        osm_type: { type: 'string' },
        tags: { type: 'object' },
      },
    },
  },
  {
    id: 'stac-item',
    label: 'STAC Item',
    description: 'SpatioTemporal Asset Catalog item metadata',
    document: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'stac-item',
      title: 'STAC Item',
      type: 'object',
      properties: {
        stac_version: { type: 'string' },
        id: { type: 'string' },
        geometry: { type: 'object' },
        properties: { type: 'object' },
      },
    },
  },
];

export function buildSchemaRegistryIndex(): PayloadSchemaRegistry {
  return {
    version: 1,
    schemas: BOOTSTRAP_SCHEMAS.map((schema) => ({
      id: schema.id,
      label: schema.label,
      description: schema.description,
      s3_uri: s3Uri(`registry/schemas/${schema.id}.json`),
      media_type: 'application/schema+json',
    })),
  };
}
