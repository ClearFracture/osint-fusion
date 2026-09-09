import type { AthenaClient } from '@aws-sdk/client-athena';
import type { S3Client } from '@aws-sdk/client-s3';
import type { RequestRegistry } from '../../types/request';
import { getConfig } from '../../config/env';
import {
  buildCreateDatabaseDdl,
  buildCreateTableDdl,
  executeDdl,
} from '../aws/athenaRepository';
import { getJsonObject, putJsonObject } from '../aws/s3Repository';
import { BOOTSTRAP_SCHEMAS, buildSchemaRegistryIndex } from './payloadSchemas';

export interface BootstrapResult {
  created: string[];
  skipped: string[];
  errors: string[];
}

const REGISTRY_KEY = 'registry/requests.json';
const SCHEMA_INDEX_KEY = 'registry/schemas/index.json';

async function ensureJsonObject(
  client: S3Client,
  relativeKey: string,
  value: unknown,
  created: string[],
  skipped: string[],
): Promise<void> {
  const existing = await getJsonObject(client, relativeKey);
  if (existing) {
    skipped.push(relativeKey);
    return;
  }
  await putJsonObject(client, relativeKey, value);
  created.push(relativeKey);
}

/** Create required S3 registry objects and Athena database/table when missing. */
export async function bootstrapInfrastructure(
  s3Client: S3Client,
  athenaClient: AthenaClient,
): Promise<BootstrapResult> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  try {
    const emptyRegistry: RequestRegistry = { version: 1, requests: [] };
    await ensureJsonObject(s3Client, REGISTRY_KEY, emptyRegistry, created, skipped);

    for (const schema of BOOTSTRAP_SCHEMAS) {
      await ensureJsonObject(
        s3Client,
        `registry/schemas/${schema.id}.json`,
        schema.document,
        created,
        skipped,
      );
    }

    await ensureJsonObject(
      s3Client,
      SCHEMA_INDEX_KEY,
      buildSchemaRegistryIndex(),
      created,
      skipped,
    );

    await ensureJsonObject(
      s3Client,
      'athena-results/.keep',
      { purpose: 'Athena query output prefix marker' },
      created,
      skipped,
    );
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'S3 bootstrap failed.');
  }

  try {
    await executeDdl(athenaClient, buildCreateDatabaseDdl(), 'default');
    created.push('athena:database');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Athena database creation failed.';
    if (message.toLowerCase().includes('already exists')) {
      skipped.push('athena:database');
    } else {
      errors.push(message);
    }
  }

  try {
    const { athenaDatabase } = getConfig();
    await executeDdl(athenaClient, buildCreateTableDdl(), athenaDatabase);
    created.push('athena:osint_cube');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Athena table creation failed.';
    if (message.toLowerCase().includes('already exists')) {
      skipped.push('athena:osint_cube');
    } else {
      errors.push(message);
    }
  }

  return { created, skipped, errors };
}
