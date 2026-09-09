import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { AwsCredentials } from './credentials';
import { appKey, getConfig } from '../../config/env';

export function createS3Client(credentials: AwsCredentials): S3Client {
  return new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
}

async function readBody<T>(body: unknown): Promise<T> {
  if (!body || typeof body !== 'object' || !('transformToString' in body)) {
    throw new Error('Empty S3 object body.');
  }
  const text = await (body as { transformToString: () => Promise<string> }).transformToString();
  return JSON.parse(text) as T;
}

/** Fetch and parse a JSON object from S3. Returns null if not found. */
export async function getJsonObject<T>(
  client: S3Client,
  relativeKey: string,
): Promise<T | null> {
  const { bucket } = getConfig();
  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: appKey(relativeKey) }),
    );
    return await readBody<T>(response.Body);
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

/** Write a JSON object to S3. */
export async function putJsonObject(
  client: S3Client,
  relativeKey: string,
  value: unknown,
): Promise<void> {
  const { bucket } = getConfig();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: appKey(relativeKey),
      Body: JSON.stringify(value, null, 2),
      ContentType: 'application/json',
    }),
  );
}

/** List object keys under a prefix (relative to app root). */
export async function listKeys(client: S3Client, relativePrefix: string): Promise<string[]> {
  const { bucket } = getConfig();
  const prefix = appKey(relativePrefix);
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix.endsWith('/') ? prefix : `${prefix}/`,
        ContinuationToken: continuationToken,
      }),
    );
    for (const item of response.Contents ?? []) {
      if (item.Key) {
        keys.push(item.Key.replace(`${getConfig().prefix}/`, ''));
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return keys;
}

function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  if ('name' in error && (error.name === 'NoSuchKey' || error.name === 'NotFound')) {
    return true;
  }
  if (
    '$metadata' in error &&
    typeof error.$metadata === 'object' &&
    error.$metadata !== null &&
    'httpStatusCode' in error.$metadata &&
    error.$metadata.httpStatusCode === 404
  ) {
    return true;
  }
  return false;
}
