import type { S3Client } from '@aws-sdk/client-s3';
import type { CubeManifest } from '../types/cube';
import type { RequestStatus } from '../types/request';
import { getJsonObject, listKeys } from './aws/s3Repository';

export interface ReadinessResult {
  status: RequestStatus;
  manifest: CubeManifest | null;
  hasSchema: boolean;
  hasParquet: boolean;
}

/** Determine cube readiness from S3 objects (manual refresh). */
export async function checkCubeReadiness(
  client: S3Client,
  requestId: string,
  currentStatus: RequestStatus,
): Promise<ReadinessResult> {
  const base = `requests/${requestId}/cube`;
  const manifest = await getJsonObject<CubeManifest>(client, `${base}/_manifest.json`);
  const schema = await getJsonObject<unknown>(client, `${base}/schema.json`);
  const keys = await listKeys(client, `${base}/data`);
  const hasParquet = keys.some((key) => key.endsWith('.parquet'));

  if (manifest?.status === 'failed') {
    return { status: 'failed', manifest, hasSchema: Boolean(schema), hasParquet };
  }

  if (manifest?.status === 'ready' || (schema && hasParquet)) {
    return { status: 'ready', manifest, hasSchema: Boolean(schema), hasParquet };
  }

  if (currentStatus === 'pending') {
    return { status: 'building', manifest, hasSchema: Boolean(schema), hasParquet };
  }

  return {
    status: currentStatus === 'ready' ? 'ready' : 'building',
    manifest,
    hasSchema: Boolean(schema),
    hasParquet,
  };
}
