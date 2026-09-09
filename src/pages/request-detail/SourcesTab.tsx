import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '../../components/Panel';
import { SOURCE_TYPE_LABELS } from '../../types/cube';
import { useAwsCredentials } from '../../contexts/AwsCredentialsContext';
import {
  loadCubeSchema,
  loadPayloadSchemaRegistry,
  listSourceTypePrefixes,
  resolveSchemaLabel,
} from '../../lib/schemaService';

export function SourcesTab({ requestId }: { requestId: string }) {
  const { s3Client } = useAwsCredentials();
  const [expanded, setExpanded] = useState<string | null>(null);

  const schemaQuery = useQuery({
    queryKey: ['cube-schema', requestId],
    queryFn: () => loadCubeSchema(s3Client!, requestId),
    enabled: Boolean(s3Client),
  });

  const registryQuery = useQuery({
    queryKey: ['payload-schema-registry'],
    queryFn: () => loadPayloadSchemaRegistry(s3Client!),
    enabled: Boolean(s3Client),
  });

  const fallbackQuery = useQuery({
    queryKey: ['source-prefixes', requestId],
    queryFn: () => listSourceTypePrefixes(s3Client!, requestId),
    enabled: Boolean(s3Client && !schemaQuery.data),
  });

  const schema = schemaQuery.data;
  const registry = registryQuery.data;

  if (schemaQuery.isLoading) {
    return <p className="text-tactical-muted">Loading sources…</p>;
  }

  if (schema) {
    return (
      <div className="space-y-4">
        {schema.payload_schema_refs.length > 0 && (
          <Panel title="Payload Types">
            <ul className="flex flex-wrap gap-2">
              {schema.payload_schema_refs.map((ref) => (
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
            {schema.source_types.map((sourceType) => (
              <li key={sourceType.id} className="rounded border border-tactical-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-tactical-bg/40"
                  onClick={() =>
                    setExpanded(expanded === sourceType.id ? null : sourceType.id)
                  }
                >
                  <span className="font-display font-semibold">
                    {SOURCE_TYPE_LABELS[sourceType.id] ?? sourceType.label}
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
                        <span>{producer.label}</span>
                        <span className="text-tactical-muted">
                          {producer.record_count.toLocaleString()} records
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
    return <p className="text-tactical-muted">No source data discovered yet.</p>;
  }

  return (
    <Panel title="Source Types (from S3 partitions)">
      <ul className="space-y-1">
        {prefixes.map((type) => (
          <li key={type} className="text-sm">
            {SOURCE_TYPE_LABELS[type] ?? type}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
