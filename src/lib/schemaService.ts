import type { S3Client } from '@aws-sdk/client-s3';
import type { PayloadSchemaRegistry } from '../types/cube';
import { getJsonObject, listKeys } from './aws/s3Repository';

export async function loadPayloadSchemaRegistry(
  client: S3Client,
): Promise<PayloadSchemaRegistry | null> {
  return getJsonObject<PayloadSchemaRegistry>(client, 'registry/schemas/index.json');
}

/** Fallback: infer source type prefixes from S3 partition paths. */
export async function listSourceTypePrefixes(
  client: S3Client,
  requestId: string,
): Promise<string[]> {
  const keys = await listKeys(client, `requests/${requestId}/cube/data`);
  const types = new Set<string>();
  const pattern = /source_type=([^/]+)/;
  for (const key of keys) {
    const match = key.match(pattern);
    if (match?.[1]) {
      types.add(decodeURIComponent(match[1]));
    }
  }
  return [...types].sort();
}

export function resolveSchemaLabel(
  registry: PayloadSchemaRegistry | null,
  schemaRef: string,
): string {
  const entry = registry?.schemas.find((schema) => schema.id === schemaRef);
  return entry?.label ?? schemaRef;
}
