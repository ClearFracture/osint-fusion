# OSINT-Fusion

Single-page application for managing OSINT collection requests, handoff to Belvedere, and exploring resulting data cubes on S3.

## Prerequisites

- Node.js 20+
- AWS credentials with access to `cf-hackathon/osint-fusion-app`

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 and enter AWS credentials at the credential gate.

On first login the app **automatically bootstraps** missing infrastructure:

- `registry/requests.json` (empty request catalog)
- `registry/schemas/index.json` plus bootstrap payload JSON Schema files
- `athena-results/.keep` (marker for Athena output prefix)
- Glue/Athena database and `osint_cube` external table (via Athena DDL)

A banner reports what was created or if manual setup is needed (usually insufficient IAM permissions).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | ESLint |

## Configuration

See `.env.example` for `VITE_*` variables (bucket, prefix, Belvedere URL, Athena settings).

| Variable | Default |
|----------|---------|
| `VITE_S3_BUCKET` | `cf-hackathon` |
| `VITE_S3_PREFIX` | `osint-fusion-app` |
| `VITE_AWS_REGION` | `us-east-1` |
| `VITE_ATHENA_DATABASE` | `osint_fusion` |
| `VITE_ATHENA_OUTPUT` | `s3://cf-hackathon/osint-fusion-app/athena-results/` |

## Manual AWS setup

Use this if automatic bootstrap fails (e.g. credentials lack Glue create permissions) or you prefer to provision resources ahead of the app.

### IAM

Ensure credentials include S3 read/write on `cf-hackathon/osint-fusion-app/*`, Athena query permissions, and Glue catalog read/create. See [docs/operator/IAM_POLICY.md](docs/operator/IAM_POLICY.md).

### S3 objects

Create these objects (empty JSON is fine for the registry; schema files should be valid JSON Schema):

```
s3://cf-hackathon/osint-fusion-app/registry/requests.json
s3://cf-hackathon/osint-fusion-app/registry/schemas/index.json
s3://cf-hackathon/osint-fusion-app/registry/schemas/generic-object.json
s3://cf-hackathon/osint-fusion-app/registry/schemas/geojson-feature.json
s3://cf-hackathon/osint-fusion-app/registry/schemas/bluesky-post.json
s3://cf-hackathon/osint-fusion-app/registry/schemas/osm-element.json
s3://cf-hackathon/osint-fusion-app/registry/schemas/stac-item.json
s3://cf-hackathon/osint-fusion-app/athena-results/.keep
```

Example empty registry:

```json
{ "version": 1, "requests": [] }
```

Example `registry/schemas/index.json` (abbreviated):

```json
{
  "version": 1,
  "schemas": [
    {
      "id": "geojson-feature",
      "label": "GeoJSON Feature",
      "description": "RFC 7946 GeoJSON Feature object",
      "s3_uri": "s3://cf-hackathon/osint-fusion-app/registry/schemas/geojson-feature.json",
      "media_type": "application/schema+json"
    }
  ]
}
```

Upload with AWS CLI:

```bash
aws s3 cp registry-requests.json s3://cf-hackathon/osint-fusion-app/registry/requests.json
```

### Athena database and table

Run in the Athena console (or CLI) with query results output set to `s3://cf-hackathon/osint-fusion-app/athena-results/`:

```sql
CREATE DATABASE IF NOT EXISTS osint_fusion;
```

```sql
CREATE EXTERNAL TABLE IF NOT EXISTS osint_cube (
  record_id string,
  observed_at timestamp,
  ingested_at timestamp,
  payload_json string,
  payload_schema_ref string,
  lat double,
  lon double,
  title string,
  summary string,
  confidence double,
  artifact_refs array<struct<artifact_id:string,mime_type:string,s3_uri:string,role:string>>,
  tags array<string>,
  lineage struct<pipeline_run_id:string,belvedere_chat_id:string,extractor_version:string>
)
PARTITIONED BY (request_id string, source_type string, source_producer string)
STORED AS PARQUET
LOCATION 's3://cf-hackathon/osint-fusion-app/requests/';
```

After Belvedere writes parquet partitions, run `MSCK REPAIR TABLE osint_cube` (or rely on Belvedere to register partitions).

## Documentation

- [Project goals](docs/context/PROJECT_GOALS.md)
- [Project plan](docs/context/PROJECT_PLAN.md)
- [IAM policy template](docs/operator/IAM_POLICY.md)
- [Belvedere handoff runbook](docs/operator/BELVEDERE_HANDOFF.md)

## Deployment

```bash
npm run build
```

Deploy the `dist/` folder to static hosting (S3 + CloudFront). Ensure environment variables are set at build time.
