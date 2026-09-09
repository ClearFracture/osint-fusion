import { useQuery } from '@tanstack/react-query';
import { Panel } from '../../components/Panel';
import { SOURCE_TYPE_LABELS } from '../../types/cube';
import { useAwsCredentials } from '../../contexts/AwsCredentialsContext';
import {
  buildOverviewQuery,
  buildSourceBreakdownQuery,
  runQuery,
} from '../../lib/aws/athenaRepository';
import { loadCubeSchema } from '../../lib/schemaService';

export function OverviewTab({ requestId }: { requestId: string }) {
  const { s3Client, athenaClient } = useAwsCredentials();

  const schemaQuery = useQuery({
    queryKey: ['cube-schema', requestId],
    queryFn: () => loadCubeSchema(s3Client!, requestId),
    enabled: Boolean(s3Client),
  });

  const metricsQuery = useQuery({
    queryKey: ['overview-metrics', requestId],
    queryFn: async () => {
      const rows = await runQuery(athenaClient!, buildOverviewQuery(requestId));
      return rows[0] ?? {};
    },
    enabled: Boolean(athenaClient),
    retry: false,
  });

  const breakdownQuery = useQuery({
    queryKey: ['source-breakdown', requestId],
    queryFn: () => runQuery(athenaClient!, buildSourceBreakdownQuery(requestId)),
    enabled: Boolean(athenaClient),
    retry: false,
  });

  const schema = schemaQuery.data;
  const useSchemaFallback = metricsQuery.isError && schema;

  const totalRecords = useSchemaFallback
    ? String(schema.total_records)
    : metricsQuery.data?.total_records ?? '—';
  const sourceTypeCount = useSchemaFallback
    ? String(schema.source_types.length)
    : metricsQuery.data?.source_type_count ?? '—';
  const producerCount = useSchemaFallback
    ? String(schema.source_types.reduce((sum, t) => sum + t.producers.length, 0))
    : metricsQuery.data?.producer_count ?? '—';

  const breakdown = breakdownQuery.isError
    ? schema?.source_types.map((t) => ({
        source_type: t.id,
        record_count: String(t.producers.reduce((s, p) => s + p.record_count, 0)),
      })) ?? []
    : breakdownQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Total Records" value={totalRecords} />
        <MetricTile label="Source Types" value={sourceTypeCount} />
        <MetricTile label="Producers" value={producerCount} />
      </div>

      {metricsQuery.isError && !schema && (
        <p className="text-sm text-amber-200">
          Athena unavailable — metrics require the osint_cube table or schema.json from Belvedere.
        </p>
      )}

      <Panel title="Records by Source Type">
        {breakdown.length === 0 ? (
          <p className="text-tactical-muted">No breakdown data available.</p>
        ) : (
          <ul className="space-y-2">
            {breakdown.map((row) => {
              const label = SOURCE_TYPE_LABELS[row.source_type ?? ''] ?? row.source_type;
              const count = row.record_count ?? '0';
              const max = Math.max(...breakdown.map((r) => Number(r.record_count ?? 0)), 1);
              const width = `${(Number(count) / max) * 100}%`;
              return (
                <li key={row.source_type}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-tactical-muted">{count}</span>
                  </div>
                  <div className="h-2 rounded bg-tactical-bg">
                    <div className="h-2 rounded bg-tactical-gold" style={{ width }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-tactical-border bg-tactical-panel/80 p-4 text-center">
      <p className="font-display text-2xl font-bold text-tactical-gold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-tactical-muted">{label}</p>
    </div>
  );
}
