import type { S3Client } from '@aws-sdk/client-s3';
import { appKey, getConfig, s3Uri } from '../config/env';
import type { CubeManifest } from '../types/cube';
import type { RequestStatus } from '../types/request';
import { getJsonObject, listKeys } from './aws/s3Repository';
import { logger } from './logger';

export interface ReadinessResult {
  status: RequestStatus;
  manifest: CubeManifest | null;
  hasParquet: boolean;
}

const RECOGNIZED_MANIFEST_STATUSES = new Set(['ready', 'building', 'failed']);

function describeManifestStatus(manifest: CubeManifest | null): Record<string, unknown> {
  if (!manifest) {
    return { found: false };
  }

  const rawStatus = manifest.status;
  return {
    found: true,
    rawStatus,
    rawStatusType: typeof rawStatus,
    normalizedStatus:
      typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : rawStatus,
    recognized: RECOGNIZED_MANIFEST_STATUSES.has(String(rawStatus)),
    matchesReadyLiteral: rawStatus === 'ready',
    errorMessage: manifest.error_message ?? null,
    athenaTable: manifest.athena_table ?? null,
  };
}

/** Determine cube readiness from S3 objects (manual refresh). */
export async function checkCubeReadiness(
  client: S3Client,
  requestId: string,
  currentStatus: RequestStatus,
): Promise<ReadinessResult> {
  const base = `requests/${requestId}/cube`;
  const manifestKey = `${base}/_manifest.json`;
  const dataPrefix = `${base}/data`;
  const { bucket, prefix } = getConfig();

  logger.info('readiness', 'Starting cube readiness check', {
    requestId,
    currentStatus,
    bucket,
    appPrefix: prefix,
    manifestKey: appKey(manifestKey),
    manifestUri: s3Uri(manifestKey),
    dataPrefix: appKey(dataPrefix),
  });

  let manifest: CubeManifest | null = null;
  try {
    manifest = await getJsonObject<CubeManifest>(client, manifestKey);
  } catch (error) {
    logger.error('readiness', 'Failed to read _manifest.json', {
      requestId,
      manifestUri: s3Uri(manifestKey),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const manifestDetails = describeManifestStatus(manifest);
  logger.info('readiness', 'Manifest lookup result', {
    requestId,
    ...manifestDetails,
    manifestBody: manifest,
  });

  if (manifest && !RECOGNIZED_MANIFEST_STATUSES.has(String(manifest.status))) {
    logger.warn('readiness', 'Manifest status is not a recognized enum value', {
      requestId,
      rawStatus: manifest.status,
      expectedOneOf: [...RECOGNIZED_MANIFEST_STATUSES],
      hint: 'App only treats status === "ready" as ready (case-sensitive).',
    });
  }

  if (manifest && manifest.status !== 'ready' && manifestDetails.normalizedStatus === 'ready') {
    logger.warn('readiness', 'Manifest looks ready after normalization but raw status differs', {
      requestId,
      rawStatus: manifest.status,
      normalizedStatus: manifestDetails.normalizedStatus,
    });
  }

  let keys: string[] = [];
  try {
    keys = await listKeys(client, dataPrefix);
  } catch (error) {
    logger.error('readiness', 'Failed to list parquet prefix', {
      requestId,
      dataPrefix: appKey(dataPrefix),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const parquetKeys = keys.filter((key) => key.endsWith('.parquet'));
  const hasParquet = parquetKeys.length > 0;

  logger.info('readiness', 'Parquet listing result', {
    requestId,
    listedObjectCount: keys.length,
    parquetFileCount: parquetKeys.length,
    hasParquet,
    sampleKeys: keys.slice(0, 5),
    sampleParquetKeys: parquetKeys.slice(0, 5),
  });

  let result: ReadinessResult;
  let decision: string;

  if (manifest?.status === 'failed') {
    result = { status: 'failed', manifest, hasParquet };
    decision = 'manifest.status === "failed"';
  } else if (manifest?.status === 'ready' || hasParquet) {
    result = { status: 'ready', manifest, hasParquet };
    decision =
      manifest?.status === 'ready'
        ? 'manifest.status === "ready"'
        : 'parquet files present under cube/data/';
  } else if (currentStatus === 'pending') {
    result = { status: 'building', manifest, hasParquet };
    decision = 'no ready signal; currentStatus was pending → building';
  } else {
    result = {
      status: currentStatus === 'ready' ? 'ready' : 'building',
      manifest,
      hasParquet,
    };
    decision =
      currentStatus === 'ready'
        ? 'no ready signal; preserving existing ready status'
        : 'no ready signal; currentStatus not pending → building';
  }

  logger.info('readiness', 'Readiness decision', {
    requestId,
    decision,
    previousStatus: currentStatus,
    resolvedStatus: result.status,
    manifestReady: manifest?.status === 'ready',
    hasParquet,
  });

  if (manifestDetails.matchesReadyLiteral === false && manifestDetails.normalizedStatus === 'ready') {
    logger.warn('readiness', 'Cube may appear stuck because manifest status casing/value mismatch', {
      requestId,
      rawStatus: manifest?.status,
      resolvedStatus: result.status,
    });
  }

  return result;
}
