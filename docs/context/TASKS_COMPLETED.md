# Tasks Completed

## v1 Implementation (2026-09-09)

Full OSINT-Fusion SPA implemented per `PROJECT_PLAN.md`: Phases 0–4.

### Phase 0 — Foundation
- **P0-1:** Vite + React + TypeScript, React Router, Tailwind military theme, Vitest, ESLint
- **P0-2:** `.env.example`, README with local dev instructions
- **P0-3:** Credential gate (STS validation), session storage, protected routes, unit tests
- **P0-4:** S3 repository (`getJsonObject`, `putJsonObject`, `listKeys`), mocked tests

### Phase 1 — Request Lifecycle
- **P1-1:** TypeScript types, registry read/write, `createRequest` service
- **P1-2:** Landing page catalog with status badges and empty state
- **P1-3:** New request wizard (narrative, Leaflet map draw geofence, time range)
- **P1-4:** Belvedere handoff page with pipeline link and copy-ready agent message
- **P1-5:** Manual readiness refresh via `_manifest.json` / schema + parquet checks
- **P1-6:** Request detail shell with locked/unlocked exploration tabs

### Phase 2 — Metadata Exploration
- **P2-1:** Cube `schema.json` and global payload registry readers; S3 partition fallback
- **P2-2:** Athena repository (query execution, overview/breakdown SQL builders)
- **P2-3:** Overview tab with metric tiles and source-type bar breakdown (Athena + schema fallback)
- **P2-4:** Sources tab with expandable producers and payload schema labels

### Phase 3 — Visualization Connect
- **P3-1:** Connect tab with QGIS and Tableau tool cards
- **P3-2:** QGIS text instructions (GDAL `/vsis3/`, credentials, geo payload notes)
- **P3-3:** Tableau text instructions (Athena connector, `request_id` filter)

### Phase 4 — Hardening
- **P4-1:** Error states on landing, credentials, request detail, Athena fallback messaging
- **P4-2:** 22 unit/component tests passing; utilities and repositories covered
- **P4-3:** Build verified (`npm run build` → `dist/`); deploy steps in README
- **P4-4:** `docs/operator/IAM_POLICY.md`, `docs/operator/BELVEDERE_HANDOFF.md`

### Key paths
- App entry: `src/main.tsx`, routes in `src/App.tsx`
- AWS layer: `src/lib/aws/`, services in `src/lib/`
- Pages: `src/pages/`

### Infrastructure bootstrap (2026-09-09)
- Auto-creates S3 registry, payload schema registry, and Athena `osint_cube` table on login when missing
- README manual setup section and updated IAM policy for Glue create permissions

### Validation
- `npm test` — 25 tests passed
- `npm run build` — succeeded
- `npm run lint` — 0 errors (1 react-refresh warning on context hook)

### Request detail topic panels (2026-09-09)
- Extracted shared `RequestTopicPanels` component used by both create and detail views
- Detail page shows the same narrative textarea, geofence map, and datetime-local time range inputs as the creation wizard, all read-only
- `GeofenceMap` gained `readOnly` mode (display geometry, no draw controls, map interaction disabled)
- Added `isoToDatetimeLocal` helper (`src/lib/dateTimeLocal.ts`) to format stored ISO timestamps for datetime-local inputs
- Refactored `NewRequestPage` to use shared panels; edit mode no longer passes `value` to map to avoid remount loops while drawing
- Validation: `npm test` — 35 tests passed; `npm run build` — succeeded

### Schema registry-only storage (2026-09-10)
- JSON Schemas live only under `registry/schemas/`; removed per-cube `schema.json` from plan and app
- `PROJECT_PLAN.md` §4 documents purpose and format for every app registry and data cube artifact
- Readiness: `_manifest.json` status `ready` or parquet presence under `cube/data/` (no schema.json check)
- Exploration tabs query Athena for metrics, producer breakdown, and `payload_schema_ref` values; S3 partition path fallback when Athena unavailable
- Belvedere agent message and handoff runbook updated accordingly
- Validation: `npm test` — 38 tests passed; `npm run build` — succeeded

### Optional source type selection on requests (2026-09-10)
- Added optional `topic.source_types` to request definition with canonical enum checkboxes on create and read-only badges on detail view
- Included in Belvedere agent message, topic validation, and registry summaries
- Validation: `npm test`; `npm run build`

### Required topic / question narrative (2026-09-10)
- Narrative is the only required topic field; geofence, time range, and source types remain optional
- UI panel relabeled to "Topic / Question Narrative"; optional panels marked in titles
- Validation: `npm test`; `npm run build`

### Athena partition registration (2026-09-10)
- Review found app created `osint_cube` but never registered partitions; `MSCK REPAIR` incompatible with `{request-id}/cube/data/…` path layout
- Added S3 partition discovery and `ALTER TABLE ADD IF NOT EXISTS PARTITION … LOCATION` on ready request detail load and manual refresh
- Updated IAM policy docs with `glue:CreatePartition`
- Validation: `npm test`; `npm run build`

### Readiness debug logging (2026-09-10)
- Added namespaced console logger and instrumented readiness check, status persistence, and manual refresh flow
- Logs S3 URIs, manifest parsing, parquet listing, decision branch, and status mismatch hints
- Validation: `npm test` — 41 passed; `npm run build` — succeeded
