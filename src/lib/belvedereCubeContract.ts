import { getConfig } from '../config/env';
import { CANONICAL_SOURCE_TYPES } from '../types/cube';

/**
 * Storage and artifact contract embedded in the Belvedere handoff prompt.
 * The app owns Glue table creation and partition registration; the pipeline reads the schema registry itself.
 */
export function buildDataCubeContract(): string {
  const { region, bucket, prefix, athenaDatabase, athenaTable, athenaOutput } = getConfig();
  const root = `s3://${bucket}/${prefix}`;
  const schemaIndex = `${root}/registry/schemas/index.json`;

  return `# Data Cube Configuration

Create every Belvedere-owned artifact described here. The OSINT-Fusion app already created the registry, \`request.json\`, and \`cube/.keep\`. Do not modify those app-owned objects.

## 1. Storage

Region: \`${region}\`

Athena database: \`${athenaDatabase}\`
Athena table: \`${athenaTable}\`
Athena query-result location (do not write the cube here): \`${athenaOutput}\`

The app creates \`${athenaDatabase}.${athenaTable}\` and registers Glue partitions when an analyst opens or refreshes a ready request. Do not create the database, create or replace the table, or add, drop, or repair partitions. Write only the parquet files, artifacts, manifest, and any new payload schemas.

\`\`\`
${root}/
├── registry/                          ← app-owned metadata (shared across all requests)
│   ├── requests.json
│   └── schemas/                       ← payload schemas; Belvedere may append new ones
│       ├── index.json
│       └── {schema-id}.json
├── requests/
│   └── {request-id}/
│       ├── request.json               ← app-owned; read, do not write
│       └── cube/                      ← Belvedere-owned data cube
│           ├── .keep                  ← app-owned placeholder; do not delete
│           ├── _manifest.json
│           ├── data/
│           │   └── source_type={type}/
│           │       └── source_producer={producer}/
│           │           └── part-{n}.parquet
│           └── artifacts/
│               └── {artifact-id}/...
└── athena-results/
\`\`\`

## 2. Artifact rules

### Do not write

| Object | Reason |
| --- | --- |
| \`registry/requests.json\` | App catalog. Status is updated by the app from the manifest and parquet. |
| \`requests/{request-id}/request.json\` | Authoritative request. Read it; do not change status or topic. |
| \`requests/{request-id}/cube/.keep\` | Placeholder the app wrote so the prefix exists. |
| \`requests/{request-id}/cube/schema.json\` | Payload schemas are global, under \`registry/schemas/\`. |

### \`registry/schemas/\`

The pipeline must decide schema ids by reading the live registry. Do not hard-code a list of payload schemas.

1. Read \`${schemaIndex}\`.
2. For each entry, read the schema document at its \`s3_uri\`.
3. When \`payload_json\` matches an existing schema, set \`payload_schema_ref\` to that id.
4. When no existing schema matches, upload a new JSON Schema (draft 2020-12) to \`registry/schemas/{schema-id}.json\` and append one object to the \`schemas\` array. Do not remove or rewrite other entries.

Index entry: \`{ "id", "label", "description", "s3_uri", "media_type": "application/schema+json" }\`. \`s3_uri\` is the \`s3://\` URI of the schema document.

Geographic structure belongs in \`payload_json\`. Do not add a WKT or WKB column. When the payload has a geometry, set \`lat\` and \`lon\` to its centroid in decimal degrees (latitude, longitude).

### \`_manifest.json\`

Path: \`requests/{request-id}/cube/_manifest.json\`.

Write \`{ "status": "building" }\` when the run starts. On success write \`{ "status": "ready", "athena_table": "${athenaDatabase}.${athenaTable}" }\`. On failure write \`{ "status": "failed", "error_message": "<why>" }\`. Zero matching records is success: status \`ready\` and no part files. A crash or an unwritable destination is \`failed\`.

### Parquet

Write files that match the existing table \`${athenaDatabase}.${athenaTable}\`. Partition keys are \`request_id\`, \`source_type\`, and \`source_producer\`. Store those only in the Hive path below. Do not also store them as physical columns inside the parquet file, and do not register the partitions yourself.

Path under the cube prefix:

\`data/source_type={source_type}/source_producer={source_producer}/part-{n}.parquet\`

\`source_type\` must be exactly one of: ${CANONICAL_SOURCE_TYPES.join(', ')}. Use the id, not a display label, in the folder name. \`source_producer\` is a stable catalog source name with no \`/\`, \`=\`, or whitespace.

Data columns inside each part file:

| Column | Type | Required | Rule |
| --- | --- | --- | --- |
| \`record_id\` | string | yes | UUID for this output row |
| \`observed_at\` | timestamp | yes | Source observation time, UTC |
| \`ingested_at\` | timestamp | yes | Time the pipeline wrote the row, UTC |
| \`payload_json\` | string | yes | JSON matching \`payload_schema_ref\` |
| \`payload_schema_ref\` | string | yes | Id in \`registry/schemas/index.json\` |
| \`lat\` | double | no | Centroid latitude, -90 through 90 |
| \`lon\` | double | no | Centroid longitude, -180 through 180 |
| \`title\` | string | no | Display label |
| \`summary\` | string | no | Short text summary |
| \`confidence\` | double | no | 0.0 through 1.0, or null |
| \`artifact_refs\` | array<struct<artifact_id:string,mime_type:string,s3_uri:string,role:string>> | no | One entry per binary under \`artifacts/\` |
| \`tags\` | array<string> | no | Extra facets |
| \`lineage\` | struct<pipeline_run_id:string,belvedere_chat_id:string,extractor_version:string> | no | Provenance for this row |

\`artifact_refs.s3_uri\` points at an object under \`cube/artifacts/{artifact_id}/\`. Maximum 500 MB per artifact. \`role\` is a short token such as \`image\`, \`document\`, or \`thumbnail\`.

## 3. How to collect

1. Read the collection request details in this prompt and the matching \`request.json\`.
2. Choose cataloged sources. When source types are listed, include sources that can produce those types. When that set cannot answer the narrative, add other cataloged sources. When no source types are listed, choose sources from the narrative alone.
3. Filter each source before fusion. If a geofence is present, keep observations that intersect it. Coordinates in the GeoJSON are longitude, latitude. Drop records that have neither a geometry nor \`lat\`/\`lon\`. If a time range is present, keep rows whose \`observed_at\` is inside the range, inclusive, and drop rows with no \`observed_at\`.
4. Fuse by writing every kept row into the shared cube. Keep one \`source_producer\` per row. Do not collapse two producers into a single row. Deduplicate only exact repeats of the same observation from the same producer.
5. Assign \`source_type\` from the canonical list. Rows that fit a requested type must use that type. Additional sources use the canonical type that describes them.
6. Read the payload schema registry and set \`payload_schema_ref\` from an existing schema, or append a new schema when none match.
7. Write the manifest, part files, and artifacts. Do not create or alter the Athena table or its partitions.
`;
}
