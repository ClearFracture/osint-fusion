import type { S3Client } from '@aws-sdk/client-s3';
import { s3Uri } from '../config/env';
import type {
  CollectionRequest,
  NewRequestInput,
  RequestRegistry,
  RequestStatus,
} from '../types/request';
import { topicSummary } from './topicValidation';
import { getJsonObject, putJsonObject } from './aws/s3Repository';

const REGISTRY_KEY = 'registry/requests.json';

function emptyRegistry(): RequestRegistry {
  return { version: 1, requests: [] };
}

export async function loadRegistry(client: S3Client): Promise<RequestRegistry> {
  const registry = await getJsonObject<RequestRegistry>(client, REGISTRY_KEY);
  return registry ?? emptyRegistry();
}

export async function loadRequest(
  client: S3Client,
  requestId: string,
): Promise<CollectionRequest | null> {
  return getJsonObject<CollectionRequest>(client, `requests/${requestId}/request.json`);
}

export async function saveRequestStatus(
  client: S3Client,
  request: CollectionRequest,
  status: RequestStatus,
): Promise<CollectionRequest> {
  const updated = { ...request, status };
  await putJsonObject(client, `requests/${request.request_id}/request.json`, updated);
  const registry = await loadRegistry(client);
  registry.requests = registry.requests.map((entry) =>
    entry.request_id === request.request_id ? { ...entry, status } : entry,
  );
  await putJsonObject(client, REGISTRY_KEY, registry);
  return updated;
}

/** Create a new collection request and update the registry index. */
export async function createRequest(
  client: S3Client,
  topic: NewRequestInput,
): Promise<CollectionRequest> {
  const requestId = crypto.randomUUID();
  const request: CollectionRequest = {
    request_id: requestId,
    topic,
    created_at: new Date().toISOString(),
    status: 'pending',
    cube_s3_prefix: s3Uri(`requests/${requestId}/cube/`),
  };

  await putJsonObject(client, `requests/${requestId}/request.json`, request);
  await putJsonObject(client, `requests/${requestId}/cube/.keep`, { created: request.created_at });

  const registry = await loadRegistry(client);
  registry.requests.unshift({
    request_id: requestId,
    topic_summary: topicSummary(topic),
    created_at: request.created_at,
    status: 'pending',
  });
  await putJsonObject(client, REGISTRY_KEY, registry);

  return request;
}

export async function updateRegistryRecordCount(
  client: S3Client,
  requestId: string,
  recordCount: number,
  status: RequestStatus,
): Promise<void> {
  const registry = await loadRegistry(client);
  registry.requests = registry.requests.map((entry) =>
    entry.request_id === requestId
      ? { ...entry, record_count: recordCount, status }
      : entry,
  );
  await putJsonObject(client, REGISTRY_KEY, registry);
}
