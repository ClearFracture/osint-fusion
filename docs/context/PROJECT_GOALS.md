# OSINT-Fusion — Project Goals

## Purpose

OSINT-Fusion is a single-page web application that helps analysts request, discover, and work with **OSINT data cubes** stored on AWS S3. The app does not build data cubes itself; it manages the **collection request lifecycle**, hands off topic requirements to **Belvedere**, and once a cube is available enables **metadata exploration** and **direct connection guidance** for external visualization tools (e.g., QGIS, Tableau).

## Business Objectives

1. **Reduce friction** between defining an intelligence collection need and having explorable, visualizable data.
2. **Provide a single catalog** of collection requests and their resulting data cubes so analysts can resume work without hunting S3 paths.
3. **Standardize data cube structure** on S3 so downstream tools and Athena queries behave predictably, with payload types defined by a **global JSON Schema registry** shared across all cubes.
4. **Support operational workflows** with a military-themed, instruction-forward UI that favors visual guidance over dense text.

## Functional Objectives

### Collection request management

- Display a landing page listing existing collection requests (topic, status, timestamps, record counts when available).
- Allow users to create a new request by providing topic information:
  - **Narrative text** describing the collection need
  - **Geofence** (optional) bounding the area of interest
  - **Time range** (optional) bounding the period of interest
- On new request creation:
  - Allocate a new S3 location (prefix) for the resulting data cube
  - Present a link to the Belvedere pipeline deployment
  - Present a copy-ready message for the Belvedere pipeline agent containing the topic information (Belvedere already has the target S3 bucket cataloged)

### Data cube readiness

- Poll S3 for signals that a data cube is available (manifest/schema/parquet presence).
- Transition request status from pending/building to ready and unlock exploration features.
- The app is **not** involved in pipeline execution or cube construction.

### Metadata exploration

Once a cube is ready, surface:

- Top-level metrics: source type count, source producer count, total record count
- Dynamic enumeration of **source types** from cube schema attributes (e.g., Infrastructure, Social Media, Entity Tracks, Earth Observations, Demographics)
- Per source type: list of **source producers** (e.g., OpenStreetMap, BlueSky) with record counts
- Resolve **payload type labels** from the global JSON Schema registry (`payload_schema_ref` on each record)

### Visualization connection

- Provide a "Connect to visualization app" flow for supported tools (initially QGIS; Tableau as stretch).
- Instructions must connect tools **directly to the S3 parquet data** — no application proxy, presigned URL service, or intermediate export step.
- Favor step-by-step visual instructions (screenshots/diagrams) over prose.

## Technical Constraints

| Constraint | Decision |
|------------|----------|
| Application type | Single-page JavaScript application |
| Data access | AWS S3 and Athena via **user-supplied AWS credentials** |
| Authentication | None — users provide their own AWS credentials to the app session |
| Authorization / tenancy | None — all application data is shared; any user with valid credentials and S3/Athena permissions sees all requests |
| User management | Out of scope |
| Hosting | Static SPA (e.g., S3 + CloudFront or local dev server) |
| Cube construction | External — Belvedere pipeline agent |

## Non-Goals (v1)

- Building or orchestrating Belvedere pipelines from within the app
- User accounts, SSO, or role-based access control
- Proxying S3/Athena access through a backend API
- In-app map rendering or full data browsing (metadata and connection guidance only)
- Writing or transforming parquet data from the app

## Success Criteria

1. Analyst can create a request, copy Belvedere handoff content, and see the request in the catalog.
2. App detects cube readiness without manual status updates.
3. Overview and source drill-down reflect actual cube contents via S3/Athena.
4. QGIS connection instructions enable a user with appropriate AWS credentials to read parquet directly from the documented S3 path.
5. Architecture and schema design in `PROJECT_PLAN.md` are finalized (2026-09-09).
