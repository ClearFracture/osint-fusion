# Belvedere Handoff Runbook

1. Analyst creates a collection request in OSINT-Fusion.
2. App writes `requests/{request-id}/request.json` and `cube/.keep`, and updates `registry/requests.json`.
3. Analyst opens the Belvedere pipeline link and pastes the generated agent message into a **new** chat. No pipeline exists yet to modify. The message contains the cube contract (S3 layout, artifact ownership, parquet file layout) and this request's narrative, geofence, time range, source types, and cube prefix. It tells the pipeline to read `registry/schemas/index.json` before adding a schema, and not to create or alter the Athena table or partitions.
4. Belvedere creates the pipeline from that prompt. It reads `request.json` and does not rewrite it, `registry/requests.json`, or `cube/.keep`.
5. The pipeline selects cataloged sources, filters each source to the geofence and time range when those were provided, and writes one fused cube.
6. On completion Belvedere writes:
   - `cube/_manifest.json` with `status: ready` or `failed` (`building` while the run is in progress)
   - Parquet under `cube/data/source_type=…/source_producer=…/`
   - Artifacts under `cube/artifacts/` when rows reference binaries
   - A new payload JSON Schema appended under `registry/schemas/` only when no schema already in the registry matches the payload
7. Analyst clicks **Refresh readiness** in OSINT-Fusion. The app registers Glue partitions on the shared Athena table and unlocks exploration tabs.
