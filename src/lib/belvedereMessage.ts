import type { CollectionRequest } from '../types/request';

function formatGeofence(request: CollectionRequest): string {
  if (!request.topic.geofence) {
    return '(not provided)';
  }
  return JSON.stringify(request.topic.geofence, null, 2);
}

function formatTimeRange(request: CollectionRequest): string {
  if (!request.topic.time_range) {
    return '(not provided)';
  }
  return `${request.topic.time_range.start} to ${request.topic.time_range.end}`;
}

/** Build the copy-ready Belvedere pipeline agent message. */
export function buildAgentMessage(request: CollectionRequest): string {
  const narrative = request.topic.narrative?.trim() || '(not provided)';

  return `Collection request ID: ${request.request_id}

Topic narrative:
${narrative}

Geofence (GeoJSON):
${formatGeofence(request)}

Time range:
${formatTimeRange(request)}

Please build the OSINT data cube for this collection request using the cataloged S3 destination for request ${request.request_id}.
Write parquet partitions, schema.json, and _manifest.json when complete.
Set payload_schema_ref on each record to a schema id from the global registry (registry/schemas/index.json).
Register any new payload JSON Schemas in the global registry before referencing them.`;
}
