# Tasks Planned

Work items to reach v1 of OSINT-Fusion. Ordered roughly by dependency. Do not start a task without moving it to `TASKS_UNDERWAY.md` first.

---

## Phase 0 — Foundation

### P0-1: Project scaffold
- Initialize Vite + React + TypeScript SPA
- Add React Router, Tailwind CSS, military theme tokens (colors, fonts, panel styles)
- Add ESLint, Vitest, basic CI test script
- **Blocked by:** none

### P0-2: Context and configuration
- Add `.env.example` with `VITE_S3_BUCKET`, `VITE_AWS_REGION`, `VITE_BELVEDERE_PIPELINE_URL`, Athena settings
- Document local dev setup in README
- **Blocked by:** none

### P0-3: AWS credential gate
- Build credential entry UI (access key, secret, optional session token, region)
- Validate via `sts:GetCallerIdentity` using AWS SDK v3
- Store credentials in session context; clear on logout/tab close
- Gate all routes behind valid credentials
- Unit tests for credential validation helper
- **Blocked by:** none

### P0-4: S3 repository layer
- Implement repository module for S3 read/write (ListObjects, GetObject, PutObject)
- Inject credentials from session context
- Unit tests with mocked S3 client
- **Blocked by:** P0-3

---

## Phase 1 — Request Lifecycle

### P1-1: Request registry
- Define TypeScript types for `request.json` and registry index
- Read `registry/requests.json` for landing page
- Write updated registry on new request creation
- Integration test against LocalStack or mocked S3
- **Blocked by:** P0-4

### P1-2: Landing page
- Request catalog table/cards with status badges
- Empty state and loading/error states
- Navigate to request detail and new request flow
- **Blocked by:** P1-1

### P1-3: New request wizard
- Form for topic narrative, geofence (GeoJSON), time range (all optional; require at least one)
- Generate UUID, write `request.json`, create cube prefix, update registry
- **Blocked by:** P1-1

### P1-4: Belvedere handoff panel
- Display pipeline URL from config
- Generate and display copy-ready agent message (topic fields + request ID)
- **Blocked by:** P1-3, BEL-1 (message may need S3 prefix once resolved)

### P1-5: Readiness detection
- Poll or manual refresh: check `_manifest.json`, `schema.json`, parquet presence
- Update local request status display (pending → building → ready / failed)
- **Blocked by:** P1-1, BEL-2, BEL-3

### P1-6: Request detail shell
- Route `/requests/:id` with status panel and tab shell (Overview, Sources, Connect)
- Lock exploration tabs until ready
- **Blocked by:** P1-5

---

## Phase 2 — Metadata Exploration

### P2-1: Schema reader
- Fetch and parse per-cube `schema.json` for source types and producers
- Fetch global `registry/schemas/index.json` and resolve `payload_schema_ref` labels for display
- Fallback: list S3 prefixes under `cube/data/source_type=*` if cube schema missing
- Unit tests for parsers
- **Blocked by:** P1-6, SCH-1, SCH-2

### P2-2: Athena repository layer
- Start query, poll completion, fetch results
- Parameterized queries for record counts and distinct dimensions
- Unit tests with mocked Athena client
- **Blocked by:** P0-4, AWS-2, AWS-3

### P2-3: Overview tab
- Metric tiles: total records, source type count, producer count
- Simple breakdown by source type (bar or list)
- **Blocked by:** P2-1, P2-2

### P2-4: Sources tab
- Expandable source type list with producer record counts
- Optional: sample record preview (title, summary, payload type label from schema registry)
- **Blocked by:** P2-3

---

## Phase 3 — Visualization Connect

### P3-1: Connect tab shell
- Tool cards for QGIS and Tableau
- Tool selection → instruction panel
- **Blocked by:** P1-6

### P3-2: QGIS direct S3 instructions
- Document S3 URI, partition layout, GDAL `/vsis3/` path, AWS credential setup
- Link to global payload JSON Schema registry entries used by the cube (e.g., geo payloads via `geojson-feature`)
- Text-only step instructions for v1
- **Blocked by:** P3-1

### P3-3: Tableau instructions
- Athena connector steps: shared `osint_cube` table, filter by `request_id`
- Text-only for v1
- **Blocked by:** P3-1

---

## Phase 4 — Hardening

### P4-1: Error and edge-case handling
- Invalid credentials, S3 permission denied, empty registry, stale BUILDING status
- **Blocked by:** Phases 1–3 feature-complete

### P4-2: Test coverage pass
- ≥80% coverage on new utilities and repositories
- Component tests for credential gate and landing page
- **Blocked by:** P4-1

### P4-3: Deployment
- Static build pipeline, S3/CloudFront deploy docs or script
- **Blocked by:** none

### P4-4: Operator documentation
- IAM policy template for analysts
- Belvedere handoff runbook
- **Blocked by:** none

