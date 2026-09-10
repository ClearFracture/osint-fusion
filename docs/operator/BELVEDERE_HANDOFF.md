# Belvedere Handoff Runbook

1. Analyst creates a collection request in OSINT-Fusion.
2. App writes `requests/{request-id}/request.json` and updates `registry/requests.json`.
3. Analyst opens the Belvedere pipeline link and pastes the generated agent message.
4. Belvedere resolves the S3 destination from `request-id` via its catalog (`cf-hackathon/osint-fusion-app`).
5. On completion Belvedere writes:
   - `cube/_manifest.json` with `status: ready` or `failed`
   - Parquet under `cube/data/source_type=…/source_producer=…/`
   - Glue partitions on shared `osint_cube` table
   - New payload JSON Schemas in `registry/schemas/` when needed (not per-cube schema files)
6. Analyst clicks **Refresh readiness** in OSINT-Fusion to unlock exploration tabs.
