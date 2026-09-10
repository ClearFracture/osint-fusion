import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '../../components/Panel';
import { sourceTypeLabel } from '../../types/cube';
import { useAwsCredentials } from '../../contexts/AwsCredentialsContext';
import {
  buildPayloadSchemaRefsQuery,
  buildProducersBreakdownQuery,
  runQuery,
} from '../../lib/aws/athenaRepository';
import {
  listSourceTypePrefixes,
  loadPayloadSchemaRegistry,
  resolveSchemaLabel,
} from '../../lib/schemaService';

interface SourceTypeGroup {
  id: string;
  producers: { id: string; recordCount: number }[];
}

function groupProducersBySourceType(rows: Record<string, string | null>[]): SourceTypeGroup[] {
  const groups = new Map<string, SourceTypeGroup>();

  for (const row of rows) {
    const sourceType = row.source_type ?? '';
    const producer = row.source_producer ?? '';
    if (!sourceType || !producer) {
      continue;
    }

    const recordCount = Number(row.record_count ?? 0);
    const existing = groups.get(sourceType) ?? { id: sourceType, producers: [] };
    existing.producers.push({ id: producer, recordCount });
    groups.set(sourceType, existing);
  }

  return [...groups.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function SourcesTab({ requestId }: { requestId: string }) {
  const { s3Client, athenaClient } = useAwsCredentials();
  const [expanded, setExpanded] = useState<string | null>(null);

  const registryQuery = useQuery({
    queryKey: ['payload-schema-registry'],
    queryFn: () => loadPayloadSchemaRegistry(s3Client!),
    enabled: Boolean(s3Client),
  });

  const producersQuery = useQuery({
    queryKey: ['producers-breakdown', requestId],
    queryFn: () => runQuery(athenaClient!, buildProducersBreakdownQuery(requestId)),
    enabled: Boolean(athenaClient),
    retry: false,
  });

  const payloadRefsQuery = useQuery({
    queryKey: ['payload-schema-refs', requestId],
    queryFn: () => runQuery(athenaClient!, buildPayloadSchemaRefsQuery(requestId)),
    enabled: Boolean(athenaClient),
    retry: false,
  });

  const fallbackQuery = useQuery({
    queryKey: ['source-prefixes', requestId],
    queryFn: () => listSourceTypePrefixes(s3Client!, requestId),
    enabled: Boolean(s3Client && producersQuery.isError),
    retry: false,
  });

  const registry = registryQuery.data;
  const sourceTypes = useMemo(
    () => (producersQuery.data ? groupProducersBySourceType(producersQuery.data) : []),
    [producersQuery.data],
  );
  const payloadSchemaRefs = useMemo(
    () =>
      payloadRefsQuery.data
        ?.map((row) => row.payload_schema_ref)
        .filter((ref): ref is string => Boolean(ref)) ?? [],
    [payloadRefsQuery.data],
  );

  if (producersQuery.isLoading && !producersQuery.isError) {
    return <p className="text-tactical-muted">Loading sources…</p>;
  }

  if (sourceTypes.length > 0) {
    return (
      <div className="space-y-4">
        {payloadSchemaRefs.length > 0 && (
          <Panel title="Payload Types">
            <ul className="flex flex-wrap gap-2">
              {payloadSchemaRefs.map((ref) => (
                <li
                  key={ref}
                  className="rounded border border-tactical-border px-2 py-1 text-sm"
                >
                  {resolveSchemaLabel(registry ?? null, ref)}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <Panel title="Source Types">
          <ul className="space-y-2">
            {sourceTypes.map((sourceType) => (
              <li key={sourceType.id} className="rounded border border-tactical-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-tactical-bg/40"
                  onClick={() =>
                    setExpanded(expanded === sourceType.id ? null : sourceType.id)
                  }
                >
                  <span className="font-display font-semibold">
                    {sourceTypeLabel(sourceType.id)}
                  </span>
                  <span className="text-sm text-tactical-muted">
                    {sourceType.producers.length} producers
                  </span>
                </button>
                {expanded === sourceType.id && (
                  <ul className="border-t border-tactical-border bg-tactical-bg/30 px-4 py-2">
                    {sourceType.producers.map((producer) => (
                      <li
                        key={producer.id}
                        className="flex justify-between py-2 text-sm"
                      >
                        <span>{producer.id}</span>
                        <span className="text-tactical-muted">
                          {producer.recordCount.toLocaleString()} records
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  const prefixes = fallbackQuery.data ?? [];
  if (prefixes.length === 0) {
    return (
      <p className="text-tactical-muted">
        No source data discovered yet. Athena or S3 partition paths are required.
      </p>
    );
  }

  return (
    <Panel title="Source Types (from S3 partitions)">
      <p className="mb-3 text-sm text-amber-200">
        Athena unavailable — showing source types inferred from parquet partition paths only.
      </p>
      <ul className="space-y-1">
        {prefixes.map((type) => (
          <li key={type} className="text-sm">
            {sourceTypeLabel(type)}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
