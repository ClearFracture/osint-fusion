import { s3Uri } from '../config/env';
import { SOURCE_TYPE_LABELS } from '../types/cube';
import type { CollectionRequest } from '../types/request';
import { buildDataCubeContract } from './belvedereCubeContract';

function formatGeofence(request: CollectionRequest): string {
  if (!request.topic.geofence) {
    return '(not provided — do not apply a spatial filter)';
  }
  return JSON.stringify(request.topic.geofence, null, 2);
}

function formatTimeRange(request: CollectionRequest): string {
  if (!request.topic.time_range) {
    return '(not provided — do not apply a time filter)';
  }
  return `${request.topic.time_range.start} to ${request.topic.time_range.end}`;
}

/** Canonical source-type ids, with display labels, for this request. */
function formatSourceTypes(request: CollectionRequest): string {
  const types = request.topic.source_types;
  if (!types || types.length === 0) {
    return '(not specified — choose cataloged sources from the narrative)';
  }
  return types.map((type) => `${type} (${SOURCE_TYPE_LABELS[type] ?? type})`).join(', ');
}

/** Copy-ready prompt that defines a new Belvedere pipeline and this collection request. */
export function buildAgentMessage(request: CollectionRequest): string {
  const narrative = request.topic.narrative?.trim() || '(not provided)';

  return `Build a new pipeline which produces a parquet data cube for the collection request below. Create the pipeline from scratch. Do not search for or modify an existing pipeline.

Select cataloged sources appropriate to the topic. When source types are listed below, cover those types, and add other cataloged sources when the listed types are insufficient to answer the narrative. When no source types are listed, choose sources from the narrative. Filter each source to the geofence and time range when they are provided, then fuse the filtered rows into one cube using the contract in this prompt.

${buildDataCubeContract()}
# Collection Request Details

Collection request ID: ${request.request_id}

Request record (read only): ${s3Uri(`requests/${request.request_id}/request.json`)}

Cube prefix (write the manifest, parquet, and artifacts here): ${request.cube_s3_prefix}

Topic / question narrative:
${narrative}

Geofence (GeoJSON):
${formatGeofence(request)}

Time range:
${formatTimeRange(request)}

Source types:
${formatSourceTypes(request)}
`;
}
