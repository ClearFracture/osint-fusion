# Tasks Completed

## Archive summary (through 2026-09-10)

The archived work built the OSINT-Fusion SPA: credential gate, S3 registry, request create/detail/handoff, Athena exploration, QGIS/Tableau connect text, payload schema registry, optional source types, and a required topic narrative. Bootstrap creates the Glue database and `osint_cube` table on login. Full notes: [TASKS_COMPLETED_2026-10-02_1347.md](TASKS_COMPLETED_2026-10-02_1347.md).

### Athena partition registration (2026-09-10)
- Review found app created `osint_cube` but never registered partitions; `MSCK REPAIR` incompatible with `{request-id}/cube/data/…` path layout
- Added S3 partition discovery and `ALTER TABLE ADD IF NOT EXISTS PARTITION … LOCATION` on ready request detail load and manual refresh
- Updated IAM policy docs with `glue:CreatePartition`
- Validation: `npm test`; `npm run build`

### Readiness debug logging (2026-09-10)
- Added namespaced console logger and instrumented readiness check, status persistence, and manual refresh flow
- Logs S3 URIs, manifest parsing, parquet listing, decision branch, and status mismatch hints
- Validation: `npm test` — 41 passed; `npm run build` — succeeded

### QGIS Athena VRT instructions (2026-10-02)
- Connect tab QGIS steps now include a copy-ready OGR VRT instead of a `/vsis3/` directory path
- VRT JDBC URL uses `VITE_AWS_REGION`, `VITE_ATHENA_OUTPUT`, and the Simba JDBC 2.x driver class; SQL targets `VITE_ATHENA_DATABASE`.`VITE_ATHENA_TABLE` (default `osint_cube`)
- Query selects the scalar cube columns and builds WKT from `payload_json` only for `payload_schema_ref = 'geojson-feature'`, unwrapping the Feature via `$.geometry` before `from_geojson_geometry` / `to_geometry` / `ST_AsText`, filtered by `request_id`
- `try(...)` skips rows whose payload is not valid JSON so one bad record does not fail the layer
- Verified in the browser on a ready request: QGIS panel shows the VRT for that request id; Tableau instructions stay text-only
- Validation: `npm test` — 45 passed; `npm run build` — succeeded

### Wrapped collection-request topics (2026-10-02)
- Catalog list loads each `request.json` narrative so older 80-character registry summaries no longer hide the rest of the topic
- New registry summaries keep the full trimmed narrative
- Topic column uses a fixed table layout with `whitespace-pre-wrap` and `break-words`
- Verified in the browser: the Russia-border topic wraps to two lines and the full sentence is in the cell
- Validation: `npm test` — 47 passed

### Self-contained Belvedere handoff prompt (2026-10-02)
- Agent message now tells Belvedere to create a pipeline from scratch and includes the S3 layout, app-owned objects that must not be rewritten, manifest lifecycle, full parquet structs, Glue DDL, and `ALTER TABLE … ADD PARTITION … LOCATION`
- Source types, when set, must be covered; other canonical types are added when those are insufficient. Geofence uses longitude/latitude and drops unlocated rows. Time range filters `observed_at` inclusive
- Request section carries the id, read-only `request.json` URI, cube prefix, narrative, geofence, time range, and source types, filled from app config
- `PROJECT_PLAN.md`, `PROJECT_GOALS.md`, `README.md`, and `docs/operator/BELVEDERE_HANDOFF.md` updated to match
- Verified in the browser on request `f9823f86-5b64-49ef-b232-de3bd71b04ae`: the pasted prompt includes the contract and that request's narrative, polygon, and time range
- Validation: `npm test` — 47 passed

### Handoff prompt leaves Glue and schema discovery to the right owner (2026-10-02)
- Prompt no longer includes `CREATE TABLE` or `ALTER TABLE … ADD PARTITION`. It tells the pipeline the app creates the table and registers partitions on refresh
- Prompt no longer lists registered payload schemas. The pipeline must read `registry/schemas/index.json` and each schema document, and append a schema only when none match
- Plan, runbook, and README updated so partition registration stays an app responsibility
- Verified in the browser: the handoff text has the registry-read instruction and does not contain DDL or schema ids such as `geojson-feature`
- Validation: `npm test` — Belvedere handoff tests passed (3)
