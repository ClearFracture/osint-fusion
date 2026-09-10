import type { AthenaClient } from '@aws-sdk/client-athena';
import type { S3Client } from '@aws-sdk/client-s3';
import { getConfig, s3Uri } from '../config/env';
import { executeDdl } from './aws/athenaRepository';
import { listKeys } from './aws/s3Repository';
import { logger } from './logger';

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

/** Register one Hive partition with an explicit S3 LOCATION (required for this app's path layout). */
export function buildAddPartitionDdl(partition: CubePartition): string {
  const location = s3Uri(partition.relativeLocation);
  return `
ALTER TABLE osint_cube ADD IF NOT EXISTS PARTITION (
  request_id='${escapeSqlLiteral(partition.requestId)}',
  source_type='${escapeSqlLiteral(partition.sourceType)}',
  source_producer='${escapeSqlLiteral(partition.sourceProducer)}'
) LOCATION '${location}'
  `.trim();
}

export interface CubePartition {
  requestId: string;
  sourceType: string;
  sourceProducer: string;
  relativeLocation: string;
}

const PARTITION_PATH_PATTERN =
  /source_type=([^/]+)\/source_producer=([^/]+)/;

/** Infer Glue/Athena partitions from Hive-style paths under cube/data/. */
export function parseCubePartitionsFromKeys(
  requestId: string,
  keys: string[],
): CubePartition[] {
  const seen = new Set<string>();
  const partitions: CubePartition[] = [];

  for (const key of keys) {
    if (!key.endsWith('.parquet')) {
      continue;
    }

    const match = key.match(PARTITION_PATH_PATTERN);
    if (!match?.[1] || !match[2]) {
      continue;
    }

    const sourceTypeSegment = match[1];
    const sourceProducerSegment = match[2];
    const dedupeKey = `${sourceTypeSegment}\0${sourceProducerSegment}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    partitions.push({
      requestId,
      sourceType: decodeURIComponent(sourceTypeSegment),
      sourceProducer: decodeURIComponent(sourceProducerSegment),
      relativeLocation: `requests/${requestId}/cube/data/source_type=${sourceTypeSegment}/source_producer=${sourceProducerSegment}/`,
    });
  }

  return partitions.sort((a, b) =>
    `${a.sourceType}/${a.sourceProducer}`.localeCompare(`${b.sourceType}/${b.sourceProducer}`),
  );
}

/** Register discovered cube partitions with Athena/Glue using explicit LOCATION paths. */
export async function registerCubePartitions(
  s3Client: S3Client,
  athenaClient: AthenaClient,
  requestId: string,
): Promise<{ discovered: number; registered: number; errors: string[] }> {
  const dataPrefix = `requests/${requestId}/cube/data`;
  logger.info('partitions', 'Discovering cube partitions from S3', {
    requestId,
    dataPrefix,
  });

  const keys = await listKeys(s3Client, dataPrefix);
  const partitions = parseCubePartitionsFromKeys(requestId, keys);

  logger.info('partitions', 'Partition discovery complete', {
    requestId,
    parquetKeyCount: keys.filter((key) => key.endsWith('.parquet')).length,
    discoveredPartitions: partitions.length,
    partitions: partitions.map((partition) => ({
      sourceType: partition.sourceType,
      sourceProducer: partition.sourceProducer,
      location: s3Uri(partition.relativeLocation),
    })),
  });

  if (partitions.length === 0) {
    logger.warn('partitions', 'No partitions discovered for request', {
      requestId,
      hint: 'Expected paths like requests/{id}/cube/data/source_type=…/source_producer=…/*.parquet',
    });
    return { discovered: 0, registered: 0, errors: [] };
  }

  const { athenaDatabase } = getConfig();
  const errors: string[] = [];
  let registered = 0;

  for (const partition of partitions) {
    const ddl = buildAddPartitionDdl(partition);
    try {
      await executeDdl(athenaClient, ddl, athenaDatabase);
      registered += 1;
      logger.info('partitions', 'Registered partition', {
        requestId,
        sourceType: partition.sourceType,
        sourceProducer: partition.sourceProducer,
        location: s3Uri(partition.relativeLocation),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(
        `${partition.sourceType}/${partition.sourceProducer}: ${message}`,
      );
      logger.warn('partitions', 'Failed to register partition', {
        requestId,
        sourceType: partition.sourceType,
        sourceProducer: partition.sourceProducer,
        error: message,
      });
    }
  }

  logger.info('partitions', 'Partition registration finished', {
    requestId,
    discovered: partitions.length,
    registered,
    errorCount: errors.length,
  });

  return { discovered: partitions.length, registered, errors };
}
